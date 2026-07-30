# Plan Catalog Email Capture -> Twenty + Email + Telegram — Deploy Runbook

**Status: NOT LIVE.** Front-end is built and shipped (every plan page has the capture form, `site/assets/js/plan-capture.js`, posting to `/api/plan-lead`). Nothing on the backend exists yet — this is the exact spec to wire it up, same pattern as `contact-form-pipeline-runbook.md`. Until Step 1-3 below are done, the capture form on every plan page fails silently into its "couldn't send" message. **The "Buy on TrainingPeaks" button is a plain link with no dependency on any of this — it works today, live, regardless of this runbook.**

## Why this is a separate workflow, not a branch on the contact form

The contact-form pipeline collects name + phone + sport + message — a real coaching inquiry. The plan-catalog capture collects only an email, next to a "Buy on TrainingPeaks" button — a much colder, lower-commitment signal (closer to a lead-magnet download than a contact request). Reusing the same webhook would mean branching on a `source` field inside one already-complex workflow; a second workflow mirroring the first is simpler to read, test, and roll back independently. `automation/plan-lead-workflow.json` is a ready-to-import n8n workflow built by cloning `contact-form-workflow.json` and removing the phone-number branch (no phone is collected here).

## What the front end sends

`POST /api/plan-lead`, same-origin, JSON body:

```json
{
  "email": "athlete@example.com",
  "plan_id": "443888",
  "plan_name": "Plan 13 Semanas: Triatlón Sprint Prep (Tu Primer Triatlón)",
  "language": "es",
  "source": "plan_catalog",
  "page_url": "https://triaperformance.com/planes/p/plan-13-semanas-triatlon-sprint-prep-tu-primer-triatlon-443888/",
  "submitted_at": "2026-07-30T12:00:00.000Z"
}
```

No name, no phone — the capture form is deliberately one field (email) to keep it skippable-fast next to the buy button.

## Do this one step at a time — test after each step before moving to the next

### Step 1 — Twenty: add the `PLAN_CATALOG` leadSource value

`leadSource` is an enum (confirmed in the contact-form build; real values today: `COACHMATCH`, `WEBSITE_FORM`, `REFERRAL`, `OTHER`). Adding a value requires the Twenty UI — I can't do this or verify it without a live connection.

1. Twenty -> Settings -> Data Model -> Person -> `leadSource` field -> add option `PLAN_CATALOG`.
2. Confirm it actually took, with a real API call (don't assume the UI saved it correctly):
   ```bash
   curl -i -X POST http://100.70.89.17:3000/rest/people \
     -H "Authorization: Bearer <TWENTY_API_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"name":{"firstName":"PlanLeadTest","lastName":"-"},"emails":{"primaryEmail":"plan-lead-test-1@example.com"},"leadSource":"PLAN_CATALOG"}'
   ```
   Expect `201 Created` with `leadSource: "PLAN_CATALOG"` echoed back. A `400` naming `leadSource` as the problem means the enum value didn't save — check the Data Model screen again.
3. While you're in there: the same test call above also settles the open question from the workflow's sticky note — does Twenty accept `name.firstName` as a single word with no real surname (`lastName: "-"`)? The call above uses that exact shape. If it 201s, the "email-only capture -> derive a fake first name from the address" approach in `automation/plan-lead-workflow.json` is confirmed safe. If it 400s on the name field, tell me what the error says — the payload shape needs to change.
4. Delete the test Person afterward (`DELETE /rest/people/<id>`) or leave it, same as the existing "Curl Test" cleanup note in the contact-form runbook — not urgent either way.

### Step 2 — Caddy: expose the webhook path

Same pattern as `/api/contact-form`, new path:

```bash
sudo nano /etc/caddy/Caddyfile
```

Add inside the existing `triaperformance.com, www.triaperformance.com { ... }` block, alongside the existing `/api/contact-form` route:

```
route /api/plan-lead {
    rewrite * /webhook/plan-lead
    reverse_proxy 100.70.89.17:5678 {
        header_up Host {upstream_hport}
    }
}
```

(The `rewrite` line matters — the contact-form build found n8n serves webhooks under a `webhook/` prefix internally; without this line every request 404s at n8n's Express layer even though Caddy routes it correctly.)

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Test: `curl -I https://triaperformance.com/api/plan-lead` — expect a 404 from n8n at this point (workflow not imported yet), which confirms the proxy path itself is wired correctly.

### Step 3 — n8n: import the workflow

1. n8n -> Workflows -> Import from File -> `automation/plan-lead-workflow.json`.
2. Read the sticky note on the canvas.
3. Attach the same 3 credentials the contact-form workflow already uses: `Twenty API` (HTTP Header Auth), `Gmail SMTP`, `Telegram bot` — no new credentials needed.
4. Set `TELEGRAM_CHAT_ID` in the **Config** node (same value as the contact-form workflow).
5. **Decision needed, not assumed:** the **Build Twenty payload** node sets `excludeFromSequence: true` — plan-catalog leads do NOT enter the WhatsApp coaching nurture watchdog by default. Reasoning: someone browsing the plan catalog and giving an email to get a plan sent to them is a colder signal than a contact-form submission asking to be reached — auto-enrolling them in coaching outreach they didn't ask for risks feeling spammy. If you want these leads nurtured the same as contact-form leads, flip that field to `false` before activating.
6. "Listen for test event" on the Webhook node, submit the form for real from a live plan page, confirm: a Person appears in Twenty with `leadSource = PLAN_CATALOG`, `excludeFromSequence = true` (or `false` if you changed it), the plan-name/plan-id/page-url landed in `leadNotes`; the "here's your plan" email arrives; Telegram notifies you.
7. Only then switch the workflow to **Active**.

### Step 4 — verify end to end

- Submit the capture form for real on a live plan page. Confirm in order: Person created in Twenty with the right `leadSource`/`leadNotes` -> plan email received with the correct plan name and link -> Telegram notification received.
- Submit again with the same email -> confirm the "already exists" branch fires (Telegram duplicate notice, no second Person, no second email).
- Click "Buy on TrainingPeaks" on the same page without touching the email field at all -> confirm it still redirects normally. This is the one that actually matters: capture failing or succeeding must never affect this.
- Confirm plan-catalog leads do **not** show up in the WhatsApp watchdog's queue (`twenty_followup_check.py`) unless you deliberately set `excludeFromSequence: false` in Step 3.5.

### Rollback

Set the n8n workflow to Inactive, or remove the `/api/plan-lead` route from the Caddyfile and reload Caddy. The capture form on plan pages will show its "couldn't send — you can still buy" message; the buy button is unaffected either way.

## Open items carried into this runbook

- Whether plan-catalog leads should ever enter the coaching nurture sequence (Step 3.5) — deliberately left as a flag, not a default baked into a decision I can't see the downstream effect of.
- `name.firstName` derived from the email's local part is a placeholder, not a real name — fine for `leadNotes`/internal use, but if this list is ever used for anything more personal than "here's the plan you asked for," it's not a real first name.
- No unsubscribe/consent language on the capture form copy itself (`planUi.json`'s `captureBody` just says "optional, not required to buy") — worth a look before the HubSpot re-engagement blast (`open-loops.md` NEXT #4) touches this same list, at which point real consent/compliance copy matters more than it does for a one-off "email me this plan" click.
