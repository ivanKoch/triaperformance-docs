# main.py
# Cloud Function (plan-tracker-bigquery) that logs plan-view pixel hits to BigQuery.
# Runtime: Python 3.12 (migrated off decommissioned 3.9 — July 2026).
#
# NOTE on the "referrer" field: this pixel is a static <img src="..."> tag hand-pasted
# into each TrainingPeaks plan's HTML description (built in bulk via spreadsheet formula
# from plan_id + price — see data/training_plans_inventory.csv). It is NOT a JS snippet
# and has no access to the current page URL, query string, cookies, or true document
# referrer at request time. The "referrer" this function logs is just the HTTP Referer
# header of the pixel <img> request itself, which is structurally always the page that
# contains the pixel (the TrainingPeaks plan page) — never the page that sent the
# visitor to TrainingPeaks. This is a hard limitation of the embed method, not a bug,
# and is not fixable from this function or from triaperformance.com's side (confirmed
# July 2026 — see ai-infrastructure-documentation.md). Do not spend time trying to widen
# this into real source attribution; use GA4 on triaperformance.com for that instead.

import functions_framework
import flask
import base64
import sys
from datetime import datetime, timezone
from google.cloud import bigquery

# --- Configuration ---
PROJECT_ID = "training-plan-analytics"
DATASET_ID = "tracking_data"
TABLE_ID = "plan_views"

client = bigquery.Client(project=PROJECT_ID)

# 1x1 transparent GIF.
PIXEL_DATA = base64.b64decode('R0lGODlhAQABAJAAAP8AAAAAACH5BAUQAAAALAAAAAABAAEAAAICRAEAOw==')


@functions_framework.http
def plan_tracker_bigquery(request: flask.Request) -> flask.Response:
    """
    HTTP Cloud Function that logs plan views to BigQuery and returns a tracking pixel.
    """
    try:
        # --- 1. Data Collection ---
        args = request.args
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)

        price_str = args.get('price')
        price_float = None
        if price_str:
            try:
                price_float = float(price_str)
            except (ValueError, TypeError):
                price_float = None

        row_to_insert = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "plan_id": args.get('plan_id', 'not_set'),
            "price": price_float,
            "ip_address": ip_address,
            "user_agent": request.headers.get('User-Agent', 'UNKNOWN'),
            "referrer": request.headers.get('Referer', 'UNKNOWN'),
        }

        # --- 2. Insert into BigQuery ---
        table_ref = client.dataset(DATASET_ID).table(TABLE_ID)
        table = client.get_table(table_ref)

        errors = client.insert_rows_json(table, [row_to_insert])

        if errors:
            print(f"BigQuery insert errors: {errors}", file=sys.stderr)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

    # --- 3. Serve the Pixel ---
    response = flask.make_response(PIXEL_DATA)
    response.headers.set('Content-Type', 'image/gif')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')

    return response


# BigQuery table 'plan_views' schema (unchanged from original — no new columns needed):
# [
#     {"name": "timestamp", "type": "TIMESTAMP", "mode": "REQUIRED"},
#     {"name": "plan_id", "type": "STRING", "mode": "NULLABLE"},
#     {"name": "price", "type": "FLOAT", "mode": "NULLABLE"},
#     {"name": "ip_address", "type": "STRING", "mode": "NULLABLE"},
#     {"name": "user_agent", "type": "STRING", "mode": "NULLABLE"},
#     {"name": "referrer", "type": "STRING", "mode": "NULLABLE"}
# ]
