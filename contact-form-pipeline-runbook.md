# Website Contact Form -> Twenty + Email + Telegram — Deploy Runbook

**Status: LIVE as of July 22, 2026 **· verified: 2026-08-14**.** Built, deployed, debugged, and confirmed working end-to-end with a real production submission through `triaperformance.com`. Everything below is now the accurate record of what's actually running, not a plan.

Built to reuse the exact CoachMatch pipeline pattern (see `ai-infrastructure-documentation.md` §8): dedupe check against Twenty by email -> create Person -> immediate confirmation email -> Telegram notification -> same `leadStatus = MESSAGE_SENT` handoff into the existing daily nurture workflow (emails 2/3) and the existing Hermes WhatsApp watchdog. A form lead now flows through the identical downstream machinery a CoachMatch lead does — no new nurture logic needed.

Source differs from CoachMatch on purpose: `leadSource = "WEBSITE_FORM"`, so the two lead sources stay distinguishable in reporting (this was flagged as a gap in the growth roadmap's HubSpot audit, originally planned as `campaign_attribution` — Twenty's actual schema calls it `leadSource` instead, and it turned out to be an enum, confirmed value `WEBSITE_FORM`).

Deliverables already committed to the repo:
- The form itself (name, email, WhatsApp phone, sport, goal/message), posting to same-origin `/api/contact-form`. It lives in the Eleventy source under `site/`. *(Updated Aug 2, 2026 — this line used to point at `website/index.html`, which is where the form lived before the July 26–29 Eleventy cutover. `website/` now holds only the permanent `hubfs` route.)*
- `automation/contact-form-workflow.json` — importable n8n workflow.

**Why same-origin `/api/contact-form` and not n8n's Tailscale address directly**: n8n is bound to the Tailscale interface only (`100.70.89.17`), same as Twenty and the Hermes dashboard — not reachable from a visitor's browser on the public internet. The website's own domain is public. So Caddy (already running on the VPS, already terminating TLS for `triaperformance.com`) needs one new route that proxies just this one path through to n8n internally. This keeps n8n's admin UI exactly as locked-down as it is today — only the single webhook path becomes reachable, not the rest of n8n.

## Do this one step at a time — test after each step before moving to the next

### Step 1 — Caddy: expose only the webhook path

> 🚨 ***This step is a build record, not an instruction. Corrected September 5, 2026 (Iván) — do not follow it as written.***
> *It was accurate when this runbook was created and became actively harmful on **July 31, 2026**, when* `automation/Caddyfile` *became the source of truth and* `deploy-website.sh` *started syncing it to the box (`ai-infrastructure-documentation.md` §18). **Anyone hand-editing `/etc/caddy/Caddyfile` today loses their change at the next daily deploy, silently** — the script diffs the repo copy against the live one and overwrites.*
>
> **The division of labour, stated once so it stops being re-derived:** *Claude edits* `automation/Caddyfile` *in the repo. **Iván commits and pushes.** The existing cron `deploy-website.sh` validates the repo copy, copies it to* `/etc/caddy/Caddyfile` *and reloads Caddy. **Nobody SSHes in to edit Caddy, and Claude never runs git.***
>
> ✅ ***The route this step describes has been live since July 2026 and is already in the repo copy*** *(`automation/Caddyfile`, alongside `/api/plan-lead`, `/api/zone-workouts` and `/api/athlete-intake`):*
>
> ```
> route /api/contact-form {
> 	rewrite * /webhook/contact-form
> 	reverse_proxy 100.70.89.17:5678
> }
> ```
>
> *Note the `rewrite` line — the struck version below is missing it, and that omission is the bug §"What broke" records. It is kept for that reason.*

~~SSH into the VPS, edit the existing Caddyfile:~~

~~```bash
sudo nano /etc/caddy/Caddyfile
```~~

~~Add a route inside the existing `triaperformance.com, www.triaperformance.com { ... }` block, above `file_server`:~~

~~```
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
```~~

~~Replace `5678` with n8n's actual internal port if different. Then `sudo caddy validate` and `sudo systemctl reload caddy`.~~

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
- Wait for the next daily nurture run — confirm this lead now also receives email 2 ~~at +24h~~ ***on the next calendar day (Sept 2, 2026: the sequence is three consecutive calendar days from `createdAt`, not +24h/+48h — `ai-infrastructure-documentation.md` §8)*** like a CoachMatch lead would (it's queried by the same `leadStatus = MESSAGE_SENT` condition, so no separate wiring needed).
- Confirm the Hermes WhatsApp watchdog (`twenty_followup_check.py`) picks this lead up the same way ~~once it's 2+ days stale~~ ***on the next calendar day after creation (Sept 2, 2026 — it now counts from `createdAt`, so the nurture email going out that morning no longer excludes the lead from the watchdog's query, which it used to)***.

### Rollback

Set the n8n workflow to Inactive, or remove the `/api/contact-form` route from the Caddyfile and reload Caddy — the form on the site will show its generic error message ("Escríbenos por WhatsApp mientras lo resolvemos") and visitors still have the WhatsApp fallback link.

## Confirmed live schema and gotchas (from real debugging, July 22, 2026)

- **Ports, confirmed via `docker ps` on the VPS:** n8n at `100.70.89.17:5678`, Twenty at `100.70.89.17:3000`. No longer a guess.
- **Twenty's REST endpoint shape, confirmed working:** `POST/GET/PATCH /rest/people`, filter syntax `emails.primaryEmail[eq]:value` — matches what was guessed from public docs.
- **Real Person schema fields, confirmed by inspecting a live Create Person API response** (which echoes every field on the object): `sport`, `leadNotes`, `leadSource`, `leadStatus`, `athleteLevel`, `customerType`, `preferredLanguage`, `excludeFromSequence`, `coach`, `lastTouchpoint`, `emailTouchCount`, `whatsappTouchCount`, `signUpDate`, `purchaseDate`, `churnDate`, `companyId`, `planPurchasedId`, `planPurchased` — a single flat `sport` field, not the `sportPrimary`/`sport__all_` split originally planned during the HubSpot migration audit.

*Update, August 31, 2026 — **ten fields added to Person for the monthly close**, created by Iván and confirmed by GraphQL introspection (not the Data Model screen):* `tpId` *(String — the TrainingPeaks athlete id, now the athlete key across every system),* `planCustom` *(enum GOLD/SILVER/BRONZE/PRIVATE/ALL_ACCESS),* `listPrice`*,* `monthlyRate`*,* `billingChannel` *(enum COACHMATCH/PRIVATE/ALL_ACCESS),* **`commissionPercentage`** *(Float — note the full word),* `tpPremiumPaid` *(Boolean),* `startupFee`*,* `churnReason` *(enum: ACHIEVED_GOAL, SEASON_BREAK, INJURY_HEALTH, LIFE_CIRCUMSTANCES, PRICE, DISSATISFIED, SWITCHED_COACH, PAYMENT_FAILED, NO_RESPONSE, UNKNOWN),* `churnReasonDetails` *(String).*

🚨 **The API name is `planCustom`, and the label reads "Plan".** *Twenty would not take `plan` and derived `planCustom` instead — **the same derivation trap already logged for `coachingStartDate` and for Spanish labels yielding `referidoPor`, hit for the third time.*** *Anything written against `plan` matches nothing and fails silently.* **Introspection is the only trustworthy source for these names; the Data Model screen shows the label.**

**Design decisions behind the money fields, so they are not re-litigated:**
- ***Store the endpoints, derive the discount.*** `listPrice` **and** `monthlyRate` are both stored; discount in dollars is `listPrice − monthlyRate` and reconciles to the cent, while a stored discount *percentage* does not (33.3% of $149 is $99.38, and the athlete pays $99).
- ***`listPrice` is stored, never derived from `planCustom`.*** If TrainingPeaks moves Bronze off $149, a derived price silently re-prices every historical athlete.
- ***`leadSource` ≠ `billingChannel`.*** The first is how the athlete arrived and is immutable; the second is how they pay now and is mutable. **Migrating a CoachMatch athlete to Private is stated strategy**, so a commission derived from `leadSource` would bill them 20% forever — hence `commissionPercentage` is stored literally.
- ***Paused vs churned needs no new field:*** `churnDate` + `churnReason IN (ACHIEVED_GOAL, SEASON_BREAK)` **is** a pause. Derived, not stored.
- ⚠️ ***`leadStatus.LOST_*` and `churnReason` describe different populations*** — leads who never converted vs customers who left. Conflating them double-counts price as a problem.

⚠️ **`planPurchased` (String) is DEPRECATED as of August 31, 2026 — hide it, and never read it for money.** *It was carrying hand-typed blobs like `"Bronze - 0% discount - 149"`, which is now a third copy of `planCustom` + `listPrice` + `monthlyRate` in prose form — the one-home-per-figure violation, inside a single object.* **Also corrected here: `planPurchasedId` and `planPurchased` are BOTH `String`, so this was never a relation** *— a real one looks like* `referredById: ID` *+* `referredBy: Person`. *An earlier reading of this doc's field list inferred a product object behind them; there is none.*

*Also settled the same day: **`agreementDate` does not need to be built.** `signUpDate` on Person is written from the hire/payment email date, so it already **is** the day the athlete said yes. The trap `monthly-close-runbook.md` §4 warns about belongs to a different field with a near-identical name — `signup_date` in `data/athlete_tenure.csv`, which came from TrainingPeaks and **is** athlete-chosen. Two fields, two systems, opposite meanings.*
- **`sport` is an enum**, confirmed valid values from a validation error message: `RUNNING`, `CYCLING`, `SWIMMING`, `TRIATHLON`, `DUATHLON` (all caps — mixed case like `Cycling` is rejected). The form's Spanish dropdown (`Running`/`Ciclismo`/`Duatlón`/`Triatlón`) is mapped to these in the **Build Twenty payload** node; confirmation email and Telegram still show the Spanish word for readability. `SWIMMING` has no dropdown option — harmless, just not reachable from the site.
- **`leadSource` is also an enum, not free text** (the original plan called this `campaign_attribution`; Twenty's schema has no such field). Confirmed working value: `WEBSITE_FORM`.
- **`leadStatus`, `emailTouchCount`, `lastTouchpoint`** — all confirmed correct exactly as originally named, no change needed.
- **n8n credential gotcha:** n8n's generic "HTTP Header Auth" credential type does not add the `Bearer ` prefix automatically — the Header Value field must contain the literal text `Bearer <key>` (word, space, key), typed in full. Easy to miss since n8n masks the saved value afterward with no way to visually re-confirm it; if in doubt, retype it from scratch rather than trust the masked field.
- **Verifying a Twenty API key independently of n8n:** `curl -i -X POST http://100.70.89.17:3000/rest/people -H "Authorization: Bearer <key>" -H "Content-Type: application/json" -d '{"name":{"firstName":"Test"},"emails":{"primaryEmail":"<unique>@example.com"}}'` — expect `201 Created`. A `401` means the key/header is wrong; a `400 "duplicate entry"` actually means auth succeeded (Twenty got far enough to check for an existing email) — don't mistake that for an auth failure.
- **Caddy needed a path rewrite, not just a proxy.** n8n always serves webhooks under a `webhook/` prefix internally — the route block needs `rewrite * /webhook/contact-form` before the `reverse_proxy` line, or every request 404s at the Express layer with "Cannot POST /api/contact-form" even though Caddy is routing correctly.

## Still open

- ~~Phone numbers are sent as typed (no country-code normalization).~~ — **closed August 8, 2026, confirmed working in production by Iván.** The WhatsApp deep link in the Telegram message strips non-digits and the placeholder hint (`+54 9 11...`) is enough: leads arrive with usable numbers. No normalization layer needed — leave it alone.
- Test Persons created during debugging (Curl Test, Curl2, Formulario Prueba, etc.) are real records in Twenty — clean up if desired, not urgent.

---

## Language branch on the confirmation email — SPEC, not yet built (September 5, 2026)

**The bug, stated plainly: an English or Portuguese prospect fills in an English or Portuguese form and receives a Spanish email with a Spanish PDF.** Found while shipping the zones guide in three languages (`lead-magnet-zonas-de-entrenamiento.md`).

**The front end has been sending the language all along.** `site/_includes/partials/contact-form.njk` posts `language: "es" | "en" | "pt"` in its payload. This workflow reads only `email, message, name, phone, sport` — the field arrives and is discarded. **So this is not a front-end change and not a new capability; it is three fields in n8n.**

*The proven pattern is `zone-magnet-runbook.md`, live in three languages since August 14, 2026 and keyed on this same `language` field. Clone it rather than inventing a second mechanism.*

### Step 0 — export the LIVE workflow and diff it ✅ DONE September 5, 2026

*Standing rule, `coachmatch-portuguese-sequence.md`: the repo copies of n8n workflows are documentation, not the live source — a translation made from one is a translation of the past. It cost a full rebuild of the Portuguese CoachMatch email the same week.*

**Result: the repo copy is accurate.** 18 nodes both sides, identical connection graph, and `Send confirmation email`'s `subject` and `text` are byte-identical. The only substantive divergence is the `Config` node — the repo carries `TELEGRAM_CHAT_ID: "REPLACE_WITH_IVAN_CHAT_ID"` where live has the real id. **That placeholder is deliberate: keep it when mirroring, never write the real id back into the repo.** Everything else that differs is n8n's own `options: {}` / `version` scaffolding.

### Step 0b — what the export actually caught 🚨

**`body.sport` is a Spanish string in every language.** `site/_data/forms.json` carries a `_note` saying so explicitly: the four `value`s (`Running`, `Ciclismo`, `Duatlón`, `Triatlón`) are identical across ES/EN/PT so that `Build Twenty payload` can map them to Twenty's `sport` enum — **only the visible `label` is translated.** The live email interpolates `body.sport` raw.

**So translating the sentence alone would have produced:** *"We received your enquiry about **Ciclismo**"* for an English lead, and *"Recebemos a sua consulta sobre **Duatlón**"* for a Portuguese one. *A half-translated email is a worse look than an honestly Spanish one.*

**The fix does not go in n8n.** `forms.json` is the only home for those labels, and a lookup table inside a Code node would be a second copy that drifts the first time a sport is added. Instead the form now sends the label it already rendered:

```js
// site/_includes/partials/contact-form.njk — added September 5, 2026
sport_label: (function () {
  var o = form.sport.options[form.sport.selectedIndex];
  return o && o.value ? o.text : form.sport.value;
})(),
```

*Claude edited the partial; it reaches the site on Iván's commit + push and the existing deploy cron.* **The Code node falls back to `body.sport` when `sport_label` is absent, so it behaves correctly before that deploy as well as after.**

### Step 1 — paste the Code node

`automation/build-confirmation-copy.node.json` is a **paste-ready single node**. Copy the file's contents to the clipboard and press ⌘V / Ctrl+V on the n8n canvas — n8n drops the node in. *Pasting beats hand-typing here: the node carries its own `mode` setting, and that setting is the thing most likely to be forgotten.*

⚠️ **The node is set to `Run Once for Each Item` and must stay that way.** *Confirmed live July 31, 2026: a poll delivering two leads caused follow-up nodes to update only the first, with no error thrown. This node branches on exactly the field that distinguishes two leads, so it is the worst possible place to leave the default.*

Then wire it: **`Person Created` → `Build confirmation copy` → `Send confirmation email`** (drop it into the existing link between those two).

The code it carries, for reference — the file is the source, this is the copy:

```javascript
// Builds the confirmation email in the visitor's own language.
//
// `language` has been in the form payload since the Eleventy cutover; this
// workflow simply never read it. `sport_label` was added to the payload on
// September 5, 2026 -- `body.sport` is ALWAYS a Spanish string in every
// language (see the _note in site/_data/forms.json: those four values map to
// Twenty's `sport` enum and must not change), so the raw value would print
// "Ciclismo" inside an English email. forms.json owns the translated labels;
// this node must never hold a second copy of them.
//
// Falls back to `body.sport` when `sport_label` is absent, so this works
// before the site deploy as well as after it.
//
// Execution mode is deliberately Run Once for Each Item. A poll delivering two
// leads at once is exactly the case this branch has to get right, and the
// July 31, 2026 incident showed the default silently updates only the first.

const b = $('Webhook - Contact Form').item.json.body;
const lang = ['es', 'en', 'pt'].includes(b.language) ? b.language : 'es';
const first = String(b.name || '').trim().split(' ')[0];
const sport = b.sport_label || b.sport || '';

const GUIDE = {
  es: 'https://triaperformance.com/assets/guias/zonas-de-entrenamiento.pdf',
  en: 'https://triaperformance.com/assets/guias/training-zones.pdf',
  pt: 'https://triaperformance.com/assets/guias/zonas-de-treino.pdf',
};

const COPY = {
  es: {
    subject: 'Recibimos tu mensaje - Triaperformance',
    body:
      `Hola ${first},\n\n` +
      `Gracias por escribirnos. Recibimos tu consulta sobre ${sport} y te vamos a contactar por WhatsApp en menos de 24 horas.\n\n` +
      `Mientras tanto, esta es nuestra guía gratuita de zonas de entrenamiento:\n${GUIDE.es}\n\n` +
      `Iván Koch - Triaperformance`,
  },
  en: {
    subject: 'We got your message - Triaperformance',
    body:
      `Hi ${first},\n\n` +
      `Thanks for writing. We received your enquiry about ${sport} and we'll get in touch on WhatsApp within 24 hours.\n\n` +
      `In the meantime, here is our free training zones guide:\n${GUIDE.en}\n\n` +
      `Iván Koch - Triaperformance`,
  },
  pt: {
    subject: 'Recebemos a sua mensagem - Triaperformance',
    body:
      `Olá ${first},\n\n` +
      `Obrigado por escrever. Recebemos a sua consulta sobre ${sport} e vamos entrar em contato pelo WhatsApp em menos de 24 horas.\n\n` +
      `Enquanto isso, este é o nosso guia gratuito de zonas de treino:\n${GUIDE.pt}\n\n` +
      `Iván Koch - Triaperformance`,
  },
};

const c = COPY[lang];
return { json: { subject: c.subject, body: c.body, emailLang: lang } };
```

### Step 2 — two fields on `Send confirmation email`

Leave `fromEmail` and `toEmail` alone. Change:

| field | new value |
|---|---|
| `subject` | `={{ $json.subject }}` |
| `text` | `={{ $json.body }}` |

**Two deliberate changes to the Spanish copy, flag them if you disagree:** the live body reads *"mira esta guia gratuita"* and signs *"Ivan Koch"* — **both accents were missing**, while `fromEmail` has always carried *"Coach Iván"*, which proves the encoding was never the problem. They are restored. And all three URLs now point at `/assets/guias/…` rather than `/guias/…`: the ES short path is only a Caddy redirect, and **the EN and PT files have no such redirect**, so the canonical path is the one that works for all three.

### Step 3 — test all three, with real submissions

**The form is not on a dedicated contact page.** It is embedded on the homepages and the about pages:

| lang | pages carrying the form |
|---|---|
| ES | `triaperformance.com/` · `/sobre-ivan/` |
| EN | `triaperformance.com/en/` · `/en/about/` |
| PT | `triaperformance.com/pt/` · `/pt/sobre-ivan/` |

Submit once from each language's homepage, **picking a sport whose label differs from its value** — Cycling on EN, Corrida or Duatlo on PT. That is what proves `sport_label` arrived; a lead who picks Running proves nothing, because the label and the value are the same word.

**Check the received email, not the n8n execution log** — the log looks right even when the wrong branch fired. Confirm: subject language, greeting, sport word, body language, and that the PDF link resolves.

**Then replay a multi-item execution** with two different languages in one batch, and confirm each got its own. *That is the check the July 31 bug would have failed.*

### Step 4 — mirror into the repo

Claude updates `automation/contact-form-workflow.json` from a fresh export once Step 3 passes; Iván commits and pushes. **Keep the `TELEGRAM_CHAT_ID` placeholder** (Step 0).

### Not in scope here

- **CoachMatch nurture — checked, and there is nothing to fix.** *Corrected September 5, 2026, same day it was wrongly raised.* `automation/coachmatch-email-nurture-2-3.json` links `/guias/zonas-de-entrenamiento.pdf` **only from node `Send an Email1`, which is the Spanish branch** — a Spanish lead getting a Spanish guide, which is right. **The Portuguese branch (`Send an Email1 PT`) offers no guides at all**; it is an All-Access pitch. *The Spanish URL shows up in the PT handover file because that file contains the untouched ES nodes too — grepping the file rather than the node is what produced the false alarm.* **The open question is editorial, not a bug: should a Portuguese lead get a guides email at all, now that a Portuguese guide exists?** Iván's call.
- **`site/members/guias/index.njk`** exists only in Spanish. Gated page, not a funnel step.

---

## 🚨 The confirmation email only fires when Twenty succeeds — found September 5, 2026

**Found while testing the language branch, and it is older than that change.** A test submission hit `Create Person in Twenty` → `400 "A duplicate entry was detected"`, and the whole run ended without an email.

**Traced through the live connection graph, there are exactly two dead ends, and both are silent:**

```
Already exists? ✔ true  → Telegram notify (duplicate) → Respond success (duplicate)     ← NO EMAIL
Create Person   ✘ error → Is phone error? ✘ → Telegram alert - Twenty error → Respond   ← NO EMAIL
```

`Send confirmation email` hangs off `Person Created`, which is only reachable when the Twenty write succeeds. So:

- **A prospect who has contacted before gets no reply at all.** The `Already exists?` branch fires a Telegram to Iván and returns `{ok:true}` to the browser, so the visitor sees the success message and receives nothing. *This is the more common case of the two and the more damaging: a returning prospect is a warm one.*
- **A prospect Twenty rejects for any other reason gets no reply either** — including the documented duplicate-by-name case below.

**The precedent for the fix is already in this repo, and it is Iván's own.** `zone-magnet-runbook.md`: *"One email node, not two… **Deliberate side effect: delivery no longer depends on Twenty.** If Twenty is down or rejects the write, the athlete still gets the guide and the only thing lost is the CRM record, which is the right way round for a lead magnet."* **The contact form is wired the opposite way round and should not be.**

*Proposed, not built: move `Build confirmation copy` → `Send confirmation email` onto the path immediately after `Config`, so it fires for every submission, and let the Twenty branch run for the CRM record only. `Set leadStatus = MESSAGE_SENT` stays on the Twenty path since it needs `personId`. Needs Iván's call before rewiring.*

### Why the duplicate check missed it — RESOLVED September 5, 2026

**Cause 1, confirmed by reading the failed execution's `Check Twenty for existing Person` output:**

```json
{ "data": { "people": [] }, "totalCount": 0,
  "pageInfo": { "startCursor": null, "endCursor": null, "hasNextPage": false, "hasPreviousPage": false } }
```

***That is a well-formed Twenty response, not an error body*** — `totalCount` and a full `pageInfo` are present. **So the filter works, the check correctly returned false, and `neverError: true` is exonerated here.** *The competing hypothesis — that a silently-failing filter had been sending every repeat contact down the create path — is dead, and worth recording as dead so it is not re-raised.*

**The rejection is the documented case:** `emails.primaryEmail` genuinely held no match, and Twenty refused the create on a different criterion — the name `Raviol -` surviving from an earlier test, or the address sitting as a *secondary* email on an existing person. Already recorded in `ai-infrastructure-documentation.md` and `athlete-onboarding-flow.md`; this is the third occurrence.

**Deliberately NOT fixed by widening the check to include name.** *A name lookup would dedupe two genuinely different people who happen to share one* — `Juan Pérez` *is not a primary key, and a false-positive dedupe is worse than a false negative: the lead is silently dropped into the "already exists" branch instead of being created.* **The right response to a name collision is the Telegram alert that already fires, plus a human decision. The real defect this exposed is the one above — that the alert path sends no email.**

---

## The rewire — email no longer depends on Twenty (Iván, September 5, 2026: approved)

**Before.** `Send confirmation email` hangs off `Person Created`, so it only fires when Twenty accepts the write. Two silent dead ends, both leaving the visitor with nothing.

**After.** The email fires immediately after `Config`, for every submission. Twenty runs behind it, for the CRM record only.

```
Webhook → Config → Build confirmation copy → Send confirmation email → Check Twenty for existing Person → Already exists? → …
                                                    ✘ error ↓
                                        Telegram alert - email failed → Check Twenty for existing Person

Person Created → Set leadStatus = MESSAGE_SENT → Telegram notify Ivan → Respond success
```

### The exact changes

**Three connections to delete:**

1. `Config` → `Check Twenty for existing Person`
2. `Person Created` → `Send confirmation email`
3. `Send confirmation email` → `Set leadStatus = MESSAGE_SENT`

**Four to add:**

4. `Config` → `Build confirmation copy`
5. `Build confirmation copy` → `Send confirmation email`
6. `Send confirmation email` *(main / success output)* → `Check Twenty for existing Person`
7. `Person Created` → `Set leadStatus = MESSAGE_SENT`

**One node setting:** on `Send confirmation email`, Settings → **On Error → Continue (using error output)**.

> ***This setting is the whole point of the rewire, not a detail.*** *Moving the email to the front makes it the first thing that can fail. Left on the default, an SMTP hiccup would now kill the run **before** Twenty, turning a lost email into a lost lead — strictly worse than the bug being fixed.*

**One node to add:** paste `automation/telegram-alert-email-failed.node.json` onto the canvas, then wire:

8. `Send confirmation email` *(error output)* → `Telegram alert - email failed`
9. `Telegram alert - email failed` → `Check Twenty for existing Person`

*Both outputs of the email node converge on `Check Twenty`, so the lead reaches the CRM whether or not the mail went out. **A silent email failure is exactly the "failed in the half nobody watches" pattern this repo keeps paying for** — hence the alert rather than a bare continue.*

### What changes in behaviour

| case | before | after |
|---|---|---|
| New lead, Twenty OK | email ✅ | email ✅ |
| **Repeat contact** (email already in Twenty) | **silence** | **email ✅**, Telegram to Iván as before |
| **Twenty rejects the create** (name collision, any 400) | **silence** | **email ✅**, Telegram alert as before |
| Twenty down | silence | email ✅ |
| SMTP down | lead reached Twenty | lead still reaches Twenty, **plus a Telegram** |

**The one accepted downside:** someone who submits the form twice in a day now gets two identical emails. *That is the correct trade against a warm lead receiving nothing, and it is the same trade `zone-magnet-runbook.md` already made.*

**`Set leadStatus = MESSAGE_SENT` stays on the Twenty path** — it needs `$('Person Created').item.json.personId`, which only exists there. *Consequence, accepted: when Twenty rejects the lead the email is sent but no CRM record says so. There is no record to write it on.*

### Re-test after rewiring

Everything in Step 3 again, plus the two cases that were silent before:

- **Submit twice with the same email.** First submission: email + Twenty record. **Second: email again**, plus the duplicate Telegram. *Before this change the second produced nothing.*
- **Force a Twenty rejection** — reuse a name that already exists (`Raviol -` does). Expect the email to arrive **and** the `Telegram alert - Twenty error`.

### 🚨 Step 10 — the one field the rewire breaks (found on the first run, September 5, 2026)

**Symptom:** `Check Twenty for existing Person` → `Invalid URL: /rest/people. URL must start with "http" or "https".`

**Cause.** That node's URL was `={{ $json.TWENTY_BASE_URL }}/rest/people` — a **positional** reference, reading whatever item feeds it. It worked only because `Config` used to be its immediate upstream. The rewire puts `Send confirmation email` there instead, and that item has no `TWENTY_BASE_URL`, so the expression resolves to an empty string.

**Fix — one field, and it makes the node consistent rather than special.** On `Check Twenty for existing Person`, change `URL` to:

```
={{ $('Config').item.json.TWENTY_BASE_URL }}/rest/people
```

*That is exactly what `Create Person in Twenty` and `Create Person in Twenty (no phone)` already do. This node was the odd one out.*

**Audited: it is the only breakage.** Six nodes use bare `$json`; five of them read their *immediate* upstream, and none of those links changed:

| node | reads | upstream after rewire | ok |
|---|---|---|---|
| `Check Twenty for existing Person` | `$json.TWENTY_BASE_URL` | `Send confirmation email` | 🚨 **broken** |
| `Already exists?` | `$json.data` | `Check Twenty` | ✅ |
| `Create Person in Twenty` | `JSON.stringify($json)` | `Build Twenty payload` | ✅ |
| `Create Person in Twenty (no phone)` | `JSON.stringify($json)` | `Build Twenty payload (no phone)` | ✅ |
| `Person Created` | `$json.data` | `Create Person…` | ✅ |
| `Is phone error?` | `JSON.stringify($json)` | `Create Person…` error out | ✅ |

> ***The lesson, and it is mechanical rather than clever: a rewire audit has to cover data dependencies, not just the connection graph.*** *The graph was verified before this rewire was specced; the expressions were not. **`$json` means "whatever is plugged into me right now", so every node that uses it is silently coupled to its position** — and reordering is exactly the operation that breaks that coupling, with an error that names the wrong culprit (a URL, not a moved node).* **Grep the export for `$json.` before proposing any reorder.**

⚠️ **The lead from the failing execution reached the email but not Twenty.** *That is the rewire behaving as designed — mail no longer depends on the CRM — but the CRM record is genuinely missing and needs adding by hand, or the form re-submitted after the fix.*
