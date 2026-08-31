#!/usr/bin/env python3
"""Guard on the one thing sync_gbp_data.py's keyword sync must never do.

    python3 tests/test_gbp_keywords_guard.py

WHY THIS FILE EXISTS
On Aug 31, 2026 `sync_gbp_data.py` was found deleting a month of stored search
keywords unconditionally and re-inserting only when the fetch came back
non-empty. An empty API response therefore destroyed data, and left no trace:
the run recorded `ok`, the log printed "keywords: 0 row(s)", and 0 is the
honest, expected answer on a profile doing 60-96 views a month. The failure and
the healthy case are indistinguishable from the outside, which is why this is a
test and not a code comment.

`monthly-close-runbook.md` section 7 states the rule this file implements:
    "a script that reports a clean result without having looked is worse than
     no script -- test each of these against a fixture with a known-bad value
     before trusting a clean run."

So the known-bad value is here too. `legacy_sync_keywords` below is the code as
it stood before the fix, and the last test asserts that it FAILS. A test that
passes against both versions is not testing anything.

No VPS, no Postgres, no network, no third-party packages: the psycopg2/google/
requests imports are stubbed, and the connection is a fake that records every
statement it is handed.
"""

import os
import sys
import types
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANALYTICS = os.path.join(ROOT, "automation", "analytics")


# --- stub out everything the module imports but the logic never touches ------
def _stub(name, **attrs):
    m = types.ModuleType(name)
    for k, v in attrs.items():
        setattr(m, k, v)
    sys.modules[name] = m
    return m


def _execute_values(cur, sql, rows, *a, **kw):
    cur.execute(sql, rows)


_stub("dotenv", load_dotenv=lambda *a, **kw: None)
_stub("psycopg2", connect=lambda **kw: None)
_stub("psycopg2.extras", execute_values=_execute_values)
sys.modules["psycopg2"].extras = sys.modules["psycopg2.extras"]
_stub("requests", get=lambda *a, **kw: None)
google = _stub("google")
_stub("google.oauth2")
_stub("google.oauth2.credentials", Credentials=object)
_stub("google.auth")
_stub("google.auth.transport")
_stub("google.auth.transport.requests", Request=object)

for k in ("PG_HOST", "PG_PORT", "PG_DB", "PG_USER", "PG_PASSWORD",
          "GBP_CLIENT_ID", "GBP_CLIENT_SECRET", "GBP_REFRESH_TOKEN",
          "GBP_ACCOUNT_ID", "GBP_LOCATION_ID"):
    os.environ.setdefault(k, "test")

sys.path.insert(0, ANALYTICS)
import sync_gbp_data as G  # noqa: E402


# --- a connection that remembers what it was asked to do --------------------
class FakeCursor:
    def __init__(self, conn):
        self.conn = conn

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def execute(self, sql, params=None):
        self.conn.sql.append(" ".join(sql.split()))

    def fetchone(self):
        return (self.conn.prior_rows,)


class FakeConn:
    def __init__(self, prior_rows=0):
        self.prior_rows = prior_rows
        self.sql = []
        self.commits = 0

    def cursor(self):
        return FakeCursor(self)

    def commit(self):
        self.commits += 1

    def deletes(self):
        return [q for q in self.sql if q.startswith("DELETE")]

    def inserts(self):
        return [q for q in self.sql if q.startswith("INSERT")]


ONE_KEYWORD = [("loc", date(2026, 8, 1), "triaperformance", None, 15)]

FAILURES = []


def check(name, cond, detail=""):
    if cond:
        print("  PASS  " + name)
    else:
        print("  FAIL  " + name + ("  -- " + detail if detail else ""))
        FAILURES.append(name)


def with_fetch(rows):
    """Swap fetch_keywords for a stub returning `rows`."""
    G.fetch_keywords = lambda h, s, e: list(rows)


# --- the pre-fix code, verbatim in shape, as the known-bad fixture ----------
def legacy_sync_keywords(conn, h, start, end):
    kw_total = 0
    m = start.replace(day=1)
    while m <= end:
        krows = G.fetch_keywords(h, m, m)
        with conn.cursor() as cur:
            cur.execute("DELETE FROM gbp_search_keywords WHERE location_id=%s AND month=%s",
                        ("loc", m))
            if krows:
                cur.execute("INSERT INTO gbp_search_keywords VALUES %s", krows)
        conn.commit()
        kw_total += len(krows)
        m = (m.replace(day=28) + __import__("datetime").timedelta(days=4)).replace(day=1)
    return kw_total, [], []


def main():
    aug1, aug31 = date(2026, 8, 1), date(2026, 8, 31)
    print(__doc__.splitlines()[0])

    # 1. THE BUG. Empty fetch, month already holds rows -> nothing is destroyed.
    with_fetch([])
    conn = FakeConn(prior_rows=7)
    total, empty, kept = G.sync_keywords(conn, None, aug1, aug31)
    check("empty fetch over stored rows issues no DELETE",
          conn.deletes() == [], str(conn.deletes()))
    check("empty fetch over stored rows reports the month as kept",
          kept == ["2026-08"] and empty == [], "kept=%r empty=%r" % (kept, empty))
    check("kept month is logged as 'partial', not 'ok'",
          "prior rows KEPT" in (G.keywords_detail(empty, kept) or ""))

    # 2. Empty fetch on a month that never had rows -- the boring, real case.
    conn = FakeConn(prior_rows=0)
    total, empty, kept = G.sync_keywords(conn, None, aug1, aug31)
    check("genuine zero issues no DELETE", conn.deletes() == [])
    check("genuine zero reports empty, not kept",
          empty == ["2026-08"] and kept == [], "empty=%r kept=%r" % (empty, kept))
    check("genuine zero still records as ok",
          "prior rows KEPT" not in (G.keywords_detail(empty, kept) or ""))

    # 3. A real fetch still replaces the month.
    with_fetch(ONE_KEYWORD)
    conn = FakeConn(prior_rows=7)
    total, empty, kept = G.sync_keywords(conn, None, aug1, aug31)
    check("non-empty fetch deletes then inserts",
          len(conn.deletes()) == 1 and len(conn.inserts()) == 1,
          "del=%d ins=%d" % (len(conn.deletes()), len(conn.inserts())))
    check("non-empty fetch counts its rows", total == 1, "total=%r" % total)
    check("non-empty fetch flags nothing", empty == [] and kept == [])

    # 4. Multi-month window: one empty month must not poison the others.
    calls = {"n": 0}

    def alternating(h, s, e):
        calls["n"] += 1
        return list(ONE_KEYWORD) if calls["n"] == 1 else []

    G.fetch_keywords = alternating
    conn = FakeConn(prior_rows=3)
    total, empty, kept = G.sync_keywords(conn, None, date(2026, 6, 1), date(2026, 8, 31))
    check("three-month window deletes only the month it can replace",
          len(conn.deletes()) == 1, "deletes=%d" % len(conn.deletes()))
    check("three-month window names both empty months as kept",
          kept == ["2026-07", "2026-08"], "kept=%r" % (kept,))

    # 5. The keyword window reaches the previous month, including across a
    #    year boundary. GBP publishes a month AFTER it closes, so a rolling
    #    7-day window stops reaching a month around the 8th and freezes it at
    #    whatever partial state it held. Boundary arithmetic, so test the
    #    boundaries.
    check("window reaches back one month",
          G.keyword_window_start(date(2026, 9, 4)) == date(2026, 8, 1),
          str(G.keyword_window_start(date(2026, 9, 4))))
    check("window handles the year rollover",
          G.keyword_window_start(date(2026, 1, 2)) == date(2025, 12, 1),
          str(G.keyword_window_start(date(2026, 1, 2))))
    check("window handles the leap-year boundary",
          G.keyword_window_start(date(2028, 3, 1)) == date(2028, 2, 1),
          str(G.keyword_window_start(date(2028, 3, 1))))
    check("window is already month-floored on the 1st",
          G.keyword_window_start(date(2026, 8, 1)) == date(2026, 7, 1),
          str(G.keyword_window_start(date(2026, 8, 1))))

    # 6. THE KNOWN-BAD FIXTURE. The pre-fix code must fail test 1.
    with_fetch([])
    conn = FakeConn(prior_rows=7)
    legacy_sync_keywords(conn, None, aug1, aug31)
    check("legacy code DOES destroy the month (test discriminates)",
          len(conn.deletes()) == 1 and conn.inserts() == [],
          "legacy issued %d delete(s)" % len(conn.deletes()))

    print()
    if FAILURES:
        print("FAILED: %d" % len(FAILURES))
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
