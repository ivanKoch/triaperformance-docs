#!/usr/bin/env python3
"""
Re-splits firstName/lastName on existing Twenty people, September 4, 2026.

WHY THIS EXISTS
---------------
Four n8n parsers built the name split by popping the LAST token as the surname
and keeping everything else as the first name. That is correct on a two-token
name and wrong on the Latin two-surname norm, so "Paula Maria Gonzalez" was
stored as firstName "Paula Maria Gonzalez" / lastName "" -- and every greeting
that reads firstName said "Hola Paula Maria Gonzalez".

The parsers were fixed the same day. This script fixes the records they already
wrote. It reproduces the SAME rule the JS now uses, deliberately -- if you change
one, change the other:

    first non-initial token  -> firstName
    everything after it      -> lastName

SAFETY -- read this before running with --apply
-----------------------------------------------
This script only ever RE-PARTITIONS a name. It never invents, drops or reorders
a token. Every proposed change is checked: the lowercased token list of
(firstName + lastName) must be identical before and after, or the record is
skipped and reported under SKIPPED. That check is what makes --apply safe to run
against the whole table rather than a hand-picked list.

Case repair is the one exception, and it is opt-in (--fix-case): a name stored
entirely in CAPITALS or entirely in lowercase is title-cased, because "Hola
PAULA" reads as a mail merge too. It changes characters, so it is off by default.

USAGE
-----
    python3 backfill_person_names.py                    # dry run, everything
    python3 backfill_person_names.py --source COACHMATCH
    python3 backfill_person_names.py --fix-case         # dry run, incl. casing
    python3 backfill_person_names.py --apply            # writes to Twenty
    python3 backfill_person_names.py --apply --fix-case

Dry run is the default and prints exactly what --apply would send.
Run it from the VPS (or anywhere with TWENTY_API_KEY and Tailscale reachability).
"""

import argparse
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request

API_URL = "http://100.70.89.17:3000/graphql"
PAGE_SIZE = 60
USER_AGENT = "Triaperformance-Name-Backfill"


# --------------------------------------------------------------------------
# auth -- same lookup order as update_lead_status.py and twenty_followup_check.py
# --------------------------------------------------------------------------
def load_api_key():
    key = os.environ.get("TWENTY_API_KEY")
    if key:
        return key
    for path in ["/root/.hermes/.env", "/opt/data/.env", os.path.expanduser("~/.hermes/.env")]:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    for line in f:
                        if "TWENTY_API_KEY" in line:
                            parts = line.strip().split("=", 1)
                            if len(parts) == 2:
                                return parts[1].strip().strip('"').strip("'")
            except Exception:
                pass
    return None


API_KEY = None


def run_graphql(query, variables=None):
    payload = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code} from Twenty: {e.read().decode('utf-8', 'replace')[:400]}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Could not reach Twenty at {API_URL}: {e}", file=sys.stderr)
        print("Are you on the VPS / Tailscale?", file=sys.stderr)
        sys.exit(1)
    if "errors" in body:
        print(f"GraphQL error: {json.dumps(body['errors'])[:600]}", file=sys.stderr)
        sys.exit(1)
    return body.get("data") or {}


# --------------------------------------------------------------------------
# the split -- mirror of the JS in the four n8n parsers. Keep them identical.
# --------------------------------------------------------------------------
WORD_RE = re.compile(r"[^\W\d_][\w'’-]*", re.UNICODE)


def title_case(s):
    return WORD_RE.sub(lambda m: m.group(0)[:1].upper() + m.group(0)[1:].lower(), s)


def is_initial(token):
    stripped = token.rstrip(".")
    return len(stripped) == 1 and stripped.isalpha()


def has_upper(s):
    return any(unicodedata.category(c) == "Lu" for c in s)


def has_lower(s):
    return any(unicodedata.category(c) == "Ll" for c in s)


def split_name(full_name, fix_case):
    """first non-initial token -> first name; everything after it -> surname."""
    clean = full_name
    if fix_case:
        if (full_name == full_name.upper() and has_upper(full_name)) or \
           (full_name == full_name.lower() and has_lower(full_name)):
            clean = title_case(full_name)

    parts = [p for p in clean.split() if p]
    if not parts:
        return "", ""

    first_idx = next((i for i, t in enumerate(parts) if not is_initial(t)), 0)
    return parts[first_idx], " ".join(parts[first_idx + 1:])


def tokens_key(*chunks):
    """Lowercased token list -- the invariant a re-partition must not change."""
    out = []
    for c in chunks:
        out.extend(t.lower() for t in (c or "").split())
    return out


# --------------------------------------------------------------------------
# fetch
# --------------------------------------------------------------------------
PEOPLE_QUERY = """
query BackfillPeople($first: Int!, $after: String, $filter: PersonFilterInput) {
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
      }
    }
  }
}
"""

UPDATE_MUTATION = """
mutation FixPersonName($id: UUID!, $data: PersonUpdateInput!) {
  updatePerson(id: $id, data: $data) { id name { firstName lastName } }
}
"""


def fetch_people(source_filter):
    gql_filter = {"leadSource": {"eq": source_filter}} if source_filter else None
    people, cursor = [], None
    while True:
        data = run_graphql(PEOPLE_QUERY, {
            "first": PAGE_SIZE,
            "after": cursor,
            "filter": gql_filter,
        })
        block = data.get("people") or {}
        for edge in block.get("edges", []):
            people.append(edge["node"])
        info = block.get("pageInfo") or {}
        if not info.get("hasNextPage"):
            break
        cursor = info.get("endCursor")
        if not cursor:
            break
    return people


# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------
def main():
    global API_KEY

    ap = argparse.ArgumentParser(description="Re-split firstName/lastName on Twenty people.")
    ap.add_argument("--apply", action="store_true",
                    help="actually write. Omitted = dry run (the default).")
    ap.add_argument("--fix-case", action="store_true",
                    help="also title-case names stored ALL CAPS or all lowercase.")
    ap.add_argument("--source", default=None, metavar="ENUM",
                    help="narrow to one leadSource, e.g. COACHMATCH. Default: every person.")
    ap.add_argument("--exclude", default=None, metavar="REGEX",
                    help="skip records whose primary email matches this regex. "
                         "Use it to leave test records alone, e.g. "
                         r"--exclude 'coach\+.*@triaperformance\.com'")
    ap.add_argument("--limit", type=int, default=0,
                    help="stop after N changes (useful for a first cautious --apply).")
    args = ap.parse_args()

    API_KEY = load_api_key()
    if not API_KEY:
        print("TWENTY_API_KEY is not set and was not found in the usual .env paths.", file=sys.stderr)
        sys.exit(1)

    exclude_re = re.compile(args.exclude, re.IGNORECASE) if args.exclude else None

    people = fetch_people(args.source)
    scope = f"leadSource = {args.source}" if args.source else "all people"
    print(f"Fetched {len(people)} records ({scope}).\n")

    changes, skipped, excluded = [], [], 0

    for p in people:
        email = ((p.get("emails") or {}).get("primaryEmail") or "")
        if exclude_re and exclude_re.search(email):
            excluded += 1
            continue

        name = p.get("name") or {}
        old_first = (name.get("firstName") or "").strip()
        old_last = (name.get("lastName") or "").strip()
        full = " ".join(x for x in (old_first, old_last) if x)
        if not full:
            continue

        new_first, new_last = split_name(full, args.fix_case)
        if (new_first, new_last) == (old_first, old_last):
            continue

        # the invariant: re-partition only, never edit the token list
        if tokens_key(old_first, old_last) != tokens_key(new_first, new_last):
            skipped.append((p, old_first, old_last, new_first, new_last))
            continue

        row = {
            "id": p["id"],
            "email": email,
            "source": p.get("leadSource") or "",
            "status": p.get("leadStatus") or "",
            "old": (old_first, old_last),
            "new": (new_first, new_last),
        }
        changes.append(row)

    if not changes:
        print("Nothing to change. Every record already splits the way the parsers now do.")
        if excluded:
            print(f"{excluded} record(s) excluded by --exclude.")
        if skipped:
            print(f"\n{len(skipped)} record(s) skipped by the safety check -- see below.")
        else:
            return

    width = max((len(c["old"][0]) for c in changes), default=10)
    width = min(max(width, 12), 34)

    print(f"{'GREETING WAS'.ljust(width)}  ->  GREETING BECOMES     (full name unchanged)")
    print("-" * (width + 58))
    for c in changes:
        was, now = c["old"][0], c["new"][0]
        tail = f"  [{c['source'] or '-'}/{c['status'] or '-'}] {c['email']}"
        print(f"Hola {was}".ljust(width + 5) + f"  ->  Hola {now}".ljust(26) + tail)

    print(f"\n{len(changes)} record(s) would change.")
    if excluded:
        print(f"{excluded} record(s) excluded by --exclude.")
    if skipped:
        print(f"{len(skipped)} record(s) SKIPPED by the safety check "
              f"(token list would have changed -- inspect these by hand):")
        for p, of, ol, nf, nl in skipped:
            print(f"  {p['id']}  '{of}' / '{ol}'  ->  '{nf}' / '{nl}'")

    if not args.apply:
        print("\nDRY RUN -- nothing was written. Re-run with --apply to commit.")
        return

    print("\nApplying...")
    ok = fail = 0
    for i, c in enumerate(changes, 1):
        if args.limit and ok >= args.limit:
            print(f"--limit {args.limit} reached; stopping.")
            break
        try:
            run_graphql(UPDATE_MUTATION, {
                "id": c["id"],
                "data": {"name": {"firstName": c["new"][0], "lastName": c["new"][1]}},
            })
            ok += 1
            print(f"  [{i}/{len(changes)}] ok   {(c['new'][0] + ' ' + c['new'][1]).strip()}")
        except SystemExit:
            fail += 1
            print(f"  [{i}/{len(changes)}] FAIL {c['id']}")
        time.sleep(0.12)  # be polite to a single-container CRM

    print(f"\nDone. {ok} updated, {fail} failed.")


if __name__ == "__main__":
    main()
