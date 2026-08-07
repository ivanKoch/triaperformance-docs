#!/usr/bin/env python3
import sys
import json
import urllib.request
import os
from datetime import datetime, timezone

API_URL = "http://100.70.89.17:3000/graphql"
VALID_STATUSES = {
    "NEW", "MESSAGE_SENT", "REPLIED", "IN_CONVERSATION",
    "LOST_NO_RESPONSE", "LOST_NOT_INTERESTED", "LOST_PRICE", "WON_CUSTOMER",
    # Added Aug 6, 2026. Normally set automatically by the subscription-lifecycle
    # workflow when TrainingPeaks confirms a cancellation; listed here so a
    # churn that never produced a confirmation email can still be recorded by
    # hand. NOTE: the lookup below only searches leads at MESSAGE_SENT, so a
    # churned subscriber (WON_CUSTOMER) will not be found by name — this value
    # is accepted but not yet reachable through this script. See open-loops.md.
    "CHURNED_CUSTOMER"
}

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

def run_graphql(query, variables=None):
    api_key = load_api_key()
    if not api_key:
        print("Error: TWENTY_API_KEY is not configured.", file=sys.stderr)
        sys.exit(1)
    req_data = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=req_data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "Hermes-Lead-Updater"
        }
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        if "errors" in res_data:
            print(f"GraphQL Error: {res_data['errors']}", file=sys.stderr)
            sys.exit(1)
        return res_data.get("data")

def find_candidates(name_search):
    query = """
    query FindActiveLeads {
      people(filter: { leadStatus: { eq: "MESSAGE_SENT" } }) {
        edges {
          node {
            id
            name { firstName lastName }
          }
        }
      }
    }
    """
    data = run_graphql(query)
    edges = data.get("people", {}).get("edges", [])
    search_lower = name_search.lower()
    matches = []
    for edge in edges:
        node = edge["node"]
        first = (node["name"].get("firstName") or "").lower()
        last = (node["name"].get("lastName") or "").lower()
        if search_lower in first or search_lower in last:
            matches.append(node)
    return matches

def update_status(person_id, new_status):
    query = """
    mutation UpdatePerson($id: ID!, $data: PersonUpdateInput!) {
      updatePerson(id: $id, data: $data) { id }
    }
    """
    now_str = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    variables = {
        "id": person_id,
        "data": {
            "leadStatus": new_status,
            "lastTouchpoint": now_str
        }
    }
    return run_graphql(query, variables)

def main():
    if len(sys.argv) != 3:
        print("Usage: update_lead_status.py <name_search> <STATUS_ENUM_VALUE>", file=sys.stderr)
        sys.exit(1)

    name_search = sys.argv[1]
    new_status = sys.argv[2].upper()

    if new_status not in VALID_STATUSES:
        print(f"Invalid status '{new_status}'. Must be one of: {', '.join(sorted(VALID_STATUSES))}", file=sys.stderr)
        sys.exit(1)

    matches = find_candidates(name_search)

    if len(matches) == 0:
        print(f"No match found for '{name_search}' among active (MESSAGE_SENT) leads.")
        sys.exit(1)
    if len(matches) > 1:
        print(f"Multiple matches found for '{name_search}', be more specific:")
        for m in matches:
            full_name = f"{m['name'].get('firstName','')} {m['name'].get('lastName','')}".strip()
            print(f"- {full_name} (id: {m['id']})")
        sys.exit(1)

    person = matches[0]
    full_name = f"{person['name'].get('firstName','')} {person['name'].get('lastName','')}".strip()
    result = update_status(person["id"], new_status)
    print(f"Updated {full_name} (id: {person['id']}) to leadStatus={new_status}")
    print(f"Twenty response: {result}")

if __name__ == "__main__":
    main()
