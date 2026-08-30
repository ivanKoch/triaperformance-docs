#!/usr/bin/env python3
"""
Sync GA4 data into the analytics Postgres on the VPS, from the GA4 -> BigQuery
daily export that has been running since July 21, 2026.

    Nightly (rolling re-pull of the last 3 days):
        ~/.analytics/venv/bin/python \
            ~/.hermes/triaperformance-docs/automation/analytics/sync_ga4_data.py

    Everything the export holds (its first day to now):
        ~/.analytics/venv/bin/python \
            ~/.hermes/triaperformance-docs/automation/analytics/sync_ga4_data.py --backfill


WHY THE BIGQUERY EXPORT AND NOT THE GA4 DATA API
-------------------------------------------------
The opposite call from the Search Console half of this pipeline, for a reason
specific to this property rather than a general preference:

  * The GA4 BigQuery export is forward-only — it cannot backfill data collected
    before the link was made. That is normally the argument against it. Here it
    costs nothing: the GA4 property (G-T69KEHW59J) and the BigQuery link were
    both created on July 21, 2026 (see ai-infrastructure-documentation.md §9).
    THE EXPORT COVERS THE PROPERTY'S ENTIRE LIFE. There is no history to lose.

  * It needs no new credential, no new API enablement and no new IAM grant.
    The export lands in `training-plan-analytics`, the same project
    sync_pixel_data.py already reads, and pixel-sync-vps already holds
    BigQuery Data Viewer + Job User there. Zero manual steps on this half.
    (Verify that once: if those roles were granted on the dataset rather than
    the project, they will not reach the GA4 dataset. See the handover notes.)

  * The export is event-level and unsampled. The Data API applies thresholding
    that suppresses rows at low user counts — exactly the regime this site is
    in — and the suppression is silent. For a per-country, per-page read on a
    site with this little traffic, the API would quietly return less than the
    truth, which is the worst possible failure for a feedback signal.

Same rolling-window logic as the GSC script, and for a softer version of the
same reason: late-arriving events can amend a recent day.
"""

import argparse
import os
import sys
from datetime import date, datetime, timedelta, timezone

from dotenv import load_dotenv
from google.cloud import bigquery
import psycopg2
from psycopg2.extras import execute_values

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from country_map import to_iso3  # noqa: E402

# The one shared config file — see the same note in sync_gsc_data.py. Do not
# add a second one.
load_dotenv(os.path.expanduser("~/.analytics/.env"))

# Project is derived from the existing BQ_TABLE rather than added as a new key.
BQ_TABLE = os.environ["BQ_TABLE"]                 # project.dataset.table
BQ_PROJECT = BQ_TABLE.split(".")[0]

PG_HOST = os.environ["PG_HOST"]
PG_PORT = os.environ["PG_PORT"]
PG_DB = os.environ["PG_DB"]
PG_USER = os.environ["PG_USER"]
PG_PASSWORD = os.environ["PG_PASSWORD"]

# The daily export lands roughly a day late; re-pull a small window so a
# late-arriving amendment is picked up rather than frozen.
LAG_DAYS = 1
ROLLING_DAYS = 3


def log(msg):
    print(f"[{datetime.now(timezone.utc).isoformat()}] {msg}", flush=True)


def get_pg_conn():
    return psycopg2.connect(
        host=PG_HOST, port=PG_PORT, dbname=PG_DB, user=PG_USER, password=PG_PASSWORD
    )


def find_ga4_dataset(client):
    """Locate the GA4 export dataset by shape, not by a hardcoded property id.

    GA4 exports into `analytics_<property_id>`. Discovering it means the numeric
    property id never has to be written down anywhere, and never goes stale.
    """
    rows = list(client.query(f"""
        SELECT schema_name
        FROM `{BQ_PROJECT}`.INFORMATION_SCHEMA.SCHEMATA
        WHERE schema_name LIKE 'analytics\\_%'
        ORDER BY schema_name
    """).result())
    names = [r.schema_name for r in rows]
    if not names:
        raise RuntimeError(
            f"No `analytics_*` dataset in project {BQ_PROJECT}. Either the "
            "GA4 -> BigQuery export is not linked, or the service account "
            "cannot see the dataset (check its BigQuery roles are on the "
            "PROJECT, not just on tracking_data)."
        )
    if len(names) > 1:
        raise RuntimeError(
            f"More than one GA4 export dataset in {BQ_PROJECT}: {names}. "
            "Name the intended one explicitly before running again."
        )
    return names[0]


def earliest_export_day(client, dataset):
    rows = list(client.query(f"""
        SELECT MIN(table_id) AS first_table
        FROM `{BQ_PROJECT}.{dataset}`.__TABLES_SUMMARY__
        WHERE table_id LIKE 'events\\_2%'
    """).result())
    first = rows[0].first_table
    if not first:
        raise RuntimeError(f"No events_ tables in {BQ_PROJECT}.{dataset}.")
    return date.fromisoformat(
        f"{first[7:11]}-{first[11:13]}-{first[13:15]}"
    )


# ---------------------------------------------------------------------------
# Queries.
#
# `_TABLE_SUFFIX BETWEEN @start AND @end` prunes to the exact days requested and
# — a useful accident of string ordering — also excludes the `events_intraday_`
# tables, whose suffix starts with 'i' and so falls outside any numeric range.
# Intraday data is provisional and would be double-counted the next day.
# ---------------------------------------------------------------------------

PAGE_SQL = """
WITH pv AS (
  SELECT
    PARSE_DATE('%Y%m%d', event_date) AS data_date,
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params)
      WHERE key = 'ga_session_id') AS session_id,
    COALESCE(
      REGEXP_EXTRACT(
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
        r'^https?://[^/]+([^?#]*)'),
      '/') AS page_path,
    COALESCE(geo.country, '(not set)') AS country,
    COALESCE(device.category, '(not set)') AS device_category,
    COALESCE(
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'session_engaged'),
      CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'session_engaged') AS STRING)
    ) AS session_engaged
  FROM `{project}.{dataset}.events_*`
  WHERE _TABLE_SUFFIX BETWEEN @start AND @end
    AND event_name = 'page_view'
)
SELECT
  data_date,
  page_path,
  country,
  device_category,
  COUNT(*) AS views,
  COUNT(DISTINCT CONCAT(user_pseudo_id, '.', CAST(session_id AS STRING))) AS sessions,
  COUNT(DISTINCT user_pseudo_id) AS total_users,
  COUNT(DISTINCT IF(session_engaged = '1',
        CONCAT(user_pseudo_id, '.', CAST(session_id AS STRING)), NULL)) AS engaged_sessions
FROM pv
GROUP BY 1, 2, 3, 4
"""

# Every event, not a whitelist. The three conversion events the site fires today
# (select_plan, begin_checkout, whatsapp_click — site/_includes/partials/tracking.njk)
# come along for free, and so does any event added later without this script
# needing an edit. A whitelist here would fail silently the first time the
# tracking partial gains an event.
EVENT_SQL = """
SELECT
  PARSE_DATE('%Y%m%d', event_date) AS data_date,
  event_name,
  COALESCE(
    REGEXP_EXTRACT(
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
      r'^https?://[^/]+([^?#]*)'),
    '/') AS page_path,
  COALESCE(geo.country, '(not set)') AS country,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_pseudo_id) AS users
FROM `{project}.{dataset}.events_*`
WHERE _TABLE_SUFFIX BETWEEN @start AND @end
GROUP BY 1, 2, 3, 4
"""

PAGE_UPSERT = """
    INSERT INTO ga4_page_day
        (data_date, page_path, country, country_iso3, device_category,
         sessions, total_users, views, engaged_sessions)
    VALUES %s
    ON CONFLICT (data_date, page_path, country, device_category)
    DO UPDATE SET country_iso3     = EXCLUDED.country_iso3,
                  sessions         = EXCLUDED.sessions,
                  total_users      = EXCLUDED.total_users,
                  views            = EXCLUDED.views,
                  engaged_sessions = EXCLUDED.engaged_sessions,
                  synced_at        = now()
"""

EVENT_UPSERT = """
    INSERT INTO ga4_event_day
        (data_date, event_name, page_path, country, country_iso3,
         event_count, users)
    VALUES %s
    ON CONFLICT (data_date, event_name, page_path, country)
    DO UPDATE SET country_iso3 = EXCLUDED.country_iso3,
                  event_count  = EXCLUDED.event_count,
                  users        = EXCLUDED.users,
                  synced_at    = now()
"""


def run_bq(client, sql, dataset, start, end):
    job_config = bigquery.QueryJobConfig(query_parameters=[
        bigquery.ScalarQueryParameter("start", "STRING", start.strftime("%Y%m%d")),
        bigquery.ScalarQueryParameter("end", "STRING", end.strftime("%Y%m%d")),
    ])
    return list(client.query(
        sql.format(project=BQ_PROJECT, dataset=dataset), job_config=job_config
    ).result())


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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backfill", action="store_true",
                        help="pull everything the export holds, from its first day")
    parser.add_argument("--start", help="YYYY-MM-DD")
    parser.add_argument("--end", help="YYYY-MM-DD")
    args = parser.parse_args()

    started = datetime.now(timezone.utc)
    client = bigquery.Client(project=BQ_PROJECT)
    dataset = find_ga4_dataset(client)
    log(f"GA4 export dataset: {BQ_PROJECT}.{dataset}")

    latest = date.today() - timedelta(days=LAG_DAYS)
    if args.start or args.end:
        start = date.fromisoformat(args.start) if args.start else latest - timedelta(days=ROLLING_DAYS)
        end = date.fromisoformat(args.end) if args.end else latest
    elif args.backfill:
        start, end = earliest_export_day(client, dataset), latest
    else:
        start, end = latest - timedelta(days=ROLLING_DAYS), latest

    log(f"GA4 sync: {start} .. {end}")
    conn = get_pg_conn()
    unmapped = set()

    try:
        page_api = run_bq(client, PAGE_SQL, dataset, start, end)
        page_rows = []
        for r in page_api:
            iso3, unexpected = to_iso3(r.country)
            if unexpected:
                unmapped.add(r.country)
            page_rows.append((
                r.data_date, r.page_path, r.country, iso3, r.device_category,
                int(r.sessions), int(r.total_users), int(r.views),
                int(r.engaged_sessions),
            ))
        page_written = write_rows(conn, PAGE_UPSERT, page_rows)

        event_api = run_bq(client, EVENT_SQL, dataset, start, end)
        event_rows = []
        for r in event_api:
            iso3, unexpected = to_iso3(r.country)
            if unexpected:
                unmapped.add(r.country)
            event_rows.append((
                r.data_date, r.event_name, r.page_path, r.country, iso3,
                int(r.event_count), int(r.users),
            ))
        event_written = write_rows(conn, EVENT_UPSERT, event_rows)

        detail = None
        if unmapped:
            detail = "unmapped countries: " + ", ".join(sorted(unmapped))
            log(f"WARNING: {detail} — country_iso3 is NULL for these rows. "
                "Add them to automation/analytics/country_map.py; they are "
                "invisible to the geography view until you do.")

        record_run(conn, "ga4_page", started, start, end,
                   len(page_api), page_written, "ok", detail)
        record_run(conn, "ga4_event", started, start, end,
                   len(event_api), event_written, "ok", detail)
        log(f"Done. page: {page_written} row(s), event: {event_written} row(s).")
    except Exception as e:
        try:
            record_run(conn, "ga4_page", started, start, end,
                       None, None, "error", str(e)[:1000])
        except Exception:
            pass
        log(f"ERROR: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
