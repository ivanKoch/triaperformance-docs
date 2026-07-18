# Website Contact Form -> Twenty + Email + Telegram — Deploy Runbook

Built to reuse the exact CoachMatch pipeline pattern (see `ai-infrastructure-documentation.md` §8): dedupe check against Twenty by email -> create Person -> immediate confirmation email -> Telegram notification -> same `leadStatus = MESSAGE_SENT` handoff into the existing daily nurture workflow (emails 2/3) and the existing Hermes WhatsApp watchdog. A form lead now flows through the identical downstream machinery a CoachMatch lead does — no new nurture logic needed.

Source differs from CoachMatch on purpose: `campaign_attribution = "Website Contact Form"`, so the two lead sources stay distinguishable in reporting (this was flagged as a gap in the growth roadmap's HubSpot audit).

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

## Known gaps / things to double check

- Guessed n8n's default port (`5678`) for the Caddy proxy target — confirm against the actual docker-compose/port mapping used when n8n was deployed.
- Guessed Twenty's REST endpoint shape (`POST/GET/PATCH /rest/people`, filter syntax `emails.primaryEmail[eq]:value`) from Twenty's public API docs — not verified against this specific instance. First test in Step 2.6 will catch any mismatch quickly (n8n shows the raw HTTP error).
- Phone numbers are sent as typed (no country-code normalization) — the WhatsApp deep link in the Telegram message just strips non-digits, so ask leads to include their country code in the field (placeholder text already hints `+54 9 11...`).
