# `/api/tool-lead` — the generic lead-magnet endpoint

*Created September 9, 2026.* **One webhook, one workflow, one Twenty enum value, for every lead magnet this business will ever ship.**

**Status: BUILT, NOT LIVE.** Three steps below are Iván's and none of them has run. First magnet: `runner_week` (`lead-magnet-semana-de-fuerza.md`).

## Why it is generic, which is the whole point

`automation/plan-lead-workflow.json` and `automation/zone-workouts-workflow.json` are **two near-identical copies of the same six nodes**. A third magnet meant a third copy, a third Caddy route, a third Twenty `leadSource` value and a third n8n import — *and every one of those last three is manual UI work only Iván can do.*

**So the magnet moved into the payload.** `magnet` selects the PDF, the subject, the body and the note text inside one **Magnet registry** Code node. Adding a magnet after this one is **two edits and no UI work**:

1. an entry in the registry node in n8n (mirrored into `automation/tool-lead-workflow.json`),
2. an entry in `site/_data/capture.json` plus `toolCapture: <magnet>` in a page's front matter.

⚠️ ***The `leadSource` value stays `TOOL_LEAD` for every magnet, deliberately.*** A value per magnet turns one enum into a list Iván maintains by hand in the Twenty UI forever, which is the exact cost this endpoint exists to remove. **Which magnet it was lives in `leadNotes`.** *The trade is real and worth naming: per-magnet reporting in Twenty is now a text search rather than a filter. Nothing in this business currently reports on `leadSource` at magnet grain, and if that changes the answer is a proper field, not six enum values.*

**The two existing workflows are NOT migrated.** They work, they are live, and rewriting a live sender to prove a point is how a working pipeline breaks. They migrate when one of them next needs a change, or never.

## The payload

`POST /api/tool-lead`, same-origin, JSON:

```json
{
  "email": "athlete@example.com",
  "magnet": "runner_week",
  "language": "es",
  "source": "tool_page",
  "page_url": "https://triaperformance.com/core-para-corredores/",
  "submitted_at": "2026-09-09T12:00:00.000Z"
}
```

**The field is `language`, not `lang`** — same as the plan-lead and zone-workouts payloads. *Three workflows with two names for one field is how the `es` → enum mapping bug got written the first time.*

The registry node **throws** on an invalid email or an unknown magnet rather than minting a token and mailing nobody. *An unknown magnet is the likely mistake: a page shipped with a capture form before its entry was added.*

## The suppression check is not optional, and this is the first sender that has one

`unsubscribe-runbook.md`: ***every send checks `email_suppression` first, no exception for mail that feels transactional.*** **Check suppression** runs before the send:

- `alwaysOutputData: true`, because **a Postgres node that matches nothing emits no item at all** and the `If` after it would never run — the webhook would hang until timeout. *That is invisible on the happy path and it is the same trap the unsubscribe workflow's `Lookup Token` documents.*
- A suppressed address gets HTTP 200 with `{"ok":true,"suppressed":true}` and **no email**. The front end shows the ordinary thank-you: telling a stranger their address is on a suppression list is not information they asked for.

**Every send also mints its own unsubscribe token** rather than borrowing one:

```sql
INSERT INTO unsubscribe_tokens (token, email, lang, source)
VALUES (replace(gen_random_uuid()::text, '-', ''), $1, $2, $3)
RETURNING token;
```

🔑 ***`gen_random_uuid()` and not `md5(random()::text)`.*** *Both are 32 hex characters and only one is unguessable.* `schema-email-suppression.sql` rests on exactly that property — *"a link cannot be constructed for an address you do not already hold a token for, so the endpoint cannot be used to enumerate or mass-unsubscribe the list."* **A PRNG-derived token would have looked identical and quietly given that up.** `source` is `tool-lead:<magnet>`, so an unsubscribe records which magnet produced it.

**No `List-Unsubscribe` header.** `n8n-nodes-base.emailSend` (v2.1) has no header option at all — `unsubscribe-runbook.md` §Headers, corrected September 9. The footer link is in every send.

## Do this one step at a time — test after each

### Step 1 — Twenty: add the `TOOL_LEAD` leadSource value

**I can't do this or verify it — it's the Twenty UI.**

⚠️ ***Do not type the current option list into this file.*** *Three documents in this repo each state a different `leadSource` list, all hand-typed, none re-derivable, and `AI_ASSISTANT` was added in early September 2026 without any of them noticing.* **Read it instead:**

```bash
export TWENTY_API_KEY='paste-the-key-here'
bash automation/twenty-dump-enums.sh
```

1. Twenty → Settings → Data Model → Person → `leadSource` → add option `TOOL_LEAD`.
2. Confirm it saved with a real API call rather than trusting the screen:

🚨 **Use the heredoc form, not `-d '{...}'`.** *A JSON body inside single quotes on a `curl` line has three levels of quoting, and the failure mode when one of them breaks in a paste is that the shell sits at a `>` prompt waiting for a closing quote — which reads as "the request is hanging" and is not.* **`--data-binary @-` with a quoted heredoc has no nested quoting at all.**

```bash
export TWENTY_API_KEY='paste-the-key-here'

curl -sS -o /tmp/tw-create.json -w 'HTTP %{http_code}\n' \
  -X POST "http://100.70.89.17:3000/rest/people" \
  -H "Authorization: Bearer ${TWENTY_API_KEY}" \
  -H "Content-Type: application/json" \
  --data-binary @- <<'JSON'
{"name":{"firstName":"ToolLeadTest","lastName":"-"},
 "emails":{"primaryEmail":"tool-lead-test-1@example.com"},
 "leadSource":"TOOL_LEAD"}
JSON

python3 -m json.tool /tmp/tw-create.json | head -40
```

Expect `HTTP 201` and `leadSource: "TOOL_LEAD"` in the body. A `400` naming `leadSource` means the value did not take. Delete the test Person afterwards:

```bash
ID=$(python3 -c "import json;print(json.load(open('/tmp/tw-create.json'))['data']['createPerson']['id'])")
curl -sS -X DELETE "http://100.70.89.17:3000/rest/people/${ID}" -H "Authorization: Bearer ${TWENTY_API_KEY}" -w 'HTTP %{http_code}\n'
```

### Step 2 — Caddy: publish the webhook path

**Already written into `automation/Caddyfile`**, below `/api/zone-workouts`. It reaches the box on the next daily `deploy-website.sh`, which diffs the repo copy against `/etc/caddy/Caddyfile`, validates, then reloads. To apply now, run that script manually.

```
route /api/tool-lead {
    rewrite * /webhook/tool-lead
    reverse_proxy 100.70.89.17:5678 {
        header_up Host {upstream_hport}
    }
}
```

**The `rewrite` line is mandatory** — n8n serves webhooks under an internal `webhook/` prefix, and without it every request 404s at n8n's Express layer while Caddy looks correctly configured.

Test: `curl -i -X POST https://triaperformance.com/api/tool-lead -H 'Content-Type: application/json' -d '{}'` — **expect a 404 from n8n at this point. That 404 is the pass condition**: it proves the proxy hop works and only the workflow is missing.

### Step 3 — n8n: import the workflow

1. n8n → Workflows → Import from File → `automation/tool-lead-workflow.json`.
   **If it fails with "does not contain valid JSON data":** the file is valid; it is n8n's file reader. Open an empty workflow, select the whole file, copy, click the canvas, paste. *n8n parses pasted workflow JSON directly and skips the reader. This is the more reliable path and it is why no `.ascii.json` twin was created for this one.*
2. Read the sticky note.
3. Credentials — no new ones: **Twenty API** (HTTP Header Auth) on the three HTTP Request nodes, **Gmail SMTP** on Send guide email, **Telegram bot** on the three Telegram nodes, **Members Postgres** on the two Postgres nodes.
4. **Config** node: set `TELEGRAM_CHAT_ID`, same value as the other workflows.
5. Execution mode on **Magnet registry** is already explicit (**Run Once for Each Item**). *Leave nothing you add on the default: a webhook carries one item today, and a node written single-item style misbehaves silently the first time an execution carries two.*
6. Activate.

### Step 4 — verify end to end, against the real stack

```bash
curl -i -X POST https://triaperformance.com/api/tool-lead \
  -H 'Content-Type: application/json' \
  -d '{"email":"ivan+toollead@triaperformance.com","magnet":"runner_week","language":"es","source":"tool_page","page_url":"https://triaperformance.com/core-para-corredores/"}'
```

Expect `200 {"ok":true}`. Then check, in this order:

1. **The email arrived**, with the PDF link and the unsubscribe footer, and the link downloads a 6-page PDF.
2. **A token row exists:** `SELECT token, email, lang, source FROM unsubscribe_tokens WHERE source LIKE 'tool-lead:%';` — `source` should read `tool-lead:runner_week`.
3. **The unsubscribe link works** — click it, expect the Spanish confirmation page, then confirm `email_suppression` has the row.
4. 🚨 **Send the SAME request again.** With the address now suppressed, expect `{"ok":true,"suppressed":true}` and **no second email**. *This is the assertion that matters and it is the one a happy-path test skips.*
5. **Twenty has the Person** with `leadSource: TOOL_LEAD` and the magnet named in `leadNotes`.
6. Clean up: delete the suppression row, the token rows and the test Person.

### Step 5 — an unknown magnet must fail loudly

```bash
curl -i -X POST https://triaperformance.com/api/tool-lead \
  -H 'Content-Type: application/json' -d '{"email":"a@b.co","magnet":"ghost","language":"es"}'
```

🚨 ***CORRECTED September 9, 2026, against the live endpoint — it returns `HTTP 200` with an EMPTY BODY, not a 500.*** ~~Expect a 500 and a failed execution in n8n naming the magnet.~~

**The guard itself works**: the registry throws, the execution goes red in n8n, and nothing is minted or sent. **The empty body IS the signal** — a successful run always returns `{"ok":true}` — because `responseMode: "responseNode"` answers 200 whenever a workflow ends without reaching a Respond node. *So the pass condition is:* **empty body + a red execution in n8n**, *never `{"ok":true}`.*

⚠️ ***This is a sloppy contract and it is left as-is deliberately.*** *A proper fix is an error output on the registry node routed to a Respond node returning 400 — one node and two clicks in the n8n UI.* **The reason not to do it yet: nothing consumes the status line.** *`tool-capture.js` requires the body to say `{"ok":true}`, so the page already shows its error correctly, and there is no second caller.* 🔑 **Do it the day a second caller appears — and until then, any new caller must check the body, not the status.**

## Two traps this pipeline already hit, live (September 9, 2026)

**Both were found on the first real request, and both are the kind that report success.**

🚨 **1. An n8n Set node REPLACES the item.** `Config` dropped the webhook body, so `Magnet registry` threw on its own `invalid or missing email in payload` guard. *This is why `zone-workouts-workflow.json` references its webhook by node name in every downstream expression — a reason nobody had written down, so the pattern was copied and the reason was not.* **Both fixes are in:** *Include Other Input Fields* is on, **and** the registry reads `$('Webhook - Tool Lead').item.json.body` rather than `$json`. *Keep the second one even if the first looks redundant — it is the half that survives someone editing the Set node.*

🚨 **2. `responseMode: "responseNode"` answers HTTP 200 with an EMPTY BODY when the workflow dies before a Respond node.** *So a run that failed on its first line looked exactly like a successful send.* **`site/assets/js/tool-capture.js` now requires the body to say `{"ok":true}`; the status line is not the contract.** ⚠️ **Anything else that ever calls this endpoint must do the same.**

🔑 ***What actually caught it: the database check, not the HTTP check.*** *Step A returned 200; step B returned zero rows in `unsubscribe_tokens`.* **After any write path, assert the write — not what the write reported about itself.** *That single habit would have caught all five members of this family already recorded in `ai-infrastructure-documentation.md`.*

## The front end

`site/_includes/partials/tool-capture.njk` renders the section; `site/assets/js/tool-capture.js` posts it; copy lives in `site/_data/capture.json`, keyed magnet → language. A page opts in with `toolCapture: <magnet>` in front matter, and every gated page leaves it unset and renders nothing.

⚠️ **The data file is `capture.json`, not `toolCapture.json`.** *Eleventy front matter overrides global data of the same name, so a page setting `toolCapture` would shadow the whole file.*

**Placement is a decision, not a default.** The capture sits **below** the tool and the All-Access CTA stays at the foot of the page, with the capture between them — measured at **~500 px apart** rather than the **69 px** that the plan page put between Buy and its email capture, which is the measurement that opened the storefront branch. The done overlay carries a one-line **link** to the capture, never a second form: the overlay is centred over the stage and competes with "Repetir" for the same corner of a phone.

## Which tools get a capture at all

**Not every public tool.** The test, from the pace-converter decision of September 8, 2026:

> **An email box belongs on a tool only when an artifact exists that continues the job the tool started.**

The zones calculator passes. The runner core passes. **The pace converter fails and correctly has none** — it is a fifteen-second lookup with nothing to continue, and a bare email box on it converts near zero while taxing the only property that makes the page worth having.
