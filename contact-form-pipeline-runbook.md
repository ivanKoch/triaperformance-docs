# Website Contact Form -> Twenty + Email + Telegram — Deploy Runbook

**Status: LIVE as of July 22, 2026.** Built, deployed, debugged, and confirmed working end-to-end with a real production submission through `triaperformance.com`. Everything below is now the accurate record of what's actually running, not a plan.

Built to reuse the exact CoachMatch pipeline pattern (see `ai-infrastructure-documentation.md` §8): dedupe check against Twenty by email -> create Person -> immediate confirmation email -> Telegram notification -> same `leadStatus = MESSAGE_SENT` handoff into the existing daily nurture workflow (emails 2/3) and the existing Hermes WhatsApp watchdog. A form lead now flows through the identical downstream machinery a CoachMatch lead does — no new nurture logic needed.

Source differs from CoachMatch on purpose: `leadSource = "WEBSITE_FORM"`, so the two lead sources stay distinguishable in reporting (this was flagged as a gap in the growth roadmap's HubSpot audit, originally planned as `campaign_attribution` — Twenty's actual schema calls it `leadSource` instead, and it turned out to be an enum, confirmed value `WEBSITE_FORM`).

Deliverables already committed to the repo:
- `website/index.html` — the form itself (name, email, WhatsApp phone, sport, goal/message), posts to same-origin `/api/contact-form`.
- `automation/contact-form-workflow.json` — importable n8n workflow.

**Why same-origin `/api/contact-form` and not n8n's Tailscale address directly**: n8n is bound to the Tailscale interface only (`100.70.89.17`), same as Twenty and the Hermes dashboard — not reachable from a visitor's browser on the public internet. The website's own domain is public. So Caddy (already running on the VPS, already terminating TLS for `triaperformance.com`) needs one new route that proxies just this one path through to n8n internally. This keeps n8n's admin UI exactly as locked-down as it is today — only the single webhook path becomes reachable, not the rest of n8n.

## Do this one step at a time — test after each step before moving to the next

### Step 1 — Caddy: expose only the webhook path

SSH into the VPS, edit the existing Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

Add a route inside the existing `triaperformance.com, www.triaperformance.com { ... }` block, above `file_server`:

```
triaperformance.com, www.triaperformance.com {
    route /api/contact-form {
        reverse_proxy 100.70.89.17:5678 {
            header_up Host {upstream_hport}
        }
    }
    root * /var/www/triaperformance
    file_server
    encode gzip
}
```

Replace `5678` with n8n's actual internal port if different (default n8n port is 5678 — confirm against how it was deployed on this VPS). Then:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Test: `curl -I https://triaperformance.com/api/contact-form` should reach n8n (likely a 404 until the workflow below is imported and active — that's expected at this stage, it confirms the proxy path works).

### Step 2 — n8n: import the workflow

1. Open n8n (Tailscale address) -> Workflows -> Import from File -> `automation/contact-form-workflow.json`.
2. Read the yellow sticky note on the canvas — it lists exactly what to configure.
3. Create/attach credentials:
   - **Twenty API** (HTTP Header Auth) — header `Authorization`, value `Bearer <your Twenty API key>`.
   - **Gmail SMTP** — reuse the same credential the CoachMatch workflow already uses for `coach@triaperformance.com`.
   - **Telegram bot** — reuse the existing bot credential.
4. In the **Config** node, set `TELEGRAM_CHAT_ID` to your Telegram numeric user ID (same one Hermes/CoachMatch already notify).
5. In the **Build Twenty payload** node, fix every field prefixed `CONFIRM_` — those are my best guess at your custom field API slugs (`sportPrimary`, `leadNotes`, `campaignAttribution`, `leadStatus`, `emailTouchCount`, `lastTouchpoint`), but Twenty's GraphQL introspection is disabled on this instance so I couldn't verify them against your live schema the way the original CoachMatch build did. Check **Twenty -> Settings -> Data Model** for the real slugs (same place you confirmed the 8 `leadStatus` enum values for the original build) and rename the fields to match. Do the same fix in the **"Set leadStatus = MESSAGE_SENT"** node.
6. Use n8n's "Listen for test event" on the Webhook node, submit the live form once from `triaperformance.com`, and confirm: a Person appears in Twenty, the confirmation email arrives, and your Telegram gets the notification.
7. Only then switch the workflow to **Active**.

### Step 3 — verify end to end

- Submit the form for real. Confirm in order: Person created in Twenty with `leadStatus = MESSAGE_SENT` and `campaignAttribution = "Website Contact Form"` -> confirmation email received -> Telegram notification received.
- Submit again with the same email — confirm it hits the "already exists" branch (Telegram duplicate notice, no second Person created, no second email).
- Wait for the next daily nurture run — confirm this lead now also receives email 2 at +24h like a CoachMatch lead would (it's queried by the same `leadStatus = MESSAGE_SENT` condition, so no separate wiring needed).
- Confirm the Hermes WhatsApp watchdog (`twenty_followup_check.py`) picks this lead up the same way once it's 2+ days stale.

### Rollback

Set the n8n workflow to Inactive, or remove the `/api/contact-form` route from the Caddyfile and reload Caddy — the form on the site will show its generic error message ("Escribinos por WhatsApp mientras lo resolvemos") and visitors still have the WhatsApp fallback link.

## Confirmed live schema and gotchas (from real debugging, July 22, 2026)

- **Ports, confirmed via `docker ps` on the VPS:** n8n at `100.70.89.17:5678`, Twenty at `100.70.89.17:3000`. No longer a guess.
- **Twenty's REST endpoint shape, confirmed working:** `POST/GET/PATCH /rest/people`, filter syntax `emails.primaryEmail[eq]:value` — matches what was guessed from public docs.
- **Real Person schema fields, confirmed by inspecting a live Create Person API response** (which echoes every field on the object): `sport`, `leadNotes`, `leadSource`, `leadStatus`, `athleteLevel`, `customerType`, `preferredLanguage`, `excludeFromSequence`, `coach`, `lastTouchpoint`, `emailTouchCount`, `whatsappTouchCount`, `signUpDate`, `purchaseDate`, `churnDate`, `companyId`, `planPurchasedId`, `planPurchased` — a single flat `sport` field, not the `sportPrimary`/`sport__all_` split originally planned during the HubSpot migration audit.
- **`sport` is an enum**, confirmed valid values from a validation error message: `RUNNING`, `CYCLING`, `SWIMMING`, `TRIATHLON`, `DUATHLON` (all caps — mixed case like `Cycling` is rejected). The form's Spanish dropdown (`Running`/`Ciclismo`/`Duatlón`/`Triatlón`) is mapped to these in the **Build Twenty payload** node; confirmation email and Telegram still show the Spanish word for readability. `SWIMMING` has no dropdown option — harmless, just not reachable from the site.
- **`leadSource` is also an enum, not free text** (the original plan called this `campaign_attribution`; Twenty's schema has no such field). Confirmed working value: `WEBSITE_FORM`.
- **`leadStatus`, `emailTouchCount`, `lastTouchpoint`** — all confirmed correct exactly as originally named, no change needed.
- **n8n credential gotcha:** n8n's generic "HTTP Header Auth" credential type does not add the `Bearer ` prefix automatically — the Header Value field must contain the literal text `Bearer <key>` (word, space, key), typed in full. Easy to miss since n8n masks the saved value afterward with no way to visually re-confirm it; if in doubt, retype it from scratch rather than trust the masked field.
- **Verifying a Twenty API key independently of n8n:** `curl -i -X POST http://100.70.89.17:3000/rest/people -H "Authorization: Bearer <key>" -H "Content-Type: application/json" -d '{"name":{"firstName":"Test"},"emails":{"primaryEmail":"<unique>@example.com"}}'` — expect `201 Created`. A `401` means the key/header is wrong; a `400 "duplicate entry"` actually means auth succeeded (Twenty got far enough to check for an existing email) — don't mistake that for an auth failure.
- **Caddy needed a path rewrite, not just a proxy.** n8n always serves webhooks under a `webhook/` prefix internally — the route block needs `rewrite * /webhook/contact-form` before the `reverse_proxy` line, or every request 404s at the Express layer with "Cannot POST /api/contact-form" even though Caddy is routing correctly.

## Still open

- Phone numbers are sent as typed (no country-code normalization) — the WhatsApp deep link in the Telegram message just strips non-digits, so ask leads to include their country code in the field (placeholder text already hints `+54 9 11...`).
- Test Persons created during debugging (Curl Test, Curl2, Formulario Prueba, etc.) are real records in Twenty — clean up if desired, not urgent.
