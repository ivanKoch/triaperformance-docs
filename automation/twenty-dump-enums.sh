#!/usr/bin/env bash
# twenty-dump-enums.sh — read every SELECT/MULTI_SELECT field on Twenty and
# print its options, straight from the metadata API.
#
#   export TWENTY_API_KEY='...'      # on its own line, nothing else on it
#   bash automation/twenty-dump-enums.sh
#
# Writes ~/twenty-person-enums.json as well as printing, so the result can be
# pasted back into a doc without re-typing it.
#
# 🚨 WHY THIS EXISTS. Every enum value list in this repo has been hand-typed
# prose — `zone-magnet-runbook.md` says leadSource "reads COACHMATCH,
# WEBSITE_FORM, REFERRAL, OTHER, PLAN_CATALOG", `contact-form-pipeline-runbook.md`
# says "confirmed value WEBSITE_FORM", `referral-program-brief.md` says "six
# values, confirmed Aug 8, 2026". Three docs, three different counts, none of
# them re-derivable — and AI_ASSISTANT was added in early September 2026 without
# any of them learning about it. This is the same failure the repo has already
# recorded four times for the tool inventories: a hand-maintained list is not a
# control, because the thing it is meant to catch never appears in it.
#
# So: do not type an enum list into a document again. Run this and paste.
#
# It carries no credential. The key comes from the environment and is never
# echoed; nothing here writes to Twenty.

set -u
: "${TWENTY_API_KEY:?export TWENTY_API_KEY first}"
BASE="http://100.70.89.17:3000"
AUTH="Authorization: Bearer ${TWENTY_API_KEY}"
OUT="$HOME/twenty-person-enums.json"

echo "--- probing the metadata API ---"
for EP in "/rest/metadata/fields?limit=500" "/rest/metadata/fields" "/metadata/fields"; do
  CODE=$(curl -s -o /tmp/tw.json -w '%{http_code}' -H "$AUTH" "${BASE}${EP}")
  echo "GET ${EP} -> ${CODE}"
  if [ "$CODE" = "200" ]; then FOUND="$EP"; break; fi
done

if [ -z "${FOUND:-}" ]; then
  echo "--- REST metadata refused; trying GraphQL ---"
  curl -s -o /tmp/tw.json -w 'POST /metadata -> %{http_code}\n' \
    -H "$AUTH" -H "Content-Type: application/json" \
    --data-binary '{"query":"{ fields(paging:{first:500}) { edges { node { name label type options isActive object { nameSingular } } } } }"}' \
    "${BASE}/metadata"
fi

python3 - "$OUT" <<'PY'
import json, sys, collections
raw = open("/tmp/tw.json", encoding="utf-8").read()
try:
    d = json.loads(raw)
except Exception:
    print("Could not parse a JSON response. First 400 bytes:\n" + raw[:400]); sys.exit(1)

def walk(o):
    if isinstance(o, dict):
        if o.get("name") and o.get("type") in ("SELECT", "MULTI_SELECT") and o.get("options"):
            yield o
        for v in o.values(): yield from walk(v)
    elif isinstance(o, list):
        for v in o: yield from walk(v)

fields = list(walk(d))
if not fields:
    print("No SELECT fields in the response. First 400 bytes:\n" + raw[:400]); sys.exit(1)

def objname(f):
    o = f.get("object")
    if isinstance(o, dict):
        return o.get("nameSingular") or o.get("name") or "?"
    return f.get("objectMetadataId", "?")[:8] if f.get("objectMetadataId") else "?"

out = collections.OrderedDict()
for f in sorted(fields, key=lambda x: (objname(x), x["name"])):
    key = objname(f) + "." + f["name"]
    vals = [o.get("value") for o in f["options"] if isinstance(o, dict)]
    out[key] = vals
    mark = "  <-- " if f["name"] == "leadSource" else "      "
    print("%s%-34s %2d: %s" % (mark, key, len(vals), ", ".join(v for v in vals if v)))

json.dump(out, open(sys.argv[1], "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("\nwritten: " + sys.argv[1])
PY
