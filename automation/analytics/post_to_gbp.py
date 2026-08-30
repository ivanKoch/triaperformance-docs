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
import re
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


def last_image(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT image_url FROM gbp_posts_sent "
                    "WHERE image_url IS NOT NULL ORDER BY posted_at DESC LIMIT 1")
        row = cur.fetchone()
    return row[0] if row else None


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
            SELECT id, slug, topic, headline, standfirst, description, published_url, published_at
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


# ---------------------------------------------------------------------------
# Photos.
#
# The pool is rebuilt here the same way site/_data/blogImages.js builds it —
# sorted filenames, trailing `-<digits>` stripped so `running-3.jpg` groups
# under `running` — and the pick uses the SAME hash as the `cardImage` filter
# in .eleventy.js. That is deliberate: the photo on the GBP post is then the
# same photo on the article's own blog card, so the two surfaces agree.
# Inventing a second rule here would be a second source of truth for "which
# photo belongs to this article".
#
# ONE FILE IS EXCLUDED BY SIZE, AND IT IS NOT HYPOTHETICAL:
# site/assets/images/blog/topics/nutrition.jpg is an 8-BYTE PLACEHOLDER, still
# live, still in the pool, and already logged in open-loops.md as rendering a
# broken card. Google fetches the sourceUrl and would reject it. The 10KB floor
# is also Google's own documented minimum for a local-post photo, so one guard
# covers both.
# Derived from this file's own location, never from `~`. §18 records a
# dispatcher that broke on its first live run because os.path.expanduser("~")
# resolved to a different home under the process that invoked it. The images
# live in the same clone as this script; ../../site is that relationship stated
# directly, and it cannot be wrong under a different HOME.
IMAGES_DIR = os.path.normpath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "site", "assets", "images", "blog"))
SITE = "https://triaperformance.com"
MIN_IMAGE_BYTES = 10 * 1024
EXT = (".jpg", ".jpeg", ".png", ".webp", ".avif")


def _strip_ext(name):
    for e in EXT:
        if name.lower().endswith(e):
            return name[: -len(e)]
    return name


def build_pools():
    """{topic: [public_url, ...]} plus {slug: url} for pinned article photos."""
    topics, articles = {}, {}
    tdir = os.path.join(IMAGES_DIR, "topics")
    adir = os.path.join(IMAGES_DIR, "articles")
    if os.path.isdir(tdir):
        # sorted() so the pool order matches the Eleventy build on any machine —
        # readdir order is filesystem-dependent and would shift every pick.
        for fn in sorted(os.listdir(tdir)):
            if not fn.lower().endswith(EXT):
                continue
            if os.path.getsize(os.path.join(tdir, fn)) < MIN_IMAGE_BYTES:
                log(f"  skipping {fn} — under {MIN_IMAGE_BYTES // 1024}KB, "
                    "almost certainly a placeholder")
                continue
            key = re.sub(r"-\d+$", "", _strip_ext(fn))
            topics.setdefault(key, []).append(f"{SITE}/assets/images/blog/topics/{fn}")
    if os.path.isdir(adir):
        for fn in sorted(os.listdir(adir)):
            if not fn.lower().endswith(EXT):
                continue
            if os.path.getsize(os.path.join(adir, fn)) < MIN_IMAGE_BYTES:
                continue
            articles[_strip_ext(fn)] = f"{SITE}/assets/images/blog/articles/{fn}"
    return topics, articles


def _slug_hash(slug):
    """Byte-for-byte the hash in .eleventy.js's cardImage filter:
        h = (Math.imul(h, 31) + slug.charCodeAt(i)) >>> 0
    Signed 32-bit multiply then unsigned coercion is the same bit pattern as a
    mod-2**32 multiply, so the mask reproduces it exactly. (Slugs here are
    ASCII; charCodeAt is UTF-16 code units, which only diverges from ord()
    above the BMP.)"""
    h = 0
    for ch in slug:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h


def pick_image(topics, articles, topic, slug, avoid=None):
    """The article's own card photo — unless that is the one posted last time.

    Iván's requirement is 'not the same photo twice in a row'. Consecutive
    articles often share a topic, and with a pool of 4-10 the hash will
    sometimes land on the same file two posts running. When it does, step to the
    next photo in the pool rather than repeating.
    """
    if slug in articles:
        return articles[slug]
    pool = topics.get(topic or "")
    if not pool:
        return None
    i = _slug_hash(slug) % len(pool)
    if avoid and pool[i] == avoid and len(pool) > 1:
        i = (i + 1) % len(pool)
    return pool[i]


def image_is_reachable(url):
    """Google FETCHES sourceUrl; a 404 fails the whole post. Cheaper to check."""
    try:
        r = requests.head(url, timeout=20, allow_redirects=True)
        return r.status_code == 200
    except requests.RequestException:
        return False


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

        pid, slug, topic, headline, standfirst, description, url, published_at = piece
        summary = build_summary(headline, standfirst, description)
        cta_url = build_url(url, slug)

        topics_pool, articles_pool = build_pools()
        image = pick_image(topics_pool, articles_pool, topic, slug,
                           avoid=last_image(acon))
        if image and not args.dry_run and not image_is_reachable(image):
            # Post without the photo rather than failing: a post with no image
            # is worth more than no post. The likely cause is that the site has
            # not been deployed since the photo was added.
            log(f"  image not reachable, posting without it: {image}")
            image = None

        log(f"piece {pid} ({slug}), topic={topic}, published {published_at:%Y-%m-%d}")
        if args.dry_run:
            print("-" * 66)
            print(summary)
            print("-" * 66)
            print(f"languageCode: {LANGUAGE}")
            print(f"CTA LEARN_MORE → {cta_url}")
            print(f"photo        → {image or '(none — no photo for this topic)'}")
            if image:
                print(f"reachable    → {image_is_reachable(image)}")
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
        if image:
            body["media"] = [{"mediaFormat": "PHOTO", "sourceUrl": image}]
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
                (piece_id, language, local_post_name, published_url, image_url)
                VALUES (%s,%s,%s,%s,%s) ON CONFLICT (piece_id) DO NOTHING""",
                        (pid, LANGUAGE, name, url, image))
        acon.commit()
        log(f"posted → {name}  photo={image or 'none'}")

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
