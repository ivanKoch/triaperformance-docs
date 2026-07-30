# Open Loops — the single source of truth for what's in flight

**Last updated: July 30, 2026 (Plan Storefront Phase 1, part 1 — catalog + plan-page template built, not yet deployed).** This file replaces the open-item lists previously scattered across `ai-infrastructure-documentation.md`, `growth-roadmap.md` (Sequencing), `content-engine-brief.md` (Open decisions), and the runbooks. Those docs keep the *detail*; this file is the *list*. Update it at the end of every working session.

## Rules
- **WIP limit: 1 big branch + 1 small slot.** A new branch opens only when one closes.
- Every session ends with its branch either **closed** or **parked with an explicit trigger** written here.
- NOW = active this week. NEXT = queued, with its trigger. LATER = parked deliberately, with its trigger.

---

## NOW

### The one big branch: Plan Storefront Phase 1
The only item on this list that moves revenue toward the $5k/mo target this quarter. Detail: `growth-roadmap.md` (storefront section), `plan-storefront-project-brief.md`.

**Definition of done:** dynamic plan template rendering every published plan · facet filters (sport, distance, difficulty, weeks, language, features) · email capture before the TP redirect · All-Access promo module on every plan page + per-language landing page · all redirects carry UTM + plan_id · Product schema on plan pages · live on triaperformance.com.

Sub-items:
- [x] ~~Finish the weekly-breakdown crawl~~ — **done July 29, 2026.** 301/323 published plans captured (22 confirmed dead, race-year plans past their date), zero rate-limit hits at ≥2s sequential pacing. Loaded into the live Postgres `plan_weekly_breakdown` table and confirmed via psql: **765 rows, 301 plans** (exact match, no discrepancy).
- [x] ~~Dedupe the 4 duplicate `plan_id`s in `plans_raw` (439394, 439396, 439397, 612974)~~ — **done, confirmed July 29, 2026.** Live query showed nothing was actually needed: `plans_raw` is already at 381 rows, matching the corrected source CSV exactly, `612836` present with correct content. No SQL run. (The doc previously said Postgres needed a separate fix — that was stale; someone reloaded the table from the fixed CSV at some undocumented point after July 22.)
- [x] ~~Manually check plan_ids 612974 (Lima ES) and 612836 (Lima PT) on TrainingPeaks — both 404 despite `is_published = TRUE`~~ — **done July 29, 2026.** Iván confirmed both are genuinely unpublished. `is_published` flipped to `FALSE` in `data/training_plans_inventory.csv` (published count now 321, was 323), `data/plan_weekly_breakdown_errors.csv` reasons updated, and `plans_raw` on Postgres updated + confirmed via psql. Fully closed.
- [x] ~~Build the plan template + facets + capture + All-Access module~~ — **built July 30, 2026, not yet deployed.** Individual plan-page template (321 plans, 3 languages, paginated), catalog pages with client-side facet filters (sport/distance/difficulty/weeks/features) for all 3 languages, the 4 existing hand-written category pages converted to the same catalog component (same URLs, same intro copy, presets confirmed against the real data model — HYROX is a distance not a sport, weight-loss is a feature flag not a category), All-Access promo module on every plan page, inline skippable email capture next to the buy CTA, every redirect carries UTM + plan_id. Detail: `ai-infrastructure-documentation.md` §17. **Not done yet:** deploy (commit/push is Iván's + VPS cron pull), email-capture backend (spec'd in new `plan-lead-pipeline-runbook.md`, blocked on Iván adding `PLAN_CATALOG` to Twenty's `leadSource` enum and confirming with a real API call).
- [ ] Product schema → validate with Rich Results Test (parked in roadmap for exactly this moment) — schema is shipping in the build above; the actual Rich Results Test run needs a live URL, so it happens after deploy, next session.
- [ ] Wire up plan-catalog email capture backend — Caddy route, n8n workflow import, Twenty enum addition. Full spec in `plan-lead-pipeline-runbook.md`. Front end is live-ready today; capture just fails silently until this is done (buy button is unaffected either way).

### Small slot (pick one at a time)
- [ ] **New 1:1 athlete onboarding flow** — this week's signup was fully manual. Define the checklist (Twenty record with `customerType`/`churnDate` conventions, member access if applicable, welcome message), then n8n the deterministic parts. (Iván, July 29)
- [ ] Deploy the research agent per `automation/content-engine/SETUP.md` — code written, nothing deployed. Gate A only; no writer.
- [x] ~~Ronald Yesid duplicate active tokens — dedupe (query in `OPERATIONS.md`)~~ — **done July 29, 2026.** Wasn't a true duplicate-active case (only 1 of 2 rows was ever active); deactivated the other for cleanliness. Confirmed via psql.
- [x] ~~Duplicate-lead Telegram notification pulls raw HubSpot email HTML — fix~~ — **closed July 29, 2026.** Root cause was pre-July-24 (mailer-daemon/calendar-notification emails passing through the old zero-filter IMAP trigger); already fixed by the existing Filter node. No code change needed. While testing this, found and fixed two real bugs instead: a `Location`-field parsing bug that broke `preferredLanguage`/phone detection/`addressCountry` for leads without a full 3-part location, and added a new BR/AR + no-phone suppression filter for the WhatsApp-outreach Telegram ping (both live-tested, both mirrored into `automation/coachmatch-lead-automation.json`). Detail: `ai-infrastructure-documentation.md` §12 addendum.
- [x] ~~GSC: pull the flagged URLs from Indexing > Pages, confirm the "Duplicate without user-selected canonical" entries are pre-migration stale~~ — **done July 29, 2026.** Real bug, not stale: Caddy served `triaperformance.com` and `www.triaperformance.com` as one identical, non-redirecting site block, so Google picked the www version as canonical despite the correct declared tag. Fixed with a Caddy split (www now 301s to apex), verified live via curl. Detail: `ai-infrastructure-documentation.md` §15 addendum.
- [x] ~~Eleventy Phase 5 cleanup — delete `website/`, move `images/`/`hubfs/`/`guias/` into `site/assets/`~~ — **done July 29, 2026, scope revised.** `hubfs` turned out to be permanent, not migration debt — TrainingPeaks' own marketplace hotlinks that exact route across ~300 live plans, confirmed with Iván, so it stays in `website/hubfs` forever. Only `images` and `guias` moved into `site/assets/`. Along the way: built a real gated landing page at `site/members/guias/index.njk` (Spanish only) since the old bare `/guias/` link had no index and always 404'd (true pre-migration too, just never noticed); added 3 explicit Caddy redirects (old `/guias/<file>.pdf` → `/assets/guias/<file>.pdf`, not wildcarded, so they don't clash with the new real `/members/guias/` page) for the PDF links already sitting in sent emails; deleted the superseded `website/planes`/`pt`/`all-access`/`members`/`en` folders (`website/` itself stays, now holding only `hubfs`, `googleTag.html`, `.DS_Store` — left alone, not tracked as a to-do). Fully verified live: hero images, guías PDF redirect, `/members/guias/` (light theme, matching other subpages after catching a dark-theme CSS mismatch), all confirmed working post-deploy. Detail: `website-build-cutover-runbook.md` steps 17–19, `ai-infrastructure-documentation.md` §16.
- [x] ~~The 3 downloadable guides only exist in Spanish, but the EN and PT blog articles link to the Spanish PDF anyway~~ — **closed July 29, 2026, stopgap.** Removed the guide-reference paragraph from both the EN (`how-to-choose-a-marathon-plan.njk`) and PT (`como-escolher-seu-plano-de-maratona.njk`) articles rather than link a mismatched-language PDF. Real EN/PT translations of the guide, if ever wanted, would be new content work, not logged as a pending item. **Resolved July 29, 2026:** the filenames were just non-self-describing — confirmed by Iván: `pre-entreno.pdf` = nutrition lead magnet, `intervalos.pdf` = mental-training lead magnet, `zonas-de-entrenamiento.pdf` = zones lead magnet. The KB's "nutrition / mental prep / zones" description was correct all along. Additionally, the two FULL guides (`guia-de-herramientas-nutricionales.pdf`, `guia-de-herramientas-mentales.pdf`) are now in `site/assets/guias/` and the members `/members/guias/` page shows all 5 with accurate titles. The 3 lead magnets remain for use in comms/emails/flows — nothing pending there.
- [x] ~~Export the full 2,073-contact HubSpot CSV~~ — **done July 29, 2026.** Keep the CSV out of the git repo (2,073 contacts' PII) — store it locally/Drive/Bitwarden-adjacent, note where.

---

## NEXT (queued, in order, each with its trigger)

1. **TP listing rewrites experiment — LIVE, all 21 listings pasted July 29-30, 2026. Waiting on data.** EN 9 (`en-listing-rewrites-2026-07.md`) + ES 8 / PT 4 (`es-pt-listing-rewrites-2026-07.md`); control = the 3 untouched EN sellers (413817, 414883, 602981, 2.2% conv). **Checkpoints: peek ~Aug 30 (directional), real read ~Oct 27 (90 days)** — queries and decision rule in the Measurement section of `es-pt-listing-rewrites-2026-07.md`. Also watch GA4 for source=trainingpeaks sessions (new contact-CTA funnel from listings → Twenty). Fixed along the way: `plan_views_clean` on the VPS now excludes all 3 personal IPs, matching BigQuery.
2. **Race-specific landing pages** — every major city marathon (NYC, Chicago, Valencia, Buenos Aires…), half marathons, Ironman/70.3. Evergreen pages backed by evergreen plans. Trigger: plan template shipped. (Iván, July 29)
3. **Weekly GBP-review → IG testimonial drip** — 33 never-posted reviews ≈ 8 months of zero-creation content. Trigger: any time; first recurring content job.
4. **Full HubSpot migration (all 2,073 contacts) + re-engagement email blast + HubSpot decommission** — decided July 29: migrate all, not active-only. Trigger: storefront/website content ready to land the blast on.
5. **EN/PT review generation** (playbook in `social-proof-and-reviews.md`) — every EN/PT athlete gets asked until EN ≥10, PT ≥5. Trigger: ongoing, milestone-triggered asks.
6. **B-lite premium bundle** (+$50 onboarding call on top sellers). Trigger: storefront live.
7. **Affiliate program applications** (Amazon first). Trigger: first gear article scheduled — the 180-day/3-sale clock starts at *approval*, so don't apply before traffic exists.

---

## LATER (parked deliberately)

- **AI Coach product** — methodology.md done; open: pricing, liability scope, cannibalization. Trigger: storefront shipped.
- **Terra API personal integration** — self-test with own training data. Slack-time project, no trigger needed.
- **WhatsApp context tool** (chat-export → athlete profile). Trigger: athlete context system work begins.
- **Coach hire** — gated on athlete context system quality.
- **Content engine writer + publisher + feedback agents** — Gate A must prove idea quality first; feedback loop needs 60–90 days of GSC data.
- **White-label AI Coach / deploy blueprint / course** — parking lot, post-current-build.
- **Deeper analytics** (GA4 User-ID, per-event access log, BigQuery→VPS sync) — planning-only.
- **Direct checkout** — trigger: site-attributed TP sales > ~$1k/mo sustained.
- "Who's in Twenty but has no members access" query — trigger: athlete list too big to eyeball.
- Kettlebell members page nav unification — cosmetic.
- Verify with TP account manager: All-Access rev share + monthly subscriber/churn reporting.
- Open decisions from `content-engine-brief.md` §9 still pending: Instagram account type (Business?), LinkedIn track identity.

---

## Recently closed (context for new conversations)

- Monday coaching check-in — validated on a real Monday, fully live (Jul 2026)
- Managed Hermes plan — cancelled (Jul 29)
- Eleventy cutover + sitemap/robots + analytics sanity check (Jul 26–28)
- Members-area auth gate + subscription lifecycle + customer backfill (Jul 24–25)
- Contact form → Twenty pipeline (Jul 22)
- Six member artifacts gated behind login (carga, carrera, nutricion, tests, zonas, kettlebell)
- Blog live with first article ×3 languages; 323/323 plan links verified OK (Jul 27)
- Plan-link "6 dead plans" myth closed — artifact of a partial crawl (Jul 27)
