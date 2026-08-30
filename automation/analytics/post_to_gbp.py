#!/usr/bin/env python3
"""
Publish one blog article to Google Business Profile as a local post.

    Dry run (prints the exact post, sends nothing):
        ~/.analytics/venv/bin/python \
          ~/.hermes/triaperformance-docs/automation/analytics/post_to_gbp.py --dry-run

    Live, respecting the interval:
        ... post_to_gbp.py

    Ignore the interval (one-off):
        ... post_to_gbp.py --force


WHY A QUEUE AND NOT POST-AT-PUBLISH
The argument is this system's own behaviour, not a preference. The publish
drain is BURSTY: 20 articles went out in a single batch on Aug 30, 2026.
Post-at-publish would have fired 20 local posts in one day — and a local post
earns most of its impressions in its first days, so 19 of them would have been
thrown away. Paced at one every two days, the same 20 articles become six weeks
of continuous presence. Same content, same effort, several times the surface.


WHY THE PACING LIVES HERE AND NOT IN CRON
Cron runs this DAILY; the script decides whether to act, by looking at when the
last post actually went out. `0 7 */2 * *` would drift at every month boundary
(the 31st is followed by the 1st) and a single missed run would silently halve
the cadence for a month. Reading the ledger self-heals: a missed day just posts
the next day.


WHY THERE IS NO REVIEW GATE
The post text is derived mechanically from the article's own headline and
standfirst — text Iván already approved when he approved the article.
`open-loops.md`'s content-engine V2 item is about REDUCING the two existing
review gates; a GBP post with its own approval step would add a third, to
re-approve text that was approved once already.


WHY EVERY FIGURE MUST COME FROM THE DATABASE
A live hand-written GBP post was found on Aug 30, 2026 selling "los 321 planes".
The catalogue has been 301, 303, 327 and 328 — never 321. It was not a stale
number, it was an invented one, typed into the GBP composer instead of pasted
from the doc that owns it. Nothing in this script types a figure.
"""

import argparse
import os
import sys
import textwrap
from datetime import datetime, timezone

from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
import psycopg2
import requests

load_dotenv(os.path.expanduser("~/.analytics/.env"))

ANALYTICS_DB = dict(host=os.environ["PG_HOST"], port=os.environ["PG_PORT"],
                    dbname=os.environ["PG_DB"], user=os.environ["PG_USER"],
                    password=os.environ["PG_PASSWORD"])
# Same server, same credentials, different database. The join between "what is
# published" (content) and "what has been posted" (analytics) is done in Python
# because Postgres cannot join across databases — 60 rows, so it is free.
CONTENT_DB = dict(ANALYTICS_DB, dbname="content")

ACCOUNT = os.environ.get("GBP_ACCOUNT", "accounts/104101875334080602396")
LOCATION = os.environ.get("GBP_LOCATION", "locations/2657422760928328116")
V4 = "https://mybusiness.googleapis.com/v4"
SCOPES = ["https://www.googleapis.com/auth/business.manage"]

LANGUAGE = "es"          # v1 is Spanish only, by decision
MIN_HOURS = float(os.environ.get("GBP_POST_MIN_HOURS", "44"))   # ~every 2 days
SUMMARY_MAX = 1400       # Google's limit is 1500; leave headroom


def log(m):
    print(f"[{datetime.now(timezone.utc).isoformat()}] {m}", flush=True)


def auth_headers():
    c = Credentials(None, refresh_token=os.environ["GBP_REFRESH_TOKEN"],
                    token_uri="https://oauth2.googleapis.com/token",
                    client_id=os.environ["GBP_CLIENT_ID"],
                    client_secret=os.environ["GBP_CLIENT_SECRET"],
                    scopes=SCOPES)
    c.refresh(Request())
    return {"Authorization": f"Bearer {c.token}"}


def hours_since_last_post(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT EXTRACT(EPOCH FROM (now() - MAX(posted_at)))/3600 "
                    "FROM gbp_posts_sent")
        (age,) = cur.fetchone()
    return float(age) if age is not None else None


def next_piece(acon, ccon):
    """Oldest published ES article that has not been posted yet. FIFO."""
    with acon.cursor() as cur:
        cur.execute("SELECT piece_id FROM gbp_posts_sent")
        sent = {r[0] for r in cur.fetchall()}
    with ccon.cursor() as cur:
        cur.execute("""
            SELECT id, slug, headline, standfirst, description, published_url, published_at
            FROM content_pieces
            WHERE language = %s
              AND published_at IS NOT NULL
              AND published_url IS NOT NULL
            ORDER BY published_at ASC
        """, (LANGUAGE,))
        for row in cur.fetchall():
            if row[0] not in sent:
                return row
    return None


def build_summary(headline, standfirst, description):
    """Headline plus lead. Both are Iván-approved article text, verbatim.

    A local post has no title field — the summary carries everything, so the
    headline becomes its first line.
    """
    head = headline.strip()
    lead = (standfirst or description or "").strip()
    text = f"{head}\n\n{lead}".strip()
    if len(text) <= SUMMARY_MAX:
        return text
    # Truncate the LEAD only, never the headline, and never with
    # textwrap.shorten on the whole string — shorten normalises whitespace, so
    # it would silently collapse the blank line and run the headline into the
    # body as one paragraph.
    room = SUMMARY_MAX - len(head) - 2
    return f"{head}\n\n{textwrap.shorten(lead, width=max(room, 40), placeholder=' …')}"


def build_url(published_url, slug):
    """UTM per the convention in ai-infrastructure-documentation.md §9:
    source = platform, medium = placement, campaign = the specific content."""
    sep = "&" if "?" in published_url else "?"
    return (f"{published_url}{sep}utm_source=google&utm_medium=gbp_post"
            f"&utm_campaign={slug}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true",
                    help="post even if the interval has not elapsed")
    args = ap.parse_args()

    acon = psycopg2.connect(**ANALYTICS_DB)
    ccon = psycopg2.connect(**CONTENT_DB)
    try:
        age = hours_since_last_post(acon)
        if age is not None and age < MIN_HOURS and not args.force:
            log(f"quiet — last post {age:.1f}h ago, interval is {MIN_HOURS:.0f}h")
            return

        piece = next_piece(acon, ccon)
        if not piece:
            log(f"nothing to post — every published {LANGUAGE} article is already on GBP")
            return

        pid, slug, headline, standfirst, description, url, published_at = piece
        summary = build_summary(headline, standfirst, description)
        cta_url = build_url(url, slug)

        log(f"piece {pid} ({slug}), published {published_at:%Y-%m-%d}")
        if args.dry_run:
            print("-" * 66)
            print(summary)
            print("-" * 66)
            print(f"languageCode: {LANGUAGE}")
            print(f"CTA LEARN_MORE → {cta_url}")
            print("-" * 66)
            print("(dry run — nothing sent)")
            return

        body = {
            # Set from the article's own language. A live hand-written post was
            # found tagged `en` while its body was Spanish; Google uses this
            # field to decide who sees the post.
            "languageCode": LANGUAGE,
            "summary": summary,
            "topicType": "STANDARD",
            "callToAction": {"actionType": "LEARN_MORE", "url": cta_url},
        }
        r = requests.post(f"{V4}/{ACCOUNT}/{LOCATION}/localPosts",
                          headers=auth_headers(), json=body, timeout=60)
        if r.status_code not in (200, 201):
            log(f"ERROR HTTP {r.status_code}: {r.text[:500]}")
            sys.exit(1)

        name = r.json().get("name", "")
        # Ledger row written only AFTER Google confirms. A failed post leaves no
        # row and is simply retried tomorrow.
        with acon.cursor() as cur:
            cur.execute("""INSERT INTO gbp_posts_sent
                (piece_id, language, local_post_name, published_url)
                VALUES (%s,%s,%s,%s) ON CONFLICT (piece_id) DO NOTHING""",
                        (pid, LANGUAGE, name, url))
        acon.commit()
        log(f"posted → {name}")

        with ccon.cursor() as cur:
            cur.execute("""SELECT COUNT(*) FROM content_pieces
                WHERE language=%s AND published_at IS NOT NULL
                  AND published_url IS NOT NULL""", (LANGUAGE,))
            (total,) = cur.fetchone()
        with acon.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM gbp_posts_sent WHERE language=%s", (LANGUAGE,))
            (done,) = cur.fetchone()
        log(f"queue: {done}/{total} {LANGUAGE} articles posted, "
            f"{total - done} remaining (~{(total - done) * MIN_HOURS / 24:.0f} days)")
    finally:
        acon.close()
        ccon.close()


if __name__ == "__main__":
    main()
