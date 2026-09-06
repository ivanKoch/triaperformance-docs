#!/usr/bin/env python3
"""Write site/_data/sequences.json for /admin/secuencias/.

Runs inside deploy-website.sh, BEFORE the Eleventy build, because the admin
page is a static build artefact and not a service -- same shape as
/admin/enlaces/. The page is therefore as fresh as the last deploy, which for
a daily deploy is the right trade: no database connection from the web tier,
no new port, no auth surface beyond the basic_auth already on /admin/*.

It talks to Postgres through `docker exec ... psql`, NOT psycopg2.
    - no Python driver to install (the system python3 on this box has none;
      psycopg2 lives in Hermes's venv, which is not the interpreter here);
    - no DSN and no password anywhere -- inside the container psql connects
      over the local socket, exactly like every other db command in this repo.
The first version of this script imported psycopg2 and invented a DSN from
PG_* environment variables. It failed on both counts on the first deploy.

It must NEVER break the deploy. Any failure leaves the previous
sequences.json untouched and exits 0 -- a stale table beats no website, and
`generated_at` on the page is what tells the reader the data did not move.
"""
import json, os, subprocess, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "site", "_data", "sequences.json")

CONTAINER = os.environ.get("MEMBERS_PG_CONTAINER", "analytics-postgres")
DB_USER   = os.environ.get("MEMBERS_PG_USER", "analytics")
DB_NAME   = os.environ.get("MEMBERS_PG_DB", "members")

# One round trip, one JSON document. COALESCE on both aggregates because
# json_agg over zero rows returns NULL, not an empty array -- and a literal
# "null" reaching the template would render as a broken page rather than as
# an empty one.
QUERY = """
SELECT json_build_object(
  'campaigns', COALESCE((SELECT json_agg(s ORDER BY s.last_sent DESC NULLS LAST, s.campaign)
                         FROM sequence_stats s), '[]'::json),
  'links',     COALESCE((SELECT json_agg(x)
                         FROM (SELECT t.source AS campaign,
                                      c.code,
                                      count(*)                   AS clicks,
                                      count(DISTINCT c.click_id) AS clickers
                               FROM campaign_link_clicks c
                               JOIN unsubscribe_tokens t ON t.click_id = c.click_id
                               GROUP BY t.source, c.code
                               ORDER BY count(*) DESC) x), '[]'::json)
);
"""


def fail(msg):
    print(f"[sequences] {msg} -- leaving existing data", file=sys.stderr)
    return 0


def main():
    try:
        proc = subprocess.run(
            ["docker", "exec", "-i", CONTAINER,
             "psql", "-U", DB_USER, "-d", DB_NAME, "-At", "-c", QUERY],
            capture_output=True, text=True, timeout=30,
        )
    except FileNotFoundError:
        return fail("docker not on PATH")
    except subprocess.TimeoutExpired:
        return fail("psql timed out")

    if proc.returncode != 0:
        return fail(f"psql exited {proc.returncode}: {proc.stderr.strip()[:200]}")

    raw = proc.stdout.strip()
    if not raw:
        return fail("psql returned nothing")

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return fail(f"unparseable psql output: {raw[:120]!r}")

    campaigns = data.get("campaigns") or []
    links_by_campaign = {}
    for row in (data.get("links") or []):
        links_by_campaign.setdefault(row["campaign"], []).append(
            {"code": row["code"], "clicks": row["clicks"], "clickers": row["clickers"]}
        )

    payload = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc)
                                 .isoformat(timespec="seconds"),
        "campaigns": campaigns,
        "links_by_campaign": links_by_campaign,
    }

    # Write via a temp file in the same directory, then replace. A deploy that
    # dies mid-write must not leave the build reading half a JSON document.
    tmp = OUT + ".tmp"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
    os.replace(tmp, OUT)

    sent = sum((c.get("sent") or 0) for c in campaigns)
    print(f"[sequences] {len(campaigns)} campaign(s), {sent} sent "
          f"-> site/_data/sequences.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
