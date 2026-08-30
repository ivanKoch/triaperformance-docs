#!/usr/bin/env python3
"""
Sync Google Search Console performance data into the analytics Postgres on the VPS.

    Nightly (rolling re-pull of the last 5 days):
        ~/.analytics/venv/bin/python \
            ~/triaperformance-docs/automation/analytics/sync_gsc_data.py

    One-time historical backfill (16 months, the full GSC window):
        ~/.analytics/venv/bin/python \
            ~/triaperformance-docs/automation/analytics/sync_gsc_data.py --backfill

    Narrower re-pull, e.g. after fixing something:
        ... sync_gsc_data.py --start 2026-07-01 --end 2026-07-31


WHY THE API AND NOT THE BIGQUERY BULK EXPORT
--------------------------------------------
Both were considered. Verified facts, not assumptions:

  * The Search Console bulk data export to BigQuery is FORWARD-ONLY. Google's
    own setup doc: "The first export includes data for the day of the export";
    for anything earlier you must "use the Search Console API or the reports."
    Choosing the export as the only mechanism forfeits 16 months of history the
    site already has — and the content-engine feedback loop's stated trigger is
    "60-90 days of data", which the API satisfies on day one for every article
    published before today.

  * The API's limits are nowhere near binding at this volume. 25,000 rows per
    request with startRow pagination, against a site of ~60 articles.

  * The export would still require the API to be built anyway, for the backfill.
    That means two code paths, two failure modes, and a seam at the changeover
    date where the two disagree (the export nulls anonymized queries and stores
    sum_position; the API omits those rows and returns an average). A seam like
    that is a bug that shows up months later as an unexplained step in a chart.

So: ONE code path, the API, for both backfill and the nightly feed.

The bulk export stays the documented escape hatch, and the schema is written in
its exact shape so switching is a change of source rather than a migration. The
trigger to switch: a day's pull needing more than ~4 pagination round-trips per
request type, or the daily quota starting to bite. Neither is close today.

WHERE THIS DEPARTS FROM sync_pixel_data.py, AND WHY
---------------------------------------------------
The pixel script pulls incrementally from MAX(timestamp) and upserts with
ON CONFLICT DO NOTHING. That is correct for pixel hits, which are immutable
events. It is WRONG for Search Console, which REVISES the last few days after
first publishing them. DO NOTHING would freeze each day at its first,
incomplete version, and the error would be invisible — every row present, every
number quietly low.

So this script re-pulls a rolling window (default 5 days) and uses
ON CONFLICT DO UPDATE. Same idempotency guarantee, opposite conflict rule,
because the underlying data has the opposite mutability.
"""

import argparse
import glob
import os
import sys
import time
from datetime import date, datetime, timedelta, timezone

from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import psycopg2
from psycopg2.extras import execute_values

# The one shared credential/config file. Do not create a second one: the
# analytics Postgres password already lives in five places and rotating it is
# already a checklist job (see open-loops.md NOW). A sixth copy would break
# something on a cron hours after the rotation, with no obvious cause.
ENV_PATH = os.path.expanduser("~/.analytics/.env")
load_dotenv(ENV_PATH)

# Not secrets, so they live here as constants rather than adding keys to .env.
# A Domain property covers http/https and every subdomain; the sc-domain: prefix
# is required and is not a typo.
SITE_URL = os.environ.get("GSC_SITE_URL", "sc-domain:triaperformance.com")
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

PG_HOST = os.environ["PG_HOST"]
PG_PORT = os.environ["PG_PORT"]
PG_DB = os.environ["PG_DB"]
PG_USER = os.environ["PG_USER"]
PG_PASSWORD = os.environ["PG_PASSWORD"]

# GSC finalises a day's data with a lag. Anything inside this window is either
# absent or provisional, so the newest day we ask for is today - LAG_DAYS.
LAG_DAYS = 3
# How far back the nightly run re-pulls, to absorb Google's revisions of
# recently-published days.
ROLLING_DAYS = 5
# GSC keeps ~16 months. 480 days stays safely inside it.
BACKFILL_DAYS = 480

ROW_LIMIT = 25000  # API maximum per request


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def resolve_credentials_path():
    """Find the existing service-account key. Never create a new one."""
    explicit = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if explicit and os.path.exists(explicit):
        return explicit
    candidates = sorted(glob.glob(os.path.expanduser("~/.analytics/credentials/*.json")))
    if len(candidates) == 1:
        return candidates[0]
    if not candidates:
        raise RuntimeError(
            "No service-account key found. Expected GOOGLE_APPLICATION_CREDENTIALS "
            "to be set in ~/.analytics/.env, or exactly one .json in "
            "~/.analytics/credentials/."
        )
    raise RuntimeError(
        f"Ambiguous credentials: {len(candidates)} keys in ~/.analytics/credentials/. "
        "Set GOOGLE_APPLICATION_CREDENTIALS in ~/.analytics/.env to name the right one."
    )


def get_service():
    creds = service_account.Credentials.from_service_account_file(
        resolve_credentials_path(), scopes=SCOPES
    )
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def get_pg_conn():
    return psycopg2.connect(
        host=PG_HOST, port=PG_PORT, dbname=PG_DB, user=PG_USER, password=PG_PASSWORD
    )


def log(msg):
    print(f"[{datetime.now(timezone.utc).isoformat()}] {msg}", flush=True)


# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------

def fetch_day(service, day, dimensions):
    """All rows for one day and one dimension set, paginated.

    One day per request rather than a date-ranged request with `date` as a
    dimension: it keeps each response far below the 25k row cap, makes a partial
    failure cost one day instead of the whole window, and makes the retry
    boundary obvious.
    """
    rows = []
    start_row = 0
    while True:
        body = {
            "startDate": day.isoformat(),
            "endDate": day.isoformat(),
            "dimensions": dimensions,
            "type": "web",
            "rowLimit": ROW_LIMIT,
            "startRow": start_row,
            # dataState defaults to "final". Leave it there — "all" would pull
            # provisional rows that get revised, and this script already re-pulls
            # a rolling window to catch revisions properly.
        }
        for attempt in range(5):
            try:
                resp = service.searchanalytics().query(
                    siteUrl=SITE_URL, body=body
                ).execute()
                break
            except HttpError as e:
                if e.resp.status in (429, 500, 503) and attempt < 4:
                    wait = 2 ** attempt
                    log(f"  HTTP {e.resp.status} on {day} {dimensions}; retrying in {wait}s")
                    time.sleep(wait)
                    continue
                raise
        batch = resp.get("rows", [])
        rows.extend(batch)
        if len(batch) < ROW_LIMIT:
            break
        start_row += ROW_LIMIT
    return rows


# ---------------------------------------------------------------------------
# Transform
#
# The API returns `position` — a 1-based, impression-weighted average. The
# tables store the ADDITIVE form the BigQuery bulk export uses, because that is
# the only form that aggregates correctly:
#     sum_top_position = (position - 1) * impressions
# and, going back the other way,
#     avg_position = SUM(sum_top_position) / SUM(impressions) + 1
# which is exactly what the views do. Storing `position` per row instead would
# invite the commonest GSC analysis error there is: averaging an average.
# ---------------------------------------------------------------------------

def to_site_rows(day, api_rows):
    out = []
    for r in api_rows:
        query, country, device = r["keys"]
        impressions = int(r["impressions"])
        out.append((
            day,
            query,
            country.upper(),          # API returns alpha-3 lowercase, e.g. "arg"
            device.upper(),
            "web",
            impressions,
            int(r["clicks"]),
            (float(r["position"]) - 1.0) * impressions,
        ))
    return out


def to_url_rows(day, api_rows):
    out = []
    for r in api_rows:
        url, query, country, device = r["keys"]
        impressions = int(r["impressions"])
        out.append((
            day,
            url,
            query,
            country.upper(),
            device.upper(),
            "web",
            impressions,
            int(r["clicks"]),
            (float(r["position"]) - 1.0) * impressions,
        ))
    return out


# ---------------------------------------------------------------------------
# Write
# ---------------------------------------------------------------------------

SITE_UPSERT = """
    INSERT INTO gsc_site_query
        (data_date, query, country, device, search_type,
         impressions, clicks, sum_top_position)
    VALUES %s
    ON CONFLICT (data_date, query, country, device, search_type)
    DO UPDATE SET impressions      = EXCLUDED.impressions,
                  clicks           = EXCLUDED.clicks,
                  sum_top_position = EXCLUDED.sum_top_position,
                  synced_at        = now()
"""

URL_UPSERT = """
    INSERT INTO gsc_url_query
        (data_date, url, query, country, device, search_type,
         impressions, clicks, sum_position)
    VALUES %s
    ON CONFLICT (data_date, url, query, country, device, search_type)
    DO UPDATE SET impressions  = EXCLUDED.impressions,
                  clicks       = EXCLUDED.clicks,
                  sum_position = EXCLUDED.sum_position,
                  synced_at    = now()
"""


def write_rows(conn, sql, rows):
    if not rows:
        return 0
    with conn.cursor() as cur:
        execute_values(cur, sql, rows, page_size=1000)
    conn.commit()
    return len(rows)


def record_run(conn, source, started, window_start, window_end,
               fetched, written, status, detail=None):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO analytics_sync_log
                (source, run_started, run_finished, window_start, window_end,
                 rows_fetched, rows_written, status, detail)
            VALUES (%s, %s, now(), %s, %s, %s, %s, %s, %s)
            """,
            (source, started, window_start, window_end,
             fetched, written, status, detail),
        )
    conn.commit()


# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backfill", action="store_true",
                        help=f"pull the full {BACKFILL_DAYS}-day GSC history")
    parser.add_argument("--start", help="YYYY-MM-DD")
    parser.add_argument("--end", help="YYYY-MM-DD")
    args = parser.parse_args()

    latest = date.today() - timedelta(days=LAG_DAYS)
    if args.start or args.end:
        start = date.fromisoformat(args.start) if args.start else latest - timedelta(days=ROLLING_DAYS)
        end = date.fromisoformat(args.end) if args.end else latest
    elif args.backfill:
        start, end = latest - timedelta(days=BACKFILL_DAYS), latest
    else:
        start, end = latest - timedelta(days=ROLLING_DAYS), latest

    started = datetime.now(timezone.utc)
    log(f"GSC sync: {SITE_URL}, {start} .. {end} "
        f"({(end - start).days + 1} day(s))")

    service = get_service()
    conn = get_pg_conn()

    site_fetched = site_written = url_fetched = url_written = 0
    try:
        day = start
        while day <= end:
            site_api = fetch_day(service, day, ["query", "country", "device"])
            url_api = fetch_day(service, day, ["page", "query", "country", "device"])

            site_fetched += len(site_api)
            url_fetched += len(url_api)
            site_written += write_rows(conn, SITE_UPSERT, to_site_rows(day, site_api))
            url_written += write_rows(conn, URL_UPSERT, to_url_rows(day, url_api))

            if len(site_api) or len(url_api):
                log(f"  {day}: {len(site_api)} site row(s), {len(url_api)} url row(s)")
            day += timedelta(days=1)

        record_run(conn, "gsc_site", started, start, end,
                   site_fetched, site_written, "ok")
        record_run(conn, "gsc_url", started, start, end,
                   url_fetched, url_written, "ok")
        log(f"Done. site: {site_written} row(s) upserted, url: {url_written} row(s) upserted.")
        log("NOTE: rows whose query Google anonymised are omitted from the API "
            "entirely, so query-grouped impressions run below the property "
            "totals shown in the Search Console UI. That gap is expected and is "
            "not a bug in this script.")
    except Exception as e:
        try:
            record_run(conn, "gsc_site", started, start, end,
                       site_fetched, site_written, "error", str(e)[:1000])
        except Exception:
            pass
        log(f"ERROR: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
