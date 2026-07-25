#!/usr/bin/env python3
"""
Fetches the active 1:1 coaching roster for the Monday check-in digest.

"Active" = customerType OPT1_1_COACHING in Twenty AND churnDate is blank.
(Decided July 26, 2026 -- deliberately NOT tied to the members-area token's
active flag, which is a separate concern. churnDate isn't set automatically
for coaching clients yet -- see ai-infrastructure-documentation.md §13 -- so
for now this is only as accurate as Iván manually keeps churnDate updated
when a coaching relationship ends. Revisit if/when a real churn signal for
1:1 coaching exists.)

This script only fetches and prints the roster as JSON -- it does not draft
messages or send anything. That's deliberate: drafting the weekly message
variation needs real judgment (Hermes/LLM's job), this script is the
deterministic, tested, boring half (human-written, per the standing "write
mechanical scripts by hand, don't let the agent freehand them" principle in
ai-infrastructure-documentation.md problem #7).

Needs Tailscale access to Twenty (100.70.89.17:3000) -- run from the VPS or
Iván's Mac.

Usage:
  export TWENTY_API_KEY="..."   # from Bitwarden
  python3 fetch_active_coaching_roster.py

Output: JSON array to stdout, one object per active coaching athlete:
  {
    "person_id": "...", "email": "...", "first_name": "...",
    "phone_calling_code": "+57", "phone_number": "3102855417",
    "preferred_language": "SPANISH"
  }
"""

import datetime
import json
import os
import sys
import urllib.error
import urllib.request

TWENTY_BASE_URL = os.environ.get("TWENTY_BASE_URL", "http://100.70.89.17:3000").strip()
TWENTY_API_KEY = os.environ.get("TWENTY_API_KEY", "").strip()

# Must stay in sync with the numbered list in monday-message-voice-guide.md.
ROTATING_THEMES = [
    "recovery_sleep",
    "nutrition_fueling",
    "mental_motivation",
    "life_balance",
    "session_enjoyment",
    "pain_discomfort_awareness",
    "gear_check",
    "confidence_readiness",
    "environment",
    "support_system",
    "self_awareness_learning",
    "big_picture_goal_check",
]


def current_theme():
    week = datetime.date.today().isocalendar()[1]
    index = week % len(ROTATING_THEMES)
    return index, ROTATING_THEMES[index]


def auth_header_value(key):
    if key.lower().startswith("bearer "):
        return key
    return f"Bearer {key}"


def twenty_request(method, path):
    url = f"{TWENTY_BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", auth_header_value(TWENTY_API_KEY))
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {e.read().decode('utf-8', 'ignore')}")


def get_coaching_people():
    """One call, all OPT1_1_COACHING people -- churnDate filtering happens
    client-side below rather than in the query string, since the exact
    Twenty filter syntax for 'is null' isn't confirmed against a live
    response (unlike [eq], which is proven working elsewhere in this repo)."""
    result = twenty_request(
        "GET",
        "/rest/people?filter=customerType[eq]:OPT1_1_COACHING&limit=200",
    )
    return (result.get("data") or {}).get("people") or []


def main():
    if not TWENTY_API_KEY:
        sys.exit("Set TWENTY_API_KEY first (from Bitwarden).")

    people = get_coaching_people()

    roster = []
    skipped_churned = 0
    for person in people:
        if person.get("churnDate"):
            skipped_churned += 1
            continue  # churned -- not active

        email = ((person.get("emails") or {}).get("primaryEmail") or "").strip().lower()
        phones = person.get("phones") or {}
        name = person.get("name") or {}

        roster.append({
            "person_id": person.get("id"),
            "email": email,
            "first_name": name.get("firstName") or "",
            "last_name": name.get("lastName") or "",
            "phone_calling_code": phones.get("primaryPhoneCallingCode") or "",
            "phone_number": phones.get("primaryPhoneNumber") or "",
            "preferred_language": person.get("preferredLanguage") or "SPANISH",
        })

    theme_index, theme = current_theme()
    output = {
        "theme_index": theme_index,
        "theme": theme,
        "roster": roster,
    }
    print(json.dumps(output, indent=2, ensure_ascii=False))

    missing_phone = [r["email"] for r in roster if not r["phone_calling_code"] or not r["phone_number"]]
    if missing_phone:
        print(f"WARNING: {len(missing_phone)} active coaching athlete(s) have no phone on file: {missing_phone}", file=sys.stderr)
    if skipped_churned:
        print(f"INFO: {skipped_churned} coaching Person record(s) skipped due to churnDate set.", file=sys.stderr)


if __name__ == "__main__":
    main()
