#!/usr/bin/env python3
"""
Who's in Twenty but has no members access -- and who has access but is no longer
in Twenty as a paying athlete. September 5, 2026.

WHY THIS IS A SCRIPT AND NOT A QUERY
------------------------------------
The two sides live in two different Postgres containers with no link between
them, deliberately: Twenty is the commercial record (`twenty-postgres`), and
`subscriber_tokens` is the auth record (`analytics-postgres`, database
`members`). `ai-infrastructure-documentation.md` Section 21 records the decision --
the members gate is purely token-based and completely decoupled from
`customerType`, which is what makes granting access a data operation rather
than a schema change.

The cost of that decoupling is exactly this question: nothing reconciles the
two, so an athlete can pay and never be given a password, and a churned athlete
can keep one. There is no single SQL statement that can answer it. This script
is the join.

Direction 2 is the one nobody asks for and the one that matters more: Section 21
also records that All-Access churn auto-revokes the token, but there is NO
signal for a 1:1 coaching relationship ending -- offboarding is manual. So the
"still has a password" list is the accumulating side.

SAFETY
------
Read-only. It never writes to Twenty and never writes to Postgres, and it reads
the `token_roster` VIEW rather than `subscriber_tokens`, so it cannot print a
token even by accident (see the header of automation/members-area/schema.sql for
why that view exists).

USAGE
-----
    python3 members_access_gap.py                 # both directions
    python3 members_access_gap.py --csv           # machine-readable
    python3 members_access_gap.py --members-file emails.txt   # skip docker

Run it from the VPS.
"""

import argparse
import csv
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

API_URL = "http://100.70.89.17:3000/graphql"
PAGE_SIZE = 60
USER_AGENT = "Triaperformance-Members-Access-Gap"

# customerType values that SHOULD hold a members token.
# PLAN_BUYER deliberately excluded: a marketplace plan buys a plan, not the
# members area. Values confirmed against a live 400 from Twenty, July 25, 2026
# (ai-infrastructure-documentation.md, Person schema).
ENTITLED = {"OPT1_1_COACHING", "ALL_ACCESS"}

# Iván's own QA and test records -- excluded from both directions so the counts
# mean what they look like. Same pattern as backfill_person_names.py --exclude.
TEST_EMAIL_MARKERS = ("coach+", "curl", "prueba", "test@")


def load_api_key():
    key = os.environ.get("TWENTY_API_KEY")
    if key:
        return key
    for path in ["/root/.hermes/.env", "/opt/data/.env", os.path.expanduser("~/.hermes/.env")]:
        if os.path.exists(path):
            try:
                with open(path) as f:
                    for line in f:
                        if "TWENTY_API_KEY" in line and "=" in line:
                            return line.strip().split("=", 1)[1].strip().strip('"').strip("'")
            except Exception:
                pass
    return None


API_KEY = None

# ---------------------------------------------------------------------------
# The paginated query is a BYTE-FOR-BYTE copy of the one in
# backfill_person_names.py, minus the fields this script does not need.
#
# September 5, 2026: an earlier version of this file asked for `totalCount` on
# the same connection it was paginating, and pagination stopped dead at page 2
# -- 120 of 290 -- with hasNextPage/endCursor apparently repeating. The count
# and the walk are therefore taken as TWO SEPARATE CALLS. Do not "tidy" them
# back into one: one script in this repo is proven to paginate this endpoint
# correctly, and the rule that came out of this is to copy it rather than write
# a variant of it.
# ---------------------------------------------------------------------------
PEOPLE_QUERY = """
query People($first: Int!, $after: String, $filter: PersonFilterInput) {
  people(filter: $filter, first: $first, after: $after, orderBy: { createdAt: AscNullsLast }) {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        id
        name { firstName lastName }
        emails { primaryEmail }
        leadSource
        leadStatus
        createdAt
        customerType
        churnDate
        preferredLanguage
      }
    }
  }
}
"""

COUNT_QUERY = """
query PeopleCount {
  people(first: 1) { totalCount }
}
"""


def run_graphql(query, variables=None):
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        API_URL, data=payload,
        headers={"Content-Type": "application/json",
                 "Authorization": f"Bearer {API_KEY}",
                 "User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} from Twenty: {e.read().decode('utf-8', 'replace')[:400]}")
    except Exception as e:
        sys.exit(f"Could not reach Twenty at {API_URL}: {e}\nAre you on the VPS / Tailscale?")
    if "errors" in body:
        sys.exit(f"GraphQL error: {json.dumps(body['errors'])[:600]}")
    return body.get("data") or {}


# ---------------------------------------------------------------------------
# --probe: answer the pagination question by measurement, in one run.
#
# September 5, 2026. This endpoint has now returned 87, 120 and 87 across three
# variants of the same walk while backfill_person_names.py returns all 290, and
# each round of guessing cost Ivan a run. So: try every variant at once and
# print what each one actually returns. A check that reports what it saw is
# diagnostic; a check that reports pass/fail is not.
#
# The suspicion being tested is the orderBy key: this script ordered by
# `createdAt` without SELECTING it, and the working script selects it. If a
# cursor is built from the ordering field, an unselected key gives a cursor the
# resolver cannot rebuild -- which looks exactly like a walk that skips ahead
# and ends early.
# ---------------------------------------------------------------------------
FIELDS_WORKING = "id name { firstName lastName } emails { primaryEmail } leadSource leadStatus createdAt"
FIELDS_NEEDED = "customerType churnDate preferredLanguage"

PROBES = [
    ("A  backfill fields verbatim, order createdAt", FIELDS_WORKING, "orderBy: { createdAt: AscNullsLast }"),
    ("B  A + the 3 fields this script needs      ", FIELDS_WORKING + " " + FIELDS_NEEDED, "orderBy: { createdAt: AscNullsLast }"),
    ("C  needed fields, createdAt NOT selected   ", "id emails { primaryEmail } " + FIELDS_NEEDED, "orderBy: { createdAt: AscNullsLast }"),
    ("D  C + createdAt selected                  ", "id emails { primaryEmail } createdAt " + FIELDS_NEEDED, "orderBy: { createdAt: AscNullsLast }"),
    ("E  B with no orderBy at all                ", FIELDS_WORKING + " " + FIELDS_NEEDED, ""),
    ("F  B ordered by id instead                 ", FIELDS_WORKING + " " + FIELDS_NEEDED, "orderBy: { id: AscNullsLast }"),
]


def probe(page_size):
    total = fetch_total()
    print(f"Twenty totalCount = {total}\n")
    print(f"{'variant':46s} {'fetched':>8s}  {'pages':>5s}  verdict")
    for label, fields, order in PROBES:
        q = ("query P($first: Int!, $after: String) {\n"
             f"  people(first: $first, after: $after{(', ' + order) if order else ''}) {{\n"
             "    pageInfo { hasNextPage endCursor }\n"
             f"    edges {{ node {{ {fields} }} }}\n"
             "  }\n}")
        n, pages, cursor, seen, err = 0, 0, None, set(), None
        try:
            while True:
                blk = (run_graphql(q, {"first": page_size, "after": cursor})
                       .get("people") or {})
                edges = blk.get("edges", [])
                n += len(edges); pages += 1
                info = blk.get("pageInfo") or {}
                if not info.get("hasNextPage"):
                    break
                cursor = info.get("endCursor")
                if not cursor or cursor in seen:
                    err = "cursor repeated"; break
                seen.add(cursor)
                if pages > 40:
                    err = "runaway"; break
        except SystemExit as e:
            err = str(e)[:60]
        ok = "OK" if (total is not None and n == total) else "SHORT"
        print(f"{label:46s} {n:>8d}  {pages:>5d}  {ok}{' -- ' + err if err else ''}")
    print("\nUse the first variant marked OK. If none is OK, raise --page-size and re-run.")


def fetch_total():
    """Its own call, deliberately -- see the note above PEOPLE_QUERY."""
    try:
        return ((run_graphql(COUNT_QUERY).get("people") or {}).get("totalCount"))
    except SystemExit:
        return None


def fetch_people(page_size, expect=None):
    """Walk every page, then REFUSE to return a short read.

    The guard is the point of this function, not the pagination. The first live
    run returned 87 of 290 and said nothing: the report looked complete and
    named 15 athletes as holding stale access, three of whom this repo
    documents by name as active. A partial fetch here does not fail, it LIES,
    and it lies in the direction of telling Ivan to revoke a paying athlete's
    password.
    """
    total = fetch_total()
    out, cursor, seen = [], None, set()
    while True:
        data = run_graphql(PEOPLE_QUERY,
                           {"first": page_size, "after": cursor, "filter": None})
        block = data.get("people") or {}
        edges = block.get("edges", [])
        out += [e["node"] for e in edges]
        info = block.get("pageInfo") or {}
        if not info.get("hasNextPage"):
            break
        cursor = info.get("endCursor")
        if not cursor or cursor in seen:      # infinite-loop guard only
            break
        seen.add(cursor)

    if total is not None and len(out) != total:
        sys.exit(f"SHORT READ: Twenty reports totalCount={total}, fetched {len(out)}. "
                 f"Refusing to report a gap from an incomplete list.")
    if expect is not None and len(out) != expect:
        sys.exit(f"SHORT READ: --expect {expect}, fetched {len(out)}.")
    if total is None:
        print("  (note: no totalCount available -- cross-check the people count "
              "against backfill_person_names.py, which prints its own.)", file=sys.stderr)
    return out


def fetch_members(path=None):
    """Roster emails from the token_roster VIEW -- never the table."""
    if path:
        with open(path) as f:
            rows = [(l.strip().lower(), "", "") for l in f if l.strip()]
        return rows
    sql = ("SELECT lower(trim(email)), preferred_language, "
           "coalesce(access_count,0)::text "
           "FROM token_roster WHERE active IS TRUE AND revoked_at IS NULL;")
    try:
        raw = subprocess.check_output(
            ["docker", "exec", "-i", "analytics-postgres",
             "psql", "-U", "analytics", "-d", "members", "-At", "-F", "|", "-c", sql],
            text=True, stderr=subprocess.STDOUT, timeout=60)
    except FileNotFoundError:
        sys.exit("docker not found -- run this on the VPS, or pass --members-file.")
    except subprocess.CalledProcessError as e:
        sys.exit(f"psql failed:\n{e.output[:600]}")
    rows = []
    for line in raw.splitlines():
        if not line.strip():
            continue
        parts = line.split("|")
        rows.append((parts[0].strip(), parts[1] if len(parts) > 1 else "",
                     parts[2] if len(parts) > 2 else ""))
    return rows


# ---------------------------------------------------------------------------
# --grant: issue a members token to someone this script just proved is owed one.
#
# BOUNDARY WITH backfill_existing_customers.py, so this does not become a second
# granting tool (added September 5, 2026):
#   that script owns BULK ONBOARDING FROM A CSV -- it creates or updates the
#   Twenty record and then makes a token, for people who may not be in Twenty at
#   all. This mode owns the other case: somebody already in Twenty, already
#   correct, whom the reconciliation above has just identified. Running the CSV
#   script on those people means accepting an unwanted PATCH (it defaults
#   leadStatus to WON_CUSTOMER) in order to get the token half.
# The token alphabet is IMPORTED from that script rather than copied, because it
# must stay identical to the n8n "Generate Member Token" node and there are
# already two copies of it.
#
# THREE SAFETY PROPERTIES, all deliberate:
#   1. Nothing is granted without --only or --grant-all. Iván's own address is
#      in the entitled list; a bare --grant that provisioned everybody would be
#      a bad default.
#   2. It NEVER PRINTS A TOKEN. A token is a working password into paid content,
#      and the whole table has been pasted into a chat transcript three times in
#      three days (schema.sql, token_roster). Pull one at a time with
#      OPERATIONS.md section 3 at the moment you message that athlete.
#   3. An existing row for that email -- active OR revoked -- is a REFUSAL, not
#      an insert. A revoked athlete coming back needs a reactivate
#      (OPERATIONS.md section 5), not a second row; the backfill script's known
#      gap is exactly this, and duplicate active tokens are a documented
#      cleanup query.
# ---------------------------------------------------------------------------
def _token_alphabet():
    import importlib.util
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "members-area", "backfill_existing_customers.py")
    try:
        spec = importlib.util.spec_from_file_location("_bf", path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod.TOKEN_ALPHABET
    except Exception as e:
        sys.exit(f"Could not read TOKEN_ALPHABET from {path}: {e}\n"
                 "Refusing to invent an alphabet -- it must match the n8n "
                 "Generate Member Token node exactly.")


def psql(sql, quiet=False):
    try:
        return subprocess.check_output(
            ["docker", "exec", "-i", "analytics-postgres", "psql",
             "-U", "analytics", "-d", "members", "-At", "-c", sql],
            text=True, stderr=subprocess.STDOUT, timeout=60)
    except FileNotFoundError:
        sys.exit("docker not found -- --grant must run on the VPS.")
    except subprocess.CalledProcessError as e:
        if not quiet:
            sys.exit(f"psql failed:\n{e.output[:600]}")
        raise


def grant(no_access, only, apply_it):
    import secrets
    alphabet = _token_alphabet()
    wanted = ([e for e, _, _ in no_access] if only == "ALL"
              else [x.strip().lower() for x in only.split(",") if x.strip()])
    by_email = {e: p for e, p, _ in no_access}

    plan, refused = [], []
    for email in wanted:
        person = by_email.get(email)
        if not person:
            refused.append((email, "not in the PAYING-NO-ACCESS list -- "
                                   "re-run without --grant and check"))
            continue
        existing = psql("SELECT active FROM subscriber_tokens "
                        f"WHERE lower(email) = '{email}';").strip()
        if existing:
            refused.append((email, f"a row already exists (active={existing}). "
                                   "Reactivate it -- OPERATIONS.md section 5 -- "
                                   "do not create a second."))
            continue
        lang = person.get("preferredLanguage") or "SPANISH"
        if lang not in ("SPANISH", "ENGLISH", "PORTUGUESE"):
            refused.append((email, f"preferredLanguage is {lang!r}; set it in "
                                   "Twenty first so the login routes correctly"))
            continue
        plan.append((email, person["id"], lang,
                     "".join(secrets.choice(alphabet) for _ in range(20)),
                     not person.get("preferredLanguage")))

    for email, why in refused:
        print(f"  REFUSED  {email:45s} {why}")
    if refused and plan:
        print()
    for email, pid, lang, _tok, defaulted in plan:
        flag = "  <-- no preferredLanguage in Twenty, defaulting" if defaulted else ""
        print(f"  {'WOULD GRANT' if not apply_it else 'GRANTED    '}  "
              f"{email:45s} {lang}{flag}")
    if not plan:
        print("\nNothing to grant.")
        return

    if not apply_it:
        print(f"\n{len(plan)} token(s) ready. Add --apply to write them.")
        print("Tokens are generated at write time and are never printed.")
        return

    for email, pid, lang, tok, _ in plan:
        psql("INSERT INTO subscriber_tokens "
             "(twenty_person_id, email, token, preferred_language, active) "
             f"VALUES ('{pid}', '{email}', '{tok}', '{lang}', TRUE);")
    print(f"\n{len(plan)} token(s) written. NOT printed here, on purpose.")
    print("Pull each one when you message that athlete:")
    print("  docker exec -it analytics-postgres psql -U analytics -d members -c \\")
    print("    \"SELECT token FROM subscriber_tokens WHERE email = '<theirs>';\"")
    print("No email is sent by this script. Send the password yourself.")


# ---------------------------------------------------------------------------
# --roster: the token roster with real names on it, joined from Twenty.
#
# Added September 5, 2026, replacing a hand-written query that selected `token`
# alongside email, language and access counts. THE TOKEN COLUMN IS DELIBERATELY
# ABSENT and is not coming back: a roster carrying names AND working passwords
# is strictly worse than either alone, and this exact query is the one that has
# put the whole table into a chat transcript three times in three days
# (schema.sql's header, OPERATIONS.md section 2). Pull ONE token, at the moment
# you send it, with OPERATIONS.md section 3.
#
# The join is on lowercased email because that is the only key the two systems
# share -- subscriber_tokens.twenty_person_id exists but is 'QA-FIXTURE' on the
# three permanent test rows and was never backfilled everywhere else.
# ---------------------------------------------------------------------------
ROSTER_SQL = ("SELECT lower(trim(email)), preferred_language, active, "
              "coalesce(access_count,0), coalesce(to_char(last_accessed_at,'YYYY-MM-DD'),'never'), "
              "to_char(created_at,'YYYY-MM-DD') "
              "FROM token_roster WHERE active IS TRUE ORDER BY created_at DESC;")


def roster(people):
    by_email = {}
    for p in people:
        e = ((p.get("emails") or {}).get("primaryEmail") or "").strip().lower()
        if e:
            by_email[e] = p
    raw = psql(ROSTER_SQL)
    rows, unmatched = [], 0
    for line in raw.splitlines():
        if not line.strip():
            continue
        email, lang, active, cnt, last, created = (line.split("|") + [""] * 6)[:6]
        p = by_email.get(email)
        if p:
            n = p.get("name") or {}
            first, last_name = (n.get("firstName") or ""), (n.get("lastName") or "")
            ctype = p.get("customerType") or "-"
        else:
            first, last_name, ctype = "", "", "NOT IN TWENTY"
            unmatched += 1
        rows.append((email, first, last_name, lang, cnt, last, created, ctype))

    print(f"{'email':40s} {'first':14s} {'surname':18s} {'lang':11s} "
          f"{'uses':>4s} {'last seen':11s} {'created':11s} type")
    print("-" * 128)
    for r in rows:
        print(f"{r[0]:40s} {r[1]:14s} {r[2]:18s} {r[3]:11s} "
              f"{r[4]:>4s} {r[5]:11s} {r[6]:11s} {r[7]}")
    never = sum(1 for r in rows if r[4] == "0")
    print(f"\n{len(rows)} active tokens. {never} have never logged in.")
    if unmatched:
        print(f"{unmatched} hold a token and have NO Person in Twenty -- "
              f"QA fixtures are expected here; anyone else is worth a look.")
    print("\nNo token column, on purpose. One at a time, OPERATIONS.md section 3.")


def is_test(email):
    e = (email or "").lower()
    return any(m in e for m in TEST_EMAIL_MARKERS)


def main():
    global API_KEY
    ap = argparse.ArgumentParser(description="Reconcile Twenty against members-area tokens.")
    ap.add_argument("--csv", action="store_true", help="machine-readable output")
    ap.add_argument("--members-file", default=None,
                    help="file of member emails, one per line (skips docker)")
    ap.add_argument("--page-size", type=int, default=PAGE_SIZE,
                    help=f"GraphQL page size (default {PAGE_SIZE})")
    ap.add_argument("--expect", type=int, default=None,
                    help="fail unless exactly N people are fetched -- a second, independent gate on top of totalCount")
    ap.add_argument("--roster", action="store_true",
                    help="print the active-token roster with names from Twenty "
                         "(never tokens), then exit")
    ap.add_argument("--only", default=None, metavar="EMAILS",
                    help="grant tokens to these comma-separated addresses "
                         "(must appear in the PAYING-NO-ACCESS list)")
    ap.add_argument("--grant-all", action="store_true",
                    help="grant to every address in that list -- read it first, "
                         "Ivan's own address is usually in it")
    ap.add_argument("--apply", action="store_true",
                    help="actually write the tokens (default is a dry run)")
    ap.add_argument("--probe", action="store_true",
                    help="try every query variant and print what each returns, then exit")
    ap.add_argument("--include-test", action="store_true",
                    help="do not filter out coach+/test/prueba records")
    args = ap.parse_args()

    API_KEY = load_api_key()
    if not API_KEY:
        sys.exit("No TWENTY_API_KEY (env, /root/.hermes/.env or /opt/data/.env).")

    if args.probe:
        probe(args.page_size)
        return

    people = fetch_people(args.page_size, args.expect)

    if args.roster:
        roster(people)
        return
    members = fetch_members(args.members_file)
    member_map = {e: (lang, cnt) for e, lang, cnt in members if e}
    member_emails = set(member_map)

    entitled, token_owners = [], set()
    for p in people:
        email = ((p.get("emails") or {}).get("primaryEmail") or "").strip().lower()
        if not email:
            continue
        if not args.include_test and is_test(email):
            continue
        ctype = p.get("customerType")
        churned = bool(p.get("churnDate")) or p.get("leadStatus") == "CHURNED_CUSTOMER"
        if ctype in ENTITLED and not churned:
            entitled.append((email, p, ctype))
        if email in member_emails:
            token_owners.add(email)

    # Direction 1 -- pays, has no password.
    no_access = [(e, p, c) for e, p, c in entitled if e not in member_emails]

    # Direction 2 -- has a password, is not an entitled active athlete in Twenty.
    entitled_emails = {e for e, _, _ in entitled}
    stale_access = []
    for e in sorted(member_emails):
        if not args.include_test and is_test(e):
            continue
        if e not in entitled_emails:
            lang, cnt = member_map[e]
            stale_access.append((e, lang, cnt))

    if args.csv:
        w = csv.writer(sys.stdout)
        w.writerow(["direction", "email", "customer_type_or_language", "detail"])
        for e, p, c in sorted(no_access):
            n = p.get("name") or {}
            w.writerow(["NO_ACCESS", e, c,
                        f"{n.get('firstName','')} {n.get('lastName','')}".strip()])
        for e, lang, cnt in stale_access:
            w.writerow(["STALE_ACCESS", e, lang, f"access_count={cnt}"])
        return

    print(f"Twenty: {len(people)} people, {len(entitled)} entitled and active "
          f"({'/'.join(sorted(ENTITLED))}, churned excluded).")
    print(f"Members: {len(member_emails)} active tokens.\n")

    print(f"=== 1. PAYING, NO MEMBERS ACCESS  ({len(no_access)}) ===")
    print("    Grant with OPERATIONS.md section 1.\n")
    for e, p, c in sorted(no_access):
        n = p.get("name") or {}
        print(f"  {e:45s} {c:18s} {n.get('firstName','')} {n.get('lastName','')}".rstrip())
    if not no_access:
        print("  (none)")

    print(f"\n=== 2. HAS ACCESS, NOT AN ENTITLED ACTIVE ATHLETE  ({len(stale_access)}) ===")
    print("    Expected to accumulate: All-Access churn auto-revokes, a 1:1")
    print("    coaching relationship ending has no signal and is revoked by hand.")
    print("    Revoke with OPERATIONS.md's manual-revoke query.\n")
    for e, lang, cnt in stale_access:
        print(f"  {e:45s} {lang:12s} access_count={cnt}")
    if not stale_access:
        print("  (none)")

    print("\nNeither list is automatically wrong -- a comp athlete or a barter")
    print("arrangement legitimately appears in list 2. Read it, do not sweep it.")

    if args.only or args.grant_all:
        print(f"\n=== GRANTING {'(APPLY)' if args.apply else '(DRY RUN)'} ===\n")
        grant(no_access, "ALL" if args.grant_all else args.only, args.apply)


if __name__ == "__main__":
    main()
