# Open Loops — the single source of truth for what's in flight

**Last updated: July 29, 2026 (storefront crawl + dedup diagnosis session).** This file replaces the open-item lists previously scattered across `ai-infrastructure-documentation.md`, `growth-roadmap.md` (Sequencing), `content-engine-brief.md` (Open decisions), and the runbooks. Those docs keep the *detail*; this file is the *list*. Update it at the end of every working session.

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
- [ ] Finish the weekly-breakdown crawl — **file-level done July 29, 2026:** 301/323 published plans captured, 22 confirmed dead (race-year plans past their date), zero rate-limit hits at ≥2s sequential pacing. Box stays unchecked until the new rows are loaded into the live Postgres table and Iván confirms the row count via psql — commands prepared, see `ai-infrastructure-documentation.md` §10.
- [ ] Dedupe the 4 duplicate `plan_id`s in `plans_raw` (439394, 439396, 439397, 612974) — **source CSV was already fixed July 22** (`git` commit `a3833e8`, predates this list); only the Postgres `plans_raw` table (loaded July 21, before that fix) still needs it. Diagnostic + fix SQL prepared, pending Iván running it and confirming via psql — see `ai-infrastructure-documentation.md` §10.
- [ ] New: manually check plan_ids 612974 (Lima ES) and 612836 (Lima PT) on TrainingPeaks — both now 404 despite `is_published = TRUE`, found during the July 29 crawl.
- [ ] Build the plan template + facets + capture + All-Access module
- [ ] Product schema → validate with Rich Results Test (parked in roadmap for exactly this moment)

### Small slot (pick one at a time)
- [ ] **New 1:1 athlete onboarding flow** — this week's signup was fully manual. Define the checklist (Twenty record with `customerType`/`churnDate` conventions, member access if applicable, welcome message), then n8n the deterministic parts. (Iván, July 29)
- [ ] Deploy the research agent per `automation/content-engine/SETUP.md` — code written, nothing deployed. Gate A only; no writer.
- [ ] Ronald Yesid duplicate active tokens — dedupe (query in `OPERATIONS.md`)
- [ ] Duplicate-lead Telegram notification pulls raw HubSpot email HTML — fix
- [ ] GSC: pull the flagged URLs from Indexing > Pages, confirm the "Duplicate without user-selected canonical" entries are pre-migration stale
- [ ] Eleventy Phase 5 cleanup — delete `website/`, move `images/`/`hubfs/`/`guias/` into `site/assets/` (needs Caddy redirect for `/guias/` PDFs linked from live emails — ask Claude, per cutover runbook step 18)
- [x] ~~Export the full 2,073-contact HubSpot CSV~~ — **done July 29, 2026.** Keep the CSV out of the git repo (2,073 contacts' PII) — store it locally/Drive/Bitwarden-adjacent, note where.

---

## NEXT (queued, in order, each with its trigger)

1. **EN Cycling + EN Triathlon TP listing rewrites** — ~$1,500/yr recoverable, zero new plans. Trigger: any time; independent of everything. Copy the ES tri positioning (1.8% conv vs 0.5%).
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
