# Zone-Calculator Lead Magnet → Twenty + Guide Email + Telegram — Deploy Runbook

*Created August 13, 2026.* Wires the zone calculator's email capture to the guide built the same day (`lead-magnet-sesiones-por-zona.md` → `site/assets/guias/sesiones-por-zona.pdf`).

**Status: NOT LIVE.** Front end has been posting to `/api/zone-workouts` since Aug 10; nothing was listening, so the capture has been failing visibly into its error message ever since — by design, not by accident. Everything below is what makes it work. **Cloned from `plan-lead-pipeline-runbook.md` and `automation/plan-lead-workflow.json`, which are the proven pattern; read that runbook if anything here is ambiguous.**

## What the front end sends

`POST /api/zone-workouts`, same-origin, JSON:

```json
{
  "email": "athlete@example.com",
  "sport": "running",
  "protocol": "thirty_min",
  "language": "es",
  "source": "zone_calculator",
  "page_url": "https://triaperformance.com/calculadora-de-zonas/running/",
  "submitted_at": "2026-08-13T12:00:00.000Z"
}
```

`sport` is the raw internal key (`swimming` / `cycling` / `running`); the workflow translates it to Spanish for `leadNotes`. `protocol` is only set for cycling and is `null` otherwise.

*The field is `language`, not `lang` — renamed Aug 13, 2026 to match the plan-lead payload. Two names for the same field across two workflows is exactly how the `es` → enum mapping bug got written the first time.*

## Do this one step at a time — test after each before moving on

### Step 1 — Twenty: add the `ZONE_CALCULATOR` leadSource value

`leadSource` today reads `COACHMATCH`, `WEBSITE_FORM`, `REFERRAL`, `OTHER`, `PLAN_CATALOG`. This needs a sixth. **I can't do this or verify it — it's the Twenty UI.**

1. Twenty → Settings → Data Model → Person → `leadSource` → add option `ZONE_CALCULATOR`.
2. Confirm it actually saved, with a real API call rather than trusting the screen:

```bash
curl -i -X POST http://100.70.89.17:3000/rest/people \
  -H "Authorization: Bearer <TWENTY_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"name":{"firstName":"ZoneMagnetTest","lastName":"-"},"emails":{"primaryEmail":"zone-magnet-test-1@example.com"},"leadSource":"ZONE_CALCULATOR"}'
```

Expect `201` with `leadSource: "ZONE_CALCULATOR"` echoed back. A `400` naming `leadSource` means the enum value didn't take. Delete the test Person afterwards (`DELETE /rest/people/<id>`) or leave it, same as the existing test-record notes.

### Step 2 — Caddy: publish the webhook path

**Already written into `automation/Caddyfile`** (below `/api/contact-form`). It reaches the box through the daily `deploy-website.sh` job, which diffs the repo copy against `/etc/caddy/Caddyfile`, validates before touching anything, then reloads. To do it now instead of waiting for cron, run that script manually.

```
route /api/zone-workouts {
    rewrite * /webhook/zone-workouts
    reverse_proxy 100.70.89.17:5678 {
        header_up Host {upstream_hport}
    }
}
```

The `rewrite` line is mandatory — n8n serves webhooks under an internal `webhook/` prefix, and without it every request 404s at n8n's Express layer while Caddy looks correctly configured.

Test: `curl -i -X POST https://triaperformance.com/api/zone-workouts -H 'Content-Type: application/json' -d '{}'` — expect a **404 from n8n** at this point. That 404 is the pass condition: it proves the proxy hop works and only the workflow is missing.

### Step 3 — n8n: import the workflow

1. n8n → Workflows → Import from File → `automation/zone-workouts-workflow.json`.

   **If that fails with "Could not import file / The file does not contain valid JSON data":** the file is valid — verified against both Python's and Node's parsers — so the failure is in n8n's own file reader, not the content. Two fallbacks, in order:

   - **Paste it onto the canvas instead.** Open a new empty workflow, select the whole file, copy, click the canvas, `Cmd/Ctrl+V`. n8n parses pasted workflow JSON directly and this path skips the file reader entirely. It is the more reliable of the two.
   - **Try `automation/zone-workouts-workflow.ascii.json`** — byte-identical in content, but with every non-ASCII character escaped, for the case where the reader really is mangling the encoding.

   *(Both files are kept. If the plain one imports cleanly on a later n8n version, delete the `.ascii` twin rather than maintaining two copies of a workflow — that is exactly the drift this repo has a rule against.)*

2. Read the sticky note on the canvas.
3. Attach the same three credentials the contact-form and plan-lead workflows already use: **Twenty API** (HTTP Header Auth), **Gmail SMTP**, **Telegram bot**. No new credentials.
4. Set `TELEGRAM_CHAT_ID` in the **Config** node — same value as the other two workflows.
5. **Check the Code/Set node execution modes** before activating. This workflow is a clone, so it inherits whatever the original had; per the standing rule, every node that processes items must have `Run Once for All Items` vs `Run Once for Each Item` set *explicitly*. A single-item manual test cannot catch a mistake here — it needs a real multi-item execution.
6. **Test before activating — but not from the website.** *(Corrected Aug 13, 2026. The instruction inherited from `plan-lead-pipeline-runbook.md` said "Listen for test event, then submit the form for real from a live page." **That cannot work.** n8n registers the test webhook at `/webhook-test/<path>` and only registers `/webhook/<path>` when the workflow is Active — and Caddy rewrites to the production path. A real submission during "Listen for test event" 404s, which reads exactly like a broken route and sends you back to re-checking Caddy. The same wrong instruction is still sitting in the plan-lead runbook.)*

   With **Listen for test event** armed, POST straight to n8n over Tailscale, bypassing Caddy:

   ```bash
   curl -i -X POST http://100.70.89.17:5678/webhook-test/zone-workouts \
     -H 'Content-Type: application/json' \
     -d '{"email":"coach+zonetest@triaperformance.com","sport":"running","protocol":null,"language":"es","source":"zone_calculator","page_url":"https://triaperformance.com/calculadora-de-zonas/running/","submitted_at":"2026-08-13T15:00:00.000Z"}'
   ```

   That payload is the exact shape the front end sends, captured from a real browser submission. Work through the Step 4 checks on this before going further.

7. Set the workflow **Active**.
8. **Then** submit the capture form for real from `/calculadora-de-zonas/` — this is the run that proves Caddy, the front end and the production webhook together, and it is the only one that does. It appears in the **Executions** list, not on the canvas. Use a different email than the curl test, or you will be testing the duplicate branch by accident.

### Step 4 — verify end to end

Confirm, in this order:

- **The email arrives**, in the submitter's language, with a working link to `https://triaperformance.com/assets/guias/sesiones-por-zona.pdf` **and** the All-Access checkout link. *Click the PDF link from the email itself — the workflow does not check that the file exists, so a 404 there sends a broken guide with no error anywhere.*
- **Person created in Twenty** with `leadSource = ZONE_CALCULATOR`, `preferredLanguage = SPANISH`, `excludeFromSequence = true`, and `leadNotes` carrying the sport and page URL.
- **Telegram notification** arrives with the email and sport.
- **Submit again with the same address** → the duplicate branch fires: Telegram duplicate notice, no second Person, no second email.
- **These leads do NOT enter the coaching nurture.** `excludeFromSequence = true` is the whole point (see the decision below). Confirm the next nurture run skips them rather than assuming the flag works.
- **The calculator itself still works with the capture failing.** Break it on purpose if you like — the zones must still compute and display. Capture is additive; it must never be able to take the tool down.

### Rollback

Set the workflow Inactive, or remove the `/api/zone-workouts` route from `automation/Caddyfile` and let the deploy job reload. The capture form goes back to showing its error message; the calculator is unaffected either way.

## Decisions taken here (Iván, August 13, 2026)

**Delivery is a link, not an attachment.** Consistent with the three existing lead magnets, lets the guide be corrected without stale copies sitting in inboxes, and the click is a trackable signal. The trade-off, accepted knowingly: the URL is public, so the guide is reachable without giving an email — already true of the other three.

**`excludeFromSequence: true`, unlike plan-catalog leads.** Those asked for help choosing a plan, which is a request to be contacted; this one asked for a free PDF. The capture form also still carries no consent or unsubscribe copy — an open item inherited from `plan-lead-pipeline-runbook.md`. The sell still happens: the delivery email carries the All-Access CTA, and so does the guide's last page. *A content-led sequence for this list specifically is a separate decision, not a default to slide in here.*

**The capture copy was rewritten in the same pass.** It promised "las sesiones por zona para el deporte que elegiste" while the guide covers all three sports — a promise the artefact would have under-delivered against on its face and over-delivered against in practice. `zonesUi.json` now says the full guide, three sports.

## Open items

- **No consent/unsubscribe copy on the capture form**, only the "te podés dar de baja" line in the fine print with no mechanism behind it. Fine for a single transactional send; not fine the moment this list gets a sequence. Same open item as the plan-catalog capture, now on two forms.
- **`name.firstName` is derived from the email's local part** (`athlete@` → `athlete`). Placeholder, not a real name — do not use it in a greeting. The delivery email deliberately opens with "Hola," and no name.
- **The guide is Spanish-only.** The workflow maps `en`/`pt` to their enums and sends English/Portuguese email copy, but the linked PDF is Spanish. Today this cannot fire — the calculator is only public in Spanish — but it will the moment the EN/PT calculators ship, which is the definition of done for the members-i18n branch. **Translate the guide in that same pass, or the English email links a Spanish PDF.**
