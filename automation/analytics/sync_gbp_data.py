#!/usr/bin/env python3
"""
Sync Google Business Profile into the analytics Postgres on the VPS.

    Nightly:   ~/.analytics/venv/bin/python \
                 ~/.hermes/triaperformance-docs/automation/analytics/sync_gbp_data.py
    Backfill:  ... sync_gbp_data.py --backfill
    Window:    ... sync_gbp_data.py --start 2026-07-01 --end 2026-07-31

Three pulls: daily metrics, reviews, monthly search keywords.


CREDENTIAL — THE ONE THING THAT IS DIFFERENT FROM EVERY OTHER SCRIPT HERE
This is the only Google integration on this box that does NOT use the
`pixel-sync-vps` service account. Google's Business Profile API supports OAuth
2.0 only; service accounts are not a supported credential type (verified
against Google's setup doc, Aug 30 2026, after the opposite had been assumed
and written into §9).

So it reads GBP_CLIENT_ID / GBP_CLIENT_SECRET / GBP_REFRESH_TOKEN from the same
~/.analytics/.env as everything else. Same file on purpose: the rotation
checklist is one place per box, not one place per integration.

If this starts failing about a week after setup, the OAuth consent screen is in
`Testing` rather than `Internal` — Testing issues refresh tokens that expire
after 7 days. Check that before anything else.


TWO API BEHAVIOURS THAT DECIDE THE PARSING, BOTH FOUND BY PROBING
1. A daily metric with a value of ZERO omits the `value` key entirely. The
   response carries the date and nothing else. On a business this size that is
   the COMMON case -- on the first probe, exactly one of thirty days had a
   value. Reading d["value"] crashes; reading d.get("value") and storing NULL
   loses the distinction between "zero clicks" and "no data". It is a real,
   measured zero and is stored as 0.

2. Search keywords return EITHER an exact `value` OR a `threshold` meaning
   "fewer than this". The first real pull returned one keyword (the brand name)
   with threshold 15 and no value. These are stored in separate columns and a
   threshold is never written into the value column -- see the CHECK constraint
   in schema_analytics.sql section 8 for why.
"""

import argparse
import os
import sys
from datetime import date, datetime, timedelta, timezone

from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
import psycopg2
from psycopg2.extras import execute_values
import requests

load_dotenv(os.path.expanduser("~/.analytics/.env"))

PG = dict(host=os.environ["PG_HOST"], port=os.environ["PG_PORT"],
          dbname=os.environ["PG_DB"], user=os.environ["PG_USER"],
          password=os.environ["PG_PASSWORD"])

# Not secrets. Discovered once via the account/location listing and stable.
ACCOUNT = os.environ.get("GBP_ACCOUNT", "accounts/104101875334080602396")
LOCATION = os.environ.get("GBP_LOCATION", "locations/2657422760928328116")

SCOPES = ["https://www.googleapis.com/auth/business.manage"]
PERF = "https://businessprofileperformance.googleapis.com/v1"
# Reviews live ONLY on the legacy v4 API. The newer split APIs do not serve
# them. If Google finally retires v4, review counts go back to being manual and
# the other two pulls are unaffected -- which is why reviews are their own
# try/except and their own analytics_sync_log row.
V4 = "https://mybusiness.googleapis.com/v4"

METRICS = [
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH", "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS", "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "WEBSITE_CLICKS", "CALL_CLICKS", "BUSINESS_DIRECTION_REQUESTS",
    "BUSINESS_CONVERSATIONS",
]

LAG_DAYS = 3          # GBP finalises with a lag, like GSC
ROLLING_DAYS = 7
BACKFILL_DAYS = 540   # ~18 months, the documented lookback


def log(m):
    print(f"[{datetime.now(timezone.utc).isoformat()}] {m}", flush=True)


def auth_headers():
    c = Credentials(None,
                    refresh_token=os.environ["GBP_REFRESH_TOKEN"],
                    token_uri="https://oauth2.googleapis.com/token",
                    client_id=os.environ["GBP_CLIENT_ID"],
                    client_secret=os.environ["GBP_CLIENT_SECRET"],
                    scopes=SCOPES)
    c.refresh(Request())
    return {"Authorization": f"Bearer {c.token}"}


def get(url, headers, params, timeout=60):
    r = requests.get(url, headers=headers, params=params, timeout=timeout)
    if r.status_code != 200:
        raise RuntimeError(f"{url.rsplit('/', 1)[-1]} → HTTP {r.status_code}: {r.text[:400]}")
    return r.json()


# ---------------------------------------------------------------------------

def fetch_daily_metrics(h, start, end):
    params = [("dailyMetrics", m) for m in METRICS] + [
        ("dailyRange.start_date.year", start.year),
        ("dailyRange.start_date.month", start.month),
        ("dailyRange.start_date.day", start.day),
        ("dailyRange.end_date.year", end.year),
        ("dailyRange.end_date.month", end.month),
        ("dailyRange.end_date.day", end.day),
    ]
    data = get(f"{PERF}/{LOCATION}:fetchMultiDailyMetricsTimeSeries", h, params)
    rows = []
    for multi in data.get("multiDailyMetricTimeSeries", []):
        for series in multi.get("dailyMetricTimeSeries", []):
            metric = series.get("dailyMetric")
            for dv in (series.get("timeSeries") or {}).get("datedValues", []):
                d = dv.get("date") or {}
                if not all(k in d for k in ("year", "month", "day")):
                    continue
                # `value` absent == a real, measured zero. See the module docstring.
                rows.append((LOCATION, date(d["year"], d["month"], d["day"]),
                             metric, int(dv.get("value", 0))))
    return rows


def fetch_reviews(h):
    rows, token, total = [], None, None
    while True:
        params = {"pageSize": 50}
        if token:
            params["pageToken"] = token
        data = get(f"{V4}/{ACCOUNT}/{LOCATION}/reviews", h, params)
        total = data.get("totalReviewCount", total)
        for rv in data.get("reviews", []):
            reply = rv.get("reviewReply") or {}
            rows.append((
                rv["reviewId"], LOCATION, rv["createTime"], rv.get("updateTime"),
                STAR.get(rv.get("starRating")), rv.get("comment"),
                (rv.get("reviewer") or {}).get("displayName"),
                bool(reply), reply.get("updateTime"),
            ))
        token = data.get("nextPageToken")
        if not token:
            break
    return rows, total


# starRating is an enum string, not a number.
STAR = {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5}


def fetch_keywords(h, start, end):
    params = {
        "monthlyRange.start_month.year": start.year,
        "monthlyRange.start_month.month": start.month,
        "monthlyRange.end_month.year": end.year,
        "monthlyRange.end_month.month": end.month,
    }
    data = get(f"{PERF}/{LOCATION}/searchkeywords/impressions/monthly", h, params)
    rows = []
    # The response carries no month per row when a single month is requested, so
    # the month is attributed from the requested range's end. Pull one month at
    # a time (main() does) and this is exact rather than approximate.
    month = end.replace(day=1)
    for kc in data.get("searchKeywordsCounts", []):
        iv = kc.get("insightsValue") or {}
        value = int(iv["value"]) if "value" in iv else None
        thresh = int(iv["threshold"]) if "threshold" in iv else None
        if value is None and thresh is None:
            continue
        rows.append((LOCATION, month, kc.get("searchKeyword"), value, thresh))
    return rows


# ---------------------------------------------------------------------------

def keyword_window_start(start):
    """First of the month BEFORE `start`'s month. Year rollover included."""
    return (start.replace(day=1) - timedelta(days=1)).replace(day=1)


def keywords_detail(kw_empty, kw_kept):
    """The sync-log detail string. Separated so the test can assert on it."""
    if kw_kept:
        d = "empty fetch, prior rows KEPT: " + ",".join(kw_kept)
        if kw_empty:
            d += "; empty with no prior rows: " + ",".join(kw_empty)
        return d
    if kw_empty:
        return "empty fetch, no prior rows: " + ",".join(kw_empty)
    return None


def sync_keywords(conn, h, start, end):
    #
    # AN EMPTY FETCH NEVER DELETES. Fixed Aug 31, 2026: the DELETE sat
    # OUTSIDE the `if krows` guard, so a month that came back empty was
    # wiped and never re-inserted -- a 200 OK carrying nothing destroyed
    # stored history. That is the exact inverse of the GA4 upsert bug fixed
    # the day before, in a script touched in the same session, and the
    # reviews block thirty lines up already carried the right instinct in a
    # comment ("deleting first would briefly empty a table that other things
    # read") without anyone applying it here.
    #
    # Keywords are a replace-per-month set, so replacement is the correct
    # shape -- but only with something to replace them WITH. Within a live
    # month the value only accretes, and a completed month does not fall
    # back to zero, so an empty response is never better evidence than what
    # is already stored. Two empty cases, and only one of them is boring:
    #   empty, no prior rows    -- unremarkable on a profile doing 60-96
    #                              views a month. This is the common case
    #                              and is what Aug 31 2026 actually returned.
    #   empty, prior rows exist -- suspicious. Either the month has aged out
    #                              of Google's serving window, or the pull
    #                              is degraded. The stored rows are the
    #                              better answer, so they are KEPT and the
    #                              month is named in the sync log.
    kw_total = 0
    kw_empty, kw_kept = [], []
    m = start.replace(day=1)
    while m <= end:
        last = (m.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        krows = fetch_keywords(h, m, min(last, end))
        with conn.cursor() as cur:
            if krows:
                cur.execute("DELETE FROM gbp_search_keywords "
                            "WHERE location_id=%s AND month=%s", (LOCATION, m))
                execute_values(cur, """INSERT INTO gbp_search_keywords
                    (location_id, month, keyword, value, below_threshold)
                    VALUES %s""", krows)
            else:
                cur.execute("SELECT count(*) FROM gbp_search_keywords "
                            "WHERE location_id=%s AND month=%s", (LOCATION, m))
                (kw_kept if cur.fetchone()[0] else kw_empty).append(f"{m:%Y-%m}")
        conn.commit()
        kw_total += len(krows)
        m = (m.replace(day=28) + timedelta(days=4)).replace(day=1)

    return kw_total, kw_empty, kw_kept


def record_run(conn, source, started, ws, we, fetched, written, status, detail=None):
    with conn.cursor() as cur:
        cur.execute("""INSERT INTO analytics_sync_log
            (source, run_started, run_finished, window_start, window_end,
             rows_fetched, rows_written, status, detail)
            VALUES (%s,%s,now(),%s,%s,%s,%s,%s,%s)""",
                    (source, started, ws, we, fetched, written, status, detail))
    conn.commit()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--backfill", action="store_true")
    ap.add_argument("--start"); ap.add_argument("--end")
    args = ap.parse_args()

    latest = date.today() - timedelta(days=LAG_DAYS)
    if args.start or args.end:
        start = date.fromisoformat(args.start) if args.start else latest - timedelta(days=ROLLING_DAYS)
        end = date.fromisoformat(args.end) if args.end else latest
    elif args.backfill:
        start, end = latest - timedelta(days=BACKFILL_DAYS), latest
    else:
        start, end = latest - timedelta(days=ROLLING_DAYS), latest

    started = datetime.now(timezone.utc)
    log(f"GBP sync: {start} .. {end}")
    h = auth_headers()
    conn = psycopg2.connect(**PG)

    try:
        # --- daily metrics: delete the window, then insert (see the GA4 script
        # for why an upsert is wrong for a re-derived aggregate) ---
        rows = fetch_daily_metrics(h, start, end)
        with conn.cursor() as cur:
            cur.execute("DELETE FROM gbp_daily_metrics WHERE location_id=%s "
                        "AND data_date BETWEEN %s AND %s", (LOCATION, start, end))
            if rows:
                execute_values(cur, """INSERT INTO gbp_daily_metrics
                    (location_id, data_date, metric, value) VALUES %s""", rows)
        conn.commit()
        log(f"  metrics: {len(rows)} row(s)")
        record_run(conn, "gbp_metrics", started, start, end, len(rows), len(rows), "ok")

        # --- reviews: keyed on Google's review_id and UPSERTED, not replaced.
        # A review can be edited by its author, and the API returns the whole
        # set every time; deleting first would briefly empty a table that other
        # things read. ---
        try:
            rrows, total = fetch_reviews(h)
            with conn.cursor() as cur:
                execute_values(cur, """INSERT INTO gbp_reviews
                    (review_id, location_id, create_time, update_time, star_rating,
                     comment, reviewer_display_name, has_reply, reply_time)
                    VALUES %s
                    ON CONFLICT (review_id) DO UPDATE SET
                      update_time=EXCLUDED.update_time, star_rating=EXCLUDED.star_rating,
                      comment=EXCLUDED.comment, has_reply=EXCLUDED.has_reply,
                      reply_time=EXCLUDED.reply_time, synced_at=now()""", rrows)
            conn.commit()
            log(f"  reviews: {len(rrows)} row(s), Google reports total={total}")
            record_run(conn, "gbp_reviews", started, start, end,
                       len(rrows), len(rrows), "ok", f"totalReviewCount={total}")
        except Exception as e:
            # v4 is deprecated and may vanish. Its failure must not take the
            # metrics down with it.
            log(f"  reviews FAILED (legacy v4): {e}")
            record_run(conn, "gbp_reviews", started, start, end, None, None,
                       "error", str(e)[:1000])

        # --- keywords: one month per request, so the month is exact ---
        #
        # THE KEYWORD WINDOW IS NOT THE DAILY WINDOW, and conflating them was
        # costing data silently. Fixed Aug 31, 2026.
        #
        # `start` is `latest - 7 days`, which is correct for daily metrics and
        # wrong for keywords, because the two sources behave in opposite ways:
        #   GSC and the daily metrics REVISE recent days -> re-read a rolling
        #     window and the corrections land.
        #   GBP keywords are PUBLISHED LATE -> the month appears only after the
        #     month has closed. A rolling 7-day window stops reaching a month
        #     around the 8th, so each month was frozen at whatever partial state
        #     it held on the day the window left it, and the real figures
        #     published days later were never fetched.
        # So the keyword loop always reaches back to the FIRST OF THE PREVIOUS
        # MONTH. This is only safe because the DELETE below is now guarded: a
        # re-fetch that comes back empty leaves the stored month alone instead
        # of erasing it, which is what made re-reading closed months dangerous
        # before the guard existed. The two fixes are one fix.
        kw_start = keyword_window_start(start)
        kw_total, kw_empty, kw_kept = sync_keywords(conn, h, kw_start, end)
        detail = keywords_detail(kw_empty, kw_kept)
        log(f"  keywords: {kw_total} row(s)" + (f"  [{detail}]" if detail else ""))
        # "partial", not "ok": a month whose stored rows were kept because the
        # fetch came back empty is not a clean run, and analytics_pipeline_health
        # is the one place that difference is visible.
        record_run(conn, "gbp_keywords", started, kw_start, end, kw_total, kw_total,
                   "partial" if kw_kept else "ok", detail)

    except Exception as e:
        try:
            record_run(conn, "gbp_metrics", started, start, end, None, None,
                       "error", str(e)[:1000])
        except Exception:
            pass
        log(f"ERROR: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
