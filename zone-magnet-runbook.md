# Zone-Calculator Lead Magnet → Twenty + Guide Email + Telegram — Deploy Runbook

*Created August 13, 2026.* Wires the zone calculator's email capture to the guide built the same day (`lead-magnet-sesiones-por-zona.md` → `site/assets/guias/sesiones-por-zona.pdf`).

~~**Status: NOT LIVE.**~~ **Status: LIVE in all three languages · verified: 2026-08-14** (Iván — workflow Active in n8n for ES, EN and PT).

> *Corrected August 14, 2026, one day after this file was created. The struck line read* **"Status: NOT LIVE. Front end has been posting to `/api/zone-workouts` since Aug 10; nothing was listening."** *It was true when written and false within a day — **the shortest-lived stale status claim in the repo, and the cheapest kind to produce**: a runbook written the day before the thing it describes goes live. Everything below is now a build record, not a to-do list. Live state belongs to `open-loops.md`; this header carries a `verified:` date so its age is visible.*

~~Everything below is what makes it work.~~ **Cloned from `plan-lead-pipeline-runbook.md` and `automation/plan-lead-workflow.json`, which are the proven pattern; read that runbook if anything here is ambiguous.**

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

## The email sends before the duplicate check — corrected August 13, 2026

**Found by Iván within minutes of the pipeline going green:** "when the lead already exists in Twenty it doesn't send the email?" It didn't. `Already exists? → true` went straight to the Telegram notice and the success response, with the email node sitting only on the create-Person branch.

**Why that was inherited, and why it was wrong here.** In `plan-lead-workflow.json` the email is a personal *"tell me your goal and I'll pick a plan"* reply; sending it twice to the same person reads badly, so gating it behind the duplicate check is correct there. In this workflow **the email is the deliverable**. Suppressing it for known contacts means every 1:1 athlete, every All-Access subscriber, every prior contact-form or CoachMatch lead — and eventually the 2,073 migrated HubSpot contacts — asks for the guide, is told *"revisa tu bandeja de entrada"*, and receives nothing. **The most engaged part of the list was the part being silently dropped.**

***The general lesson, which is why this is written up rather than just fixed:*** deduplicating a CRM record and withholding a deliverable are two different decisions. The clone inherited one node placement that quietly bundled them. Any future workflow cloned from a pattern needs its terminal actions re-read against the new purpose, not just its wiring checked for correctness — this wiring was correct, it was correct *for a different job*.

**The fix, on the main line rather than a second email node:**

```
before   Config -> Check Twenty -> [dup?] -> ... -> Person Created -> Send reply email -> Set leadStatus
after    Config -> Send reply email -> Check Twenty -> [dup?] -> ... -> Person Created -> Set leadStatus
```

One email node, not two — a duplicate node would mean two copies of the guide copy drifting apart the first time it is edited. **Deliberate side effect: delivery no longer depends on Twenty.** If Twenty is down or rejects the write, the athlete still gets the guide and the only thing lost is the CRM record, which is the right way round for a lead magnet.

## Duplicate branch — annotate the existing Person (spec, August 13, 2026)

Once the email sends to everyone, a returning contact leaves no trace at all: no new Person, and nothing on the existing one. That loses a real signal — *an athlete already in the CRM chose to download the guide.* One node fixes it.

**Add an HTTP Request node, `Append guide download to leadNotes`**, between `Already exists?` (true) and `Telegram notify (duplicate)`:

| Field | Value |
|---|---|
| Method | `PATCH` |
| URL | `={{ $('Config').item.json.TWENTY_BASE_URL }}/rest/people/{{ $('Check Twenty for existing Person').item.json.data.people[0].id }}` |
| Send Body | on, JSON |
| Credential | Twenty API (the same one the other three Twenty nodes use) |
| On Error | **Continue** |

Body:

```
={{ JSON.stringify({ leadNotes: (($('Check Twenty for existing Person').item.json.data.people[0].leadNotes || '') + '\n[' + new Date().toISOString().slice(0,10) + '] Descargo la guia de sesiones por zona. Deporte: ' + (({swimming:'natacion',cycling:'ciclismo',running:'running'})[$('Webhook - Zone Workouts').item.json.body.sport] || 'n/a')).trim() }) }}
```

**Four constraints, each of which is the whole point of specifying this rather than improvising it:**

1. **Append, never overwrite.** `leadNotes` on an existing Person may hold real coaching history. The expression reads the current value and concatenates; a plain `leadNotes: '...'` would delete it.
2. **Do not touch `leadSource`.** A returning downloader may be a 1:1 athlete acquired through CoachMatch or a referral. Stamping `ZONE_CALCULATOR` over that destroys the attribution permanently, for a signal that belongs in a note.
3. **Do not touch `leadStatus`.** It would reset a lead that is mid-pipeline back to a state a human didn't put it in.
4. **Do not touch `lastTouchpoint`.** `twenty_followup_check.py` reads that field to decide when a lead is overdue a nudge. Writing it here tells the watchdog a human made contact when nobody did — the lead goes quiet and no follow-up ever fires. *This is the one that would have been invisible: everything would look correct in Twenty and a different system would silently stop working.*

**On Error → Continue** matters too: by this point the athlete already has the guide, and a CRM annotation failing must not turn the request into a 500 and show them an error for something that worked.

**Test:** submit twice with an address already in Twenty. Expect the guide email both times, the note appended once per submission, one Telegram duplicate notice, no second Person, and `leadSource`/`leadStatus` unchanged from whatever they were.

## Decisions taken here (Iván, August 13, 2026)

**Delivery is a link, not an attachment.** Consistent with the three existing lead magnets, lets the guide be corrected without stale copies sitting in inboxes, and the click is a trackable signal. The trade-off, accepted knowingly: the URL is public, so the guide is reachable without giving an email — already true of the other three.

**`excludeFromSequence: true`, unlike plan-catalog leads.** Those asked for help choosing a plan, which is a request to be contacted; this one asked for a free PDF. The capture form also still carries no consent or unsubscribe copy — an open item inherited from `plan-lead-pipeline-runbook.md`. The sell still happens: the delivery email carries the All-Access CTA, and so does the guide's last page. *A content-led sequence for this list specifically is a separate decision, not a default to slide in here.*

**The capture copy was rewritten in the same pass.** It promised "las sesiones por zona para el deporte que elegiste" while the guide covers all three sports — a promise the artefact would have under-delivered against on its face and over-delivered against in practice. `zonesUi.json` now says the full guide, three sports.

## Open items

- **No consent/unsubscribe copy on the capture form**, only the "te puedes dar de baja" line in the fine print with no mechanism behind it. Fine for a single transactional send; not fine the moment this list gets a sequence. Same open item as the plan-catalog capture, now on two forms.
- **`name.firstName` is derived from the email's local part** (`athlete@` → `athlete`). Placeholder, not a real name — do not use it in a greeting. The delivery email deliberately opens with "Hola," and no name.
- ~~**The guide is Spanish-only.**~~ **Closed August 13, 2026.** Three PDFs exist and the `Send reply email` node selects by `body.language` with a Spanish fallback. The EN/PT calculators shipped the same day, so the gap never opened. *If you re-import the workflow from the repo, this is one of the changes you would lose by importing an older copy — the file in `automation/` is current.*
