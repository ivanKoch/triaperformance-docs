#!/usr/bin/env python3
"""
Sync new rows from BigQuery (training-plan-analytics.tracking_data.plan_views)
into the local analytics Postgres instance on the VPS.

Incremental: pulls everything with event_timestamp >= the current max timestamp
already in Postgres, then relies on the UNIQUE(event_timestamp, plan_id, ip_address)
constraint + ON CONFLICT DO NOTHING to avoid duplicating the boundary row(s).

Run manually to test:
    ~/.analytics/venv/bin/python ~/.analytics/scripts/sync_pixel_data.py

Intended to run nightly via cron (see deploy notes).
"""

import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
from google.cloud import bigquery
import psycopg2
from psycopg2.extras import execute_values

load_dotenv(os.path.expanduser("~/.analytics/.env"))

BQ_TABLE = os.environ["BQ_TABLE"]
PG_HOST = os.environ["PG_HOST"]
PG_PORT = os.environ["PG_PORT"]
PG_DB = os.environ["PG_DB"]
PG_USER = os.environ["PG_USER"]
PG_PASSWORD = os.environ["PG_PASSWORD"]

# Fallback start date if the Postgres table is empty — the pixel has been live since June 2025.
DEFAULT_START = datetime(2025, 6, 1, tzinfo=timezone.utc)


def get_pg_conn():
    return psycopg2.connect(
        host=PG_HOST, port=PG_PORT, dbname=PG_DB, user=PG_USER, password=PG_PASSWORD
    )


def get_last_synced_timestamp(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT MAX(event_timestamp) FROM plan_views;")
        (max_ts,) = cur.fetchone()
    return max_ts or DEFAULT_START


def fetch_new_rows(since_ts):
    client = bigquery.Client()
    query = f"""
        SELECT timestamp, plan_id, price, ip_address, user_agent, referrer
        FROM `{BQ_TABLE}`
        WHERE timestamp >= @since_ts
        ORDER BY timestamp
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("since_ts", "TIMESTAMP", since_ts)
        ]
    )
    return list(client.query(query, job_config=job_config).result())


def insert_rows(conn, rows):
    if not rows:
        return 0
    values = [
        (r.timestamp, r.plan_id, r.price, r.ip_address, r.user_agent, r.referrer)
        for r in rows
    ]
    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO plan_views (event_timestamp, plan_id, price, ip_address, user_agent, referrer)
            VALUES %s
            ON CONFLICT (event_timestamp, plan_id, ip_address) DO NOTHING
            """,
            values,
        )
    conn.commit()
    return len(values)


def main():
    conn = get_pg_conn()
    try:
        since_ts = get_last_synced_timestamp(conn)
        print(f"[{datetime.now(timezone.utc).isoformat()}] Syncing rows since {since_ts.isoformat()}...")
        rows = fetch_new_rows(since_ts)
        inserted = insert_rows(conn, rows)
        print(f"[{datetime.now(timezone.utc).isoformat()}] Fetched {len(rows)} row(s) from BigQuery, "
              f"upserted {inserted} (duplicates on the boundary timestamp are skipped automatically).")
    except Exception as e:
        print(f"[{datetime.now(timezone.utc).isoformat()}] ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
