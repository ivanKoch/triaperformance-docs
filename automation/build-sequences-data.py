#!/usr/bin/env python3
"""Write site/_data/sequences.json from the sequence_stats view.

Runs on the VPS inside deploy-website.sh, BEFORE the Eleventy build, because
the admin page is a static build artefact and not a service -- same shape as
/admin/enlaces. That means the page is as fresh as the last deploy, which for
a daily deploy is the right trade: no DB connection from the web tier, no new
port, no auth surface beyond the basic_auth already on /admin/*.

It must NEVER break the deploy. If Postgres is unreachable the previous
sequences.json is left exactly as it was and the script exits 0 -- a stale
table is better than no website, and `generated_at` on the page is what tells
the reader the data did not move.
"""
import json, os, sys, datetime

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "..", "site", "_data", "sequences.json")

def main():
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
    except ImportError:
        print("[sequences] psycopg2 missing -- leaving existing data", file=sys.stderr)
        return 0

    dsn = os.environ.get("MEMBERS_DSN")
    if not dsn:
        host = os.environ.get("PG_HOST", "127.0.0.1")
        port = os.environ.get("PG_PORT", "5432")
        user = os.environ.get("PG_USER", "analytics")
        pw   = os.environ.get("PG_PASSWORD", "")
        db   = os.environ.get("PG_DATABASE", "members")
        dsn = f"host={host} port={port} user={user} password={pw} dbname={db}"

    try:
        conn = psycopg2.connect(dsn, connect_timeout=5)
    except Exception as e:
        print(f"[sequences] no database ({e.__class__.__name__}) -- leaving existing data",
              file=sys.stderr)
        return 0

    try:
        with conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM sequence_stats;")
            rows = [dict(r) for r in cur.fetchall()]
            cur.execute("""
                SELECT t.source AS campaign, c.code, count(*) AS clicks,
                       count(DISTINCT c.click_id) AS clickers
                FROM campaign_link_clicks c
                JOIN unsubscribe_tokens t ON t.click_id = c.click_id
                GROUP BY t.source, c.code
                ORDER BY count(*) DESC;""")
            by_link = [dict(r) for r in cur.fetchall()]
    except Exception as e:
        print(f"[sequences] query failed ({e}) -- leaving existing data", file=sys.stderr)
        return 0
    finally:
        conn.close()

    def iso(v):
        return v.isoformat() if hasattr(v, "isoformat") else v

    for r in rows:
        for k, v in list(r.items()):
            r[k] = iso(v) if not isinstance(v, (int, str, type(None))) else v
            if hasattr(v, "quantize"):          # Decimal from round()
                r[k] = float(v)
    for r in by_link:
        r["clicks"] = int(r["clicks"]); r["clickers"] = int(r["clickers"])

    links = {}
    for r in by_link:
        links.setdefault(r["campaign"], []).append(
            {"code": r["code"], "clicks": r["clicks"], "clickers": r["clickers"]})

    payload = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "campaigns": rows,
        "links_by_campaign": links,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
    print(f"[sequences] {len(rows)} campaign(s) -> site/_data/sequences.json")
    return 0

if __name__ == "__main__":
    sys.exit(main())
