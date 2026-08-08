# Plan Catalog Email Capture -> Twenty + Email + Telegram — Deploy Runbook

*Updated August 6, 2026 — the form's purpose changed, and this runbook changed with it. The plan pages used to offer "we'll email you this plan," which was never something we could deliver; they now ask **"not sure this plan is for you? leave your email and we'll help you choose."** That reframing invalidated three things this document previously specified — the `excludeFromSequence` decision, the reply email, and the "colder signal" reasoning below. All three are corrected in place. A fourth item was found while correcting them: the workflow passed `preferredLanguage` as a raw two-letter code into an enum that only accepts the long form. See Step 3.*

**Status: NOT LIVE.** Front-end is built and shipped (every plan page has the capture form, `site/assets/js/plan-capture.js`, posting to `/api/plan-lead`). Nothing on the backend exists yet — this is the exact spec to wire it up, same pattern as `contact-form-pipeline-runbook.md`. Until Step 1-3 below are done, the capture form on every plan page fails silently into its "couldn't send" message. **The "Buy on TrainingPeaks" button is a plain link with no dependency on any of this — it works today, live, regardless of this runbook.**

## Why this is a separate workflow, not a branch on the contact form

The contact-form pipeline collects name + phone + sport + message — a real coaching inquiry. The plan-catalog capture collects only an email. *(Corrected Aug 6, 2026 — this sentence used to continue: "a much colder, lower-commitment signal (closer to a lead-magnet download than a contact request)". That was true when the form offered to email you a plan. It now asks whether you want help choosing one, which is a **warm inbound question** — the same intent as the contact form, arriving with less information attached. The separate-workflow decision still stands, but for the mechanical reason below, not because the lead is cold.)* Reusing the same webhook would mean branching on a `source` field inside one already-complex workflow; a second workflow mirroring the first is simpler to read, test, and roll back independently. `automation/plan-lead-workflow.json` is a ready-to-import n8n workflow built by cloning `contact-form-workflow.json` and removing the phone-number branch (no phone is collected here).

## What the front end sends

`POST /api/plan-lead`, same-origin, JSON body:

```json
{
  "email": "athlete@example.com",
  "plan_id": "443888",
  "plan_name": "Plan 13 Semanas: Triatlón Sprint Prep (Tu Primer Triatlón)",
  "language": "es",
  "source": "plan_catalog",
  "placement": "buybox",
  "page_url": "https://triaperformance.com/planes/p/plan-13-semanas-triatlon-sprint-prep-tu-primer-triatlon-443888/",
  "submitted_at": "2026-07-30T12:00:00.000Z"
}
```

No name, no phone — one field, to keep it fast next to the buy button.

`placement` is `buybox` or `helpbox`: there are **two** instances of this form on every plan page as of Aug 6, 2026 — one beside the buy button, one in the "not sure this is for you?" box at the foot, which also offers WhatsApp. Both post to this same endpoint. The field exists so the two can be told apart in `leadNotes` and in GA4; without it you cannot tell which placement people actually use, and one of them is presumably worth removing eventually.

## Do this one step at a time — test after each step before moving to the next

### Step 1 — Twenty: add the `PLAN_CATALOG` leadSource value ✅ DONE

**Confirmed present by Iván, August 6, 2026.** `leadSource` now reads `COACHMATCH`, `WEBSITE_FORM`, `REFERRAL`, `OTHER`, `PLAN_CATALOG`. The verification call below is kept as the record of how it was meant to be checked, and is still the right way to confirm the `lastName: "-"` question if a Person creation ever 400s on the name field.

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
3. ~~While you're in there: the same test call also settles the open question from the workflow's sticky note — does Twenty accept `name.firstName` as a single word with no real surname (`lastName: "-"`)?~~ — **answered, August 8, 2026: yes.** The pipeline went live and was tested end-to-end on Aug 6 using exactly that payload shape, and Persons were created successfully. The "email-only capture → derive a first name from the address" approach in `automation/plan-lead-workflow.json` is confirmed safe. *(The question was settled by the setup it was written for, on Aug 6; nobody struck the line, so it read as open for two days. Closed here Aug 8.)*
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
5. ~~**Decision needed, not assumed:** ... sets `excludeFromSequence: true`~~ — **decided and already applied, Aug 6, 2026: the node now sets `excludeFromSequence: false`.** The old reasoning ("someone giving an email to get a plan sent to them is a colder signal") described a form that no longer exists. Asking for help choosing a plan *is* a request to be contacted, so these enter the nurture on the same footing as contact-form leads. Note the mechanism sorts itself out: these leads carry no phone number, and `twenty_followup_check.py` skips no-phone leads entirely, so they receive the email sequence and are self-excluded from WhatsApp outreach without any extra guard.
6. **`preferredLanguage` was a bug and is now fixed** — the node passed `body.language` straight through (`"es"`), but Twenty's enum only accepts `SPANISH` / `ENGLISH` / `PORTUGUESE` (confirmed in the members-area build, `ai-infrastructure-documentation.md` §12). It now maps es/en/pt to the long form with a SPANISH fallback. Had this shipped as written, every Person creation would have failed on the enum or silently dropped the field.
7. "Listen for test event" on the Webhook node, submit the form for real from a live plan page, confirm: a Person appears in Twenty with `leadSource = PLAN_CATALOG`, `excludeFromSequence = false`, `preferredLanguage = SPANISH`, and `leadNotes` carrying the plan name, plan id, **placement** and page URL; the reply email arrives **in the submitter's language** and asks the three qualifying questions (goal + date, days per week, recent training) rather than claiming to attach a plan; Telegram notifies you.
7. Only then switch the workflow to **Active**.

### Step 4 — verify end to end

- Submit the capture form for real on a live plan page. Confirm in order: Person created in Twenty with the right `leadSource`/`leadNotes` -> plan email received with the correct plan name and link -> Telegram notification received.
- Submit again with the same email -> confirm the "already exists" branch fires (Telegram duplicate notice, no second Person, no second email).
- Click "Buy on TrainingPeaks" on the same page without touching the email field at all -> confirm it still redirects normally. This is the one that actually matters: capture failing or succeeding must never affect this.
- Confirm plan-catalog leads **do** enter the email nurture (`excludeFromSequence: false`) and do **not** appear in the WhatsApp watchdog's queue (`twenty_followup_check.py`) — the latter because they have no phone number, not because they're excluded by flag.
- Submit from **both** forms on the same plan page (beside the buy button, and in the help box) and confirm `leadNotes` records `buybox` and `helpbox` respectively.

### Rollback

Set the n8n workflow to Inactive, or remove the `/api/plan-lead` route from the Caddyfile and reload Caddy. The capture form on plan pages will show its "couldn't send — you can still buy" message; the buy button is unaffected either way.

## Open items carried into this runbook

- Whether plan-catalog leads should ever enter the coaching nurture sequence (Step 3.5) — deliberately left as a flag, not a default baked into a decision I can't see the downstream effect of.
- `name.firstName` derived from the email's local part is a placeholder, not a real name — fine for `leadNotes`/internal use, but if this list is ever used for anything more personal than "here's the plan you asked for," it's not a real first name.
- No unsubscribe/consent language on the capture form copy itself (`planUi.json`'s `captureBody` now says we'll help you choose, and that it isn't required to buy) — worth a look before the HubSpot re-engagement blast (`open-loops.md` NEXT #4) touches this same list, at which point real consent/compliance copy matters more than it does for a one-off "email me this plan" click.
