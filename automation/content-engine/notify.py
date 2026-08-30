#!/usr/bin/env python3
"""
Content engine notifier — tells Iván when the pipeline needs a human.

    python3 notify.py              send if there's something worth saying
    python3 notify.py --dry-run    print the message, send nothing
    python3 notify.py --force      send even if nothing changed
    python3 notify.py --show-env   which Telegram variable names exist (names only)

WHY THIS EXISTS
Both agents run on cron with MAILTO="" — so a cron that has been broken for a
fortnight produces exactly the same experience as a quiet week: an empty review
page. This inverts that. The system reports its own state; Iván stops having to
remember to look.

WHY IT DOESN'T MESSAGE EVERY DAY
A notifier that pings daily regardless gets muted within a week, and a muted
notifier is worse than none — it looks like coverage while providing none. So:

  - a FAILED agent always sends, every day, until it's fixed. That's the one
    thing that should nag.
  - pending work sends when the counts go UP (something new arrived), or after
    NUDGE_DAYS of the same backlog sitting there. Ignoring a ping does not
    earn you the same ping tomorrow.
  - nothing pending and nothing broken sends nothing at all.

The quiet case is the common case, which is what makes a message mean something.
"""

import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from research_agent import load_env, connect, read_env_files

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))

STATE_DIR = os.path.expanduser(os.environ.get("STATE_DIR", "~/.hermes/state"))
NOTIFY_STATE = os.path.join(STATE_DIR, "content-notify.json")
NUDGE_DAYS = float(os.environ.get("NUDGE_DAYS", "3"))
ADMIN = "https://triaperformance.com/admin"

# The agents whose status files are checked. Written by run-agent.sh.
AGENTS = ("research", "write", "translate")

# No single canonical name for these across the .env files, so look for any of
# them rather than guessing one and failing silently.
TOKEN_KEYS = ("TELEGRAM_BOT_TOKEN", "HERMES_TELEGRAM_TOKEN", "TELEGRAM_TOKEN",
              "TELEGRAM_API_TOKEN", "HERMES_BOT_TOKEN")
# Order matters: TELEGRAM_HOME_CHANNEL is where Hermes already posts, so these
# messages land in the same place as everything else rather than opening a
# second channel to check. TELEGRAM_ALLOWED_USERS is a fallback and is an
# allowlist — plural, comma-separated — so it needs splitting, not using whole.
CHAT_KEYS = ("TELEGRAM_CHAT_ID", "TELEGRAM_HOME_CHANNEL", "HERMES_TELEGRAM_CHAT_ID",
             "TELEGRAM_CHAT", "TELEGRAM_USER_ID", "TELEGRAM_ALLOWED_USERS")


def first_env(keys):
    env = read_env_files()
    for k in keys:
        v = os.environ.get(k) or env.get(k)
        if v:
            return k, v.strip()
    return None, None


def as_chat_id(key, value):
    """One chat id, from a variable that may legitimately hold several.

    TELEGRAM_ALLOWED_USERS is an allowlist, so it can be "123,456". Passing the
    whole string to Telegram gives a 400 that reads like a bad token. Take the
    first entry and say so.
    """
    if not value:
        return value
    first = value.split(",")[0].strip()
    if first != value.strip():
        print(f"[notify] {key} holds several values; using the first ({first})")
    return first


def counts(conn):
    """What's waiting, in one round trip."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
              (SELECT count(*) FROM content_ideas  WHERE status = 'PROPOSED') AS ideas,
              (SELECT count(*) FROM content_pieces WHERE status = 'DRAFTED')  AS drafts,
              (SELECT count(*) FROM content_pieces WHERE status = 'APPROVED') AS unpublished,
              (SELECT count(*) FROM content_ideas  WHERE status = 'APPROVED'
                 AND NOT EXISTS (SELECT 1 FROM content_pieces p
                                 WHERE p.idea_id = content_ideas.id))         AS queued
        """)
        r = cur.fetchone()
    return {"ideas": r[0], "drafts": r[1], "unpublished": r[2], "queued": r[3]}


def orphans(conn):
    """Pieces the database calls PUBLISHED whose file is not in the repo.

    WHY THIS EXISTS — a real failure, Aug 20-24, 2026. Piece 12 was published
    correctly by n8n, then deleted from the repo four days later in a commit
    about something else entirely. Nothing told the database. It kept reporting
    PUBLISHED, and on Aug 24 `auto_translate` — which treats APPROVED/PUBLISHED
    as ground truth — spent two generations producing EN and PT siblings of an
    article that had not been on the site for four days. Those siblings went
    live with broken hreflang, declaring a Spanish version that doesn't exist.

    The underlying shape is this project's own hygiene rule applied to code:
    ONE OWNER PER FACT. The repo owns whether an article exists; the database
    owns whether it is meant to. Nothing checked that they agreed, so a hand
    deletion was invisible to every agent downstream.

    Deliberately one-directional. Files on disk with no database row are
    normal — the six hand-written articles predate the content engine — so
    reporting them would be noise that trains you to ignore this.
    """
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, language, slug, file_path
            FROM content_pieces
            WHERE status = 'PUBLISHED' AND file_path IS NOT NULL
            ORDER BY id
        """)
        rows = cur.fetchall()
    return [(r[0], r[1], r[3]) for r in rows
            if not os.path.exists(os.path.join(REPO, r[3]))]


def failures():
    """Agents whose last run failed, from the status files run-agent.sh writes."""
    out = []
    for a in AGENTS:
        p = os.path.join(STATE_DIR, f"content-{a}.status")
        if not os.path.exists(p):
            continue
        line = open(p, encoding="utf-8").read().strip()
        if line.startswith("FAIL"):
            out.append((a, line[5:]))
    return out


def stale(max_age_days=8):
    """Agents that haven't run at all in a while.

    A status file that says OK from nine days ago is not good news — it means
    the cron stopped firing. Absence of failure is not evidence of running.
    """
    out = []
    now = time.time()
    for a in AGENTS:
        p = os.path.join(STATE_DIR, f"content-{a}.status")
        if not os.path.exists(p):
            continue
        age = (now - os.path.getmtime(p)) / 86400
        # research runs weekly, so it gets a longer leash than the daily jobs.
        limit = max_age_days if a == "research" else 2
        if age > limit:
            out.append((a, round(age, 1)))
    return out


# ---------------------------------------------------------------------------
# Analytics pipeline health. Added August 30, 2026.
#
# WHY IT LIVES HERE AND NOT IN ITS OWN JOB: this file already runs daily,
# already knows how to reach Iván, and already has the "nag on failure, stay
# quiet otherwise" logic. A second notifier would be a second thing to mute.
#
# WHY IT EXISTS AT ALL: the GSC/GA4 syncs write to a table nobody opens. A dead
# cron and a genuine zero look identical from the consuming end -- and the
# consumer is meant to be an agent choosing article topics, which would read a
# silent pipeline as "nothing ranks". That is the single most expensive failure
# this pipeline has, and `analytics_sync_log` exists precisely so it is
# detectable. Detectable and undetected is not much better than invisible.
ANALYTICS_ENV = os.path.expanduser("~/.analytics/.env")
ANALYTICS_MAX_AGE_H = float(os.environ.get("ANALYTICS_MAX_AGE_H", "30"))
# Every source the two syncs record. A source MISSING from the log is as much a
# problem as a stale one -- it means that half never ran.
ANALYTICS_SOURCES = ("gsc_site", "gsc_url", "ga4_page", "ga4_event", "ga4_traffic")


def _read_analytics_env():
    """Minimal .env reader. Deliberately not python-dotenv: this file runs under
    the content-engine venv and must not gain a dependency for six lines."""
    out = {}
    if not os.path.exists(ANALYTICS_ENV):
        return out
    with open(ANALYTICS_ENV, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def analytics_problems():
    """Sources that errored, went stale, or never ran. Returns [(source, why)].

    Fails SOFT and never raises: a broken analytics check must not take the
    content-engine notifier down with it. The content pipeline is the thing
    this file was built for; analytics is a passenger.
    """
    env = _read_analytics_env()
    if not env.get("PG_HOST"):
        return []          # not this box, or not configured — say nothing
    try:
        import psycopg2
        conn = psycopg2.connect(
            host=env["PG_HOST"], port=env.get("PG_PORT", "5432"),
            dbname=env["PG_DB"], user=env["PG_USER"], password=env["PG_PASSWORD"],
            connect_timeout=10,
        )
    except Exception as e:
        return [("analytics-postgres", f"sin conexión ({type(e).__name__})")]

    out = []
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT source, status,
                       EXTRACT(EPOCH FROM (now() - run_started)) / 3600.0
                FROM analytics_pipeline_health
            """)
            seen = {}
            for source, status, age_h in cur.fetchall():
                seen[source] = (status, float(age_h))
        for src in ANALYTICS_SOURCES:
            if src not in seen:
                out.append((src, "nunca corrió"))
                continue
            status, age_h = seen[src]
            if status != "ok":
                out.append((src, f"error en el último run (hace {age_h:.0f} h)"))
            elif age_h > ANALYTICS_MAX_AGE_H:
                out.append((src, f"sin correr hace {age_h:.0f} h"))
    except Exception as e:
        out.append(("analytics_sync_log", f"consulta falló ({type(e).__name__})"))
    finally:
        conn.close()
    return out


def build_message(c, fails, stales, gone=(), analytics=()):
    lines = []
    if gone:
        lines.append("⚠️ *Publicado en la base, ausente del repo*")
        for pid, lang, path in gone:
            lines.append(f"  `{pid}` {lang} — {path}")
        lines.append("_El traductor los trata como fuente válida. "
                     "Marcalos REJECTED o restaurá el archivo._")
        lines.append("")
    if analytics:
        lines.append("⚠️ *Pipeline de analítica*")
        for src, why in analytics:
            lines.append(f"  `{src}` — {why}")
        lines.append("_GSC 05:15, GA4 05:45. Logs en `~/.analytics/logs/`._")
        lines.append("")
    if fails:
        lines.append("⚠️ *Agente con error*")
        for a, when in fails:
            lines.append(f"  `{a}` — {when}")
        lines.append("")
    if stales:
        lines.append("⚠️ *Agente sin ejecutarse*")
        for a, days in stales:
            lines.append(f"  `{a}` — último run hace {days} días")
        lines.append("")

    if c["ideas"] or c["drafts"]:
        lines.append("*Esperando tu revisión*")
        if c["ideas"]:
            lines.append(f"  {c['ideas']} idea(s) → {ADMIN}/ideas/")
        if c["drafts"]:
            lines.append(f"  {c['drafts']} borrador(es) → {ADMIN}/drafts/")

    # Context, not a call to action — these need nothing from him.
    tail = []
    if c["queued"]:
        tail.append(f"{c['queued']} idea(s) en cola del redactor")
    if c["unpublished"]:
        tail.append(f"{c['unpublished']} aprobado(s) sin publicar")
    if tail:
        lines.append("")
        lines.append("_" + " · ".join(tail) + "_")
    return "\n".join(lines).strip()


def should_send(c, fails, stales, prev, force, gone=(), analytics=()):
    if force:
        return True, "forced"
    # Drift, like a failure, nags every day until it's resolved — it silently
    # costs money (regenerated translations) and ships broken hreflang, and it
    # cannot fix itself.
    if gone:
        return True, f"{len(gone)} published piece(s) missing from the repo"
    # Same reasoning as a failed agent: a stopped sync cannot fix itself, and
    # every day it stays broken is a day of data that no backfill recovers for
    # GA4 (its BigQuery export is forward-only). This nags daily.
    if analytics:
        return True, f"{len(analytics)} analytics source(s) stale or failing"
    if fails or stales:
        return True, "agent problem"
    pending = c["ideas"] + c["drafts"]
    if not pending:
        return False, "nothing pending"
    was = (prev.get("counts") or {})
    if pending > (was.get("ideas", 0) + was.get("drafts", 0)):
        return True, "new work arrived"
    last = prev.get("sent_at")
    if not last:
        return True, "no record of a previous message"
    age = (time.time() - last) / 86400
    if age >= NUDGE_DAYS:
        return True, f"same backlog for {age:.1f} days"
    return False, f"already told you {age:.1f} days ago, nothing new"


def send(token, chat_id, text):
    data = urllib.parse.urlencode({
        "chat_id": chat_id, "text": text,
        "parse_mode": "Markdown", "disable_web_page_preview": "true",
    }).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage", data=data)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.status


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--show-env", action="store_true")
    args = ap.parse_args()

    load_env()

    if args.show_env:
        env = read_env_files()
        present = sorted(k for k in list(env) + list(os.environ)
                         if "TELEGRAM" in k.upper() or "BOT" in k.upper())
        print("Telegram-ish variable NAMES visible (values never printed):")
        for k in present or ["  (none found)"]:
            print(f"  {k}")
        print(f"\nLooking for a token named one of: {', '.join(TOKEN_KEYS)}")
        print(f"Looking for a chat id named one of: {', '.join(CHAT_KEYS)}")
        return

    conn = connect()
    c = counts(conn)
    gone = orphans(conn)
    conn.close()
    fails, stales = failures(), stale()
    analytics = analytics_problems()

    prev = {}
    if os.path.exists(NOTIFY_STATE):
        try:
            prev = json.load(open(NOTIFY_STATE, encoding="utf-8"))
        except (ValueError, OSError):
            prev = {}

    go, why = should_send(c, fails, stales, prev, args.force, gone, analytics)
    print(f"[notify] ideas={c['ideas']} drafts={c['drafts']} "
          f"queued={c['queued']} unpublished={c['unpublished']} "
          f"fails={len(fails)} stale={len(stales)} missing={len(gone)} "
          f"analytics={len(analytics)} "
          f"→ {'SEND' if go else 'quiet'} ({why})")
    for pid, lang, path in gone:
        print(f"  [drift] piece {pid} ({lang}) says PUBLISHED but {path} is not in the repo")
    for src, why in analytics:
        print(f"  [analytics] {src}: {why}")
    if not go:
        return

    msg = build_message(c, fails, stales, gone, analytics)
    if not msg:
        print("[notify] nothing to say after all")
        return

    if args.dry_run:
        print("-" * 50)
        print(msg)
        print("-" * 50)
        return

    tkey, token = first_env(TOKEN_KEYS)
    ckey, chat_id = first_env(CHAT_KEYS)
    chat_id = as_chat_id(ckey, chat_id)
    if not token or not chat_id:
        # Loud, because a notifier that can't notify must not fail quietly —
        # that is precisely the condition it exists to prevent.
        sys.exit("[notify] no Telegram token and/or chat id found. "
                 "Run: python3 notify.py --show-env")
    print(f"[notify] using {tkey} + {ckey}")
    status = send(token, chat_id, msg)
    print(f"[notify] telegram returned {status}")

    os.makedirs(STATE_DIR, exist_ok=True)
    json.dump({"sent_at": time.time(),
               "sent_at_iso": datetime.now(timezone.utc).isoformat(),
               "counts": c, "reason": why},
              open(NOTIFY_STATE, "w", encoding="utf-8"), indent=1)


if __name__ == "__main__":
    main()
