# Triaperformance — Business & Financial Overview

*Last updated: **September 5, 2026** (§Revenue history added — `data/revenue_history.csv`, the first all-time revenue series in the repo). Previously August 14, 2026 (status audit — catalogue count corrected in three places; All-Access subscriber count flagged unverified). Previously August 10, 2026.* *Update this file whenever the numbers move — every other document assumes this one is current.*

## What Triaperformance is
*Plan-sales figures are owned by `training-plans-analysis.md` (regenerated Aug 6, 2026 from the full TrainingPeaks export): 507 transactions since Jan 2023, $20,897 gross, $14,334 earnings, 2026 tracking to a record ~$6,800 on flat unit volume.*

A triathlon and running coaching business, founded roughly three years ago, run solo. Coaching (CoachMatch + Private), training plan sales, and a dormant subscription product, all currently operating through TrainingPeaks as the backbone. The website has migrated off HubSpot onto the self-hosted VPS (live at `triaperformance.com` via Caddy). *Updated Aug 2, 2026:* it is no longer "a basic homepage" — it runs on an Eleventy build with a three-language blog, a gated members area hosting the interactive tools, per-language All-Access landing pages, and a dynamic plan catalog + individual plan-page template built July 30 — *(deploy confirmed live Aug 6, 2026.)* The CRM is the self-hosted Twenty instance, sole system of record for leads and customers; **HubSpot is sunset and runs no live flow**. The only HubSpot item left is a one-time import of the 2,073 historical contacts (CSV already exported as insurance), parked until the storefront is ready to land a re-engagement blast. See `growth-roadmap.md`.

## Revenue streams

***Owner: `monthly-close/2026-08.md`.*** *This section states the shape of the business — what the channels are, how they are commissioned, what they can and cannot be delegated. Every value that has a date lives in the latest close and is not copied here. (Standing from close #1, September 2, 2026.)*

| Channel | Athletes at 2026-08-31 | Commission | What it is |
|---|---|---|---|
| CoachMatch (1:1) | **33** | 20% to TrainingPeaks | Inbound, TP-sourced leads only. **Cannot be delegated to a hired coach.** |
| Private (1:1) | **3** | 3.5% via TP Payments | Referral / Instagram / website sourced. **Can be delegated to a hired coach.** |
| All-Access | **1** (Portuguese) | 3.5% + $9 TP Premium | Dormant — built, never marketed. **Self-serve by design** — see below. |
| **Paying total** | **37** | | |
| Passive plans | 328 listings (ES 164 / EN 111 / PT 53) | Standard TP marketplace terms | Near-zero hours invested in H1 2026. Sales figures: `training-plans-analysis.md`. |

*Counts and MRR re-derived from `data/monthly_close/2026-08-roster.csv` on September 2, 2026: CoachMatch $3,640.20 · Private $292.00 · All-Access $29.99. **Five further athletes are coached and not paying** — one internal (Iván), two comp, two barter — which is why a headcount off TrainingPeaks reads 42 and the paying book reads 37.*

**For August's revenue, margin, churn, NRR and cost structure, read `monthly-close/2026-08.md`. Do not restate any of it here.**

> ***Why this section no longer carries its own numbers.*** *It was a June snapshot, and it was read as a run rate for two months — passive plans sat at **$847**, which is June's earnings to the cent and the best month in the file, while July was $301.63 and August $212.05.* **Nobody typed a wrong number; a photograph was quoted as a film.** *That is the failure the monthly close exists to remove, and it only stops if this file cites the close instead of keeping a copy.*

***All-Access is a self-serve product, and that is a decision, not a shortfall.*** *(Iván, September 4, 2026, when a WhatsApp draft written for the one live subscriber had nowhere to send.)* **The subscriber buys through a TrainingPeaks checkout, receives their plans and their members token by email, and never needs a conversation. No phone number is collected and none should be.**

**The channel is open inbound, not closed — and the asymmetry is the point.** *Iván's number is public on the site, on Instagram and in Google Business Profile; a subscriber who writes on WhatsApp gets an answer, and that is the coach-support promise working as intended.* **What does not happen is Iván initiating.** *Collecting a phone number by default would turn a support line the subscriber opens when they need it into a list Triaperformance is expected to work — a support expectation the $29.99–39.99 price does not carry, on the one channel that exists precisely because it does not consume Iván's calendar.*

**Do not log "All-Access subscribers have no phone number" as a gap to close** — it was raised as one on September 4, 2026 and struck the same day. *Read it as designed: they can reach him, he does not chase them.* **The practical consequence for anyone drafting a lifecycle message: email is the only outbound channel to a subscriber, so it has to carry the whole message on its own** — the coach-support card added on that date is async and email-shaped for the same reason (`triaperformance-pricing-and-positioning.md`).

**Target:** $5,000+/month.

**Trend context:** February 2026 total was $4,862 (CoachMatch $3,311 / Private $799 / Plans $752) — a period of active full-time coaching alongside a demanding job. June's mix shift (Plans growing while CoachMatch and Private declined) reflects several months of deliberate maintenance mode, not a structural problem with those channels. CoachMatch specifically may already be inflecting: recent acquisitions have consistently landed at the higher $149 price point.

## Revenue history — the growth curve

***Owner of every figure below: `data/revenue_history.csv`*** *(44 months × 3 channels, net earnings after TrainingPeaks commission; exported from TrainingPeaks' own payout history by Iván, September 5, 2026).* **This section owns the historical series and nothing else — current-month athlete counts, MRR, margin and churn stay owned by the latest `monthly-close/YYYY-MM.md`.** *The boundary is the point: a growth curve is durable history and does not go stale; a headcount does.*

| Year | Coaching 1:1 | Marketplace plans | All-Access | Total | YoY |
|---|---|---|---|---|---|
| 2023 | $504 | $846 | — | **$1,350** | — |
| 2024 | $6,618 | $3,821 | — | **$10,440** | **+673%** |
| 2025 | $31,223 | $5,846 | — | **$37,070** | **+255%** |
| 2026 (Jan–Aug, complete months) | $27,736 | $4,333 | $444 | **$32,542** | 88% of 2025 full year |

**All-time: $84,240.**

⚠️ ***Ownership boundary, stated so this does not become a second copy:*** *the `marketplace_plans` column here is the TrainingPeaks **payout roll-up** by month.* **`training-plans-analysis.md` still owns every plan-sales figure** *(units, per-plan return, language split, repeat purchase) from `data/plan_sales.csv` at transaction level.* *If the two ever disagree, the transaction file wins and this one is the one to re-export — a payout total is a settlement date, a sale is a purchase date, and they do not fall in the same month at the edges.*

**Three things this file settles that nothing else in the repo could:**

1. **The 670% claim is real, and the conservative half of it was wrong.** *`linkedin-positioning.md` removed it on September 4 as unsourceable.* **Year two grew 673%, and year three passed year two's full-year total in FIVE months, not the seven the old copy claimed** *(cumulative 2025 crossed $10,440 in May, at $12,429).*
2. **The business changed shape, not just size.** *Revenue mix by year — coaching share of total:* **2023 37% → 2024 63% → 2025 84% → 2026 86%.** *It started as a plan storefront with a coaching side-line and inverted completely. Marketplace earnings have never fallen; they have been outgrown.*
3. 🚨 **The retention drop is visible in the revenue, not only in the roster, and it is the clearest picture of it anywhere in this repo.** *Coaching peaked at* **$4,119 in February 2026** *and has fallen every month since to* **$3,196 in August — −22.4% over six months**, *matching `tenure-analysis.md`'s 53 → 37 athletes / −21% MRR from an entirely independent source.* **Two files, two methods, the same number.** *That is the strongest evidence the "retention or acquisition" decision has, and it is now sitting in the series rather than in an analysis.*

⚠️ *Do not annualise `2026-09` — it is a partial month (exported Sept 5) and the marketplace column reads $0 because nothing had settled yet, not because sales stopped.* ⚠️ *Marketplace earnings dropped to **$302** in July and **$212** in August from a **$847** June peak. That is a two-month move on a noisy line, not a trend — but it is the line `training-plans-analysis.md` owns, and it should be looked at there before the September close reads it as one.*

## Existing assets (built, under-distributed)

- **328 training plans across three languages (ES 164 / EN 111 / PT 53)**, live on the TrainingPeaks marketplace. *Count owned by `data/training_plans_inventory.csv`; the live catalogs render it at build time. **Cosmetic figure — not reconciled, not logged** (Sept 2, 2026).* Full per-plan parameters live in that CSV and are the data source for the live plan catalog — see `growth-roadmap.md` §Training Plan Storefront.
- **All-Access subscription** — TrainingPeaks' bundled product. Subscribers get the entire catalog (328 plans today) + TrainingPeaks Premium (~$22/mo value on its own) + whatever add-ons the coach chooses to run (office hours, webinars, exclusive content). Priced $29.99/mo (Portuguese) or $39.99/mo (English, Spanish). Genuinely good value once an athlete runs 2+ plans; weaker value for someone executing just one. Fully built, never actively marketed — the occasional new subscriber comes from an unknown source.
- **3 lead magnets** (Spanish only): nutrition, mental preparation, and a training-zones explainer. Each has an 8-email nurture sequence promoting plans, All-Access, and coaching. Moved off HubSpot onto the site as part of the CRM migration. *Path corrected Aug 2, 2026:* the PDFs live at `/assets/guias/*.pdf` (old `/guias/<file>.pdf` URLs 301-redirect, since they're linked from already-sent emails); the bare `/guias/` path 404s and the only real page is the gated, `noindex` `/members/guias/`. One is pinned on Instagram; all are surfaced in email 3 of the CoachMatch welcome sequence. **Open gap:** there is no public landing page that captures an email in exchange for a guide, so nothing external can start a nurture sequence — tracked in `open-loops.md`.
- **Interactive tools** — ***the members library was rebuilt on August 13, 2026 and now stands at*** ~~nine entries in each of three languages: seven interactive tools, one guide, one downloads page~~ ***~~ten entries in each of three languages: seven interactive tools, two guides, one downloads page~~ thirteen entries in each of three languages: ten interactive tools, two guides, one downloads page — plus a fourteenth, the runner core routine, in Spanish only (September 5, 2026).***

  > 🚨 ***Corrected September 2, 2026 — this table, which is the repo's inventory of record for the members library, had never listed `/members/fuerza/` at all.*** *The strength guide shipped in Spanish in August 2026 and is absent from both inventories: this one and `artifact-publish-runbook.md`'s Published-artifacts table.* **That absence is the reason the EN/PT gap went unseen for a month.** *`site/_data/library.json` sold `strength` as live and gated in English and Portuguese with no page behind it in either language; the two documents a session would consult to check that claim did not contain the tool, so there was nothing to check it against.* ***It is the same failure the runbook's own August 14 correction note describes — an inventory table trusted precisely because its purpose is to be trusted — recurring in the file that note names as the inventory of record.*** *EN and PT built September 2, 2026; the row is added below and the count corrected.*
 > 🚨 ***THIRD INSTANCE, September 3, 2026, and it was found the same way as the second — by opening this table to add an unrelated row.*** *`/members/hombro/` shipped in all three languages earlier the same day and was in **neither** inventory: not this table, not `artifact-publish-runbook.md`'s Published-artifacts table.* **`library.json` already sold it as live in all three, and this time that claim happened to be true — so nothing was mis-sold, and nothing would have caught it if it had not been.** *The Sept 2 note directly above ends by saying an inventory is only a control if the thing it is meant to catch would appear in it. It was written the day before, and the very next tool to ship did not appear in it.* ⚠️ ***The pattern across all three instances is that the row is added when the tool is translated or audited, never when it ships*** — `cyclistcore` (Aug 24), `strength` (Sep 2), `hombro` (Sep 3). **The standing check in `kb-hygiene-prompt.md` Step 0 diffs `library.json` against `site/members/`; it does not diff either inventory table, which is the surface that actually failed three times.** *Both rows added below.*

  *(Rewritten that day. This paragraph previously read "nine are live" and listed as unbuilt several things that now exist.)*

  | Entry | ES | EN | PT | What it is |
  |---|---|---|---|---|
  | Zones calculator | `/members/calculadora-de-zonas/` | `/members/en/training-zones-calculator/` | `/members/pt/calculadora-de-zonas/` | Test result → 7 zones × 3 sports, testing log, guide download |
  | Training load | `/members/carga/` | `/members/en/training-load/` | `/members/pt/carga-de-treino/` | IF, TSS, CTL/ATL/TSB, PMC — with Iván's own screenshots |
  | Activation | `/members/activacion/` | `/members/en/activation/` | `/members/pt/ativacao/` | 3 questions → 8 routines, timed |
  | Core | `/members/core/` | `/members/en/core/` | `/members/pt/core/` | Activation + core + mobility, no equipment |
  | Box breathing | `/members/respiracion/` | `/members/en/breathing/` | `/members/pt/respiracao/` | 3/5/10 min wind-down |
  | Knees | `/members/rodillas/` | `/members/en/knees/` | `/members/pt/joelhos/` | 2 questions → 4 strength routines |
  | Achilles | `/members/aquiles/` | `/members/en/achilles/` | `/members/pt/aquiles/` | 4 questions → 8 routines + gated jump block |
  | Cyclist core | `/members/core-ciclista/` | `/members/en/cyclist-core/` | `/members/pt/core-do-ciclista/` | 1 question → 3 or 4 rounds, bodyweight, anti-rotation |
  | Runner core | `/members/core-corredor/` | `/members/en/runner-core/` | `/members/pt/core-do-corredor/` | 1 question → 3 or 4 rounds, bodyweight. **All three languages Sept 4, 2026.** Standalone by decision — NOT merged with cyclist core. Home doc: `runner-core-brief.md` |
  | Strength guide | `/members/fuerza/` | `/members/en/strength/` | `/members/pt/forca/` | Hypertrophy vs max strength vs power, two periodization paths behind a goal switch |
  | Swimmer's shoulder | `/members/hombro/` | `/members/en/shoulder/` | `/members/pt/ombro/` | 2 questions → 6 routines on the strength engine. *Row added Sept 3, 2026 — see the note below* |
  | Mobility (post-exercise) | `/members/movilidad/` | `/members/en/mobility/` | `/members/pt/mobilidade/` | 2 questions → 15 routines, 10/20/30 min. ES Sept 3, **EN+PT Sept 4, 2026**. Home doc: `mobility-brief.md` |
  | Recovery day | `/members/recuperacion/` | `/members/en/recovery/` | `/members/pt/recuperacao/` | 2 questions → 15 routines, 30/45/60 min, three named blocks. ES Sept 4, **EN+PT Sept 5, 2026**. Home doc: `recovery-brief.md` |
  | Downloads | `/members/guias/` | `/members/en/downloads/` | `/members/pt/downloads/` | 5 PDFs ES / 1 EN / 1 PT |

  **Two engines underneath, both owned code in the repo:** `activation-tool.js` (timed circuits) and `strength-tool.js` (sets × reps + rest timer, built the same day). UI chrome for both is language-keyed in `_data/`. **Retired the same day, deliberately, content not moved:** `/members/zonas/`, `/members/tests/` (absorbed by the calculator), `/members/carrera/` (race pacing), `/members/kettlebell/`, `/members/nutricion/`. *That is five retirements against three new tools — the library was curated down as well as up, and the two retirements that removed race-day support are a known gap (`open-loops.md`).*

  Home docs: `activation-matrix.md`, `knee-strength-brief.md`, `achilles-brief.md`, `zones-calculator-brief.md`, `cyclist-core-brief.md`, `strength-guide-brief.md`, `swimmer-shoulder-brief.md`, `mobility-brief.md`. Process: `artifact-publish-runbook.md`.
- **46 five-star GBP reviews** (zero negatives, Sep 2024–Aug 2026; owner `social-proof-and-reviews.md`; **cosmetic figure, not reconciled**) — 38 repurposed to Instagram, 8 never posted. Curated quote bank, gaps (3 English, 0 Portuguese), and deployment plan live in `social-proof-and-reviews.md`. The July 2026 review push produced 7 reviews in 2 days — asking works. Supply is not a constraint: ~22 active athletes have never been asked, ~14 are due an ask in the next cycle, and already-posted reviews are freely recyclable after ~a year.

## Current infrastructure (mid-migration)

- **Website**: migrated off HubSpot, live on the Hostinger VPS (same box as Hermes) behind Caddy at `triaperformance.com`, auto-deployed via a daily cron pull+sync (see `deploy-runbook.md`). *Updated Aug 2, 2026:* the site is now an Eleventy build sourced from `site/` (not the old hand-written `website/` folder), with templated analytics, canonical/hreflang and sitemap. Live: homepage, three-language blog, per-language All-Access landing pages, category pages, a contact form wired into Twenty, and a token-gated `/members/` area with the interactive tools. *Corrected Aug 6, 2026 — this previously read "Built but not yet deployed: the dynamic plan catalog + individual plan-page template (July 30)." It is **live**: `/planes/`, `/en/plans/` and `/pt/planos/` serve every published plan with facet filters, plus an individual page per plan.* *Updated Aug 8, 2026 — Storefront Phase 1 closed Aug 6 (email-capture backend live and tested, Product schema validated green). The catalog serves **328 plans**. Record in `open-loops-archive.md`; what's still unbuilt is in `growth-roadmap.md` §Training Plan Storefront.*
- **CRM / lead pipeline**: self-hosted Twenty CRM (Docker, same VPS), stood up July 16, 2026, now the sole system of record for leads and customers. The CoachMatch pipeline (Gmail lead → Twenty Person → Telegram notification → 3-email n8n nurture → WhatsApp watchdog) and the website contact form both run end-to-end into it. *Updated Aug 2, 2026:* **HubSpot is sunset — no live flow of any kind still runs on it.** Decided July 29: migrate all 2,073 historical contacts (not active-only), deliberately parked until the storefront can land a re-engagement blast; the full CSV is already exported as insurance against losing access. Formal HubSpot decommission follows that import. Full detail: `growth-roadmap.md`.
- **Payments**: TrainingPeaks bills CoachMatch directly (20% commission, paid monthly). Private athletes bill through TP Payments (3.5% commission), which runs on a Stripe account + Mercury bank account under Iván's US entity, KOCH Ventures LLC. This same Stripe account is the planned backbone for the future website paywall.
- **Training data**: TrainingPeaks is the system of record for all athlete workouts, aggregating Garmin, Polar, Wahoo, and other devices. No programmatic access to this data exists today.
- **Athlete context**: currently informal — an onboarding survey, manual review of WhatsApp history, and workout data, reassembled by hand per athlete when planning. No structured system yet. See `growth-roadmap.md` for the plan. *(Update, Aug 8, 2026 — the store is now decided, though not built: Postgres on `analytics-postgres`, keyed by `twenty_person_id`. Schema and reasoning in `athlete-onboarding-flow.md` §2.)*

### Coaching & subscription book — the price ladder

***Counts owned by `monthly-close/YYYY-MM.md`; rates owned by `triaperformance-pricing-and-positioning.md`.*** *The durable content here is the* ***shape*** *of the book — which legacy rates exist, what each nets — not how many sit on each rung this month. Counts below re-derived from `data/monthly_close/2026-08-roster.csv`, 2026-08-31.*

| Channel | Segment | Athlete pays | Commission | Net/athlete | At 2026-08-31 |
|---|---|---|---|---|---|
| CoachMatch | Bronze, full price | 149.00 | 20% | 119.20 | **10** |
| CoachMatch | Bronze, legacy 50-OFF | 99.00 | 20% | 79.20 | **16** |
| CoachMatch | Bronze, legacy 40% | 89.40 | 20% | 71.52 | **3** |
| CoachMatch | Bronze, legacy 50% | 74.50 | 20% | 59.60 | **4** |
| Private | Single sport (old rate) | 89.00 | 3.5% | 85.89 | **1** |
| Private | Single sport (new rate) | 99.00 | 3.5% | 95.54 | **1** |
| Private | Multi sport (old rate) | 104.00 | 3.5% | 100.36 | **1** |
| Private | Multi sport (new rate) | 109.00 | 3.5% | 105.19 | **0** |
| All-Access | Portuguese | 29.99 | 3.5% + $9 | 19.94 | **1** |
| All-Access | Spanish/English | 39.99 | 3.5% + $9 | 29.59 | **0** |

**37 paying · gross MRR $3,962.19 · net $3,222.88 · average paid $107.09 · average net $87.10.** *(The close's scoreboard states coaching MRR as $3,932.20 — that figure excludes the All-Access subscriber, this one includes it. Same roster, two intentionally different denominators.)*

**The countdown that matters: 10 athletes at full price against 23 legacy.** *In July it was 7 against 26.*

**Read on this table:** blended net ($84.89) vs. the $149 list price is the growth gap. All legacy rates are grandfathered and closed to new athletes; the pause rule ($149 on return) plus natural attrition converges the book toward $149 without renegotiation. Every new sign-up nets $119.20 (CoachMatch) or $143.79 (Private) — **$134.79 if the Private athlete arrived as a referral**, which carries a $9 TrainingPeaks Premium cost *(added Aug 26, 2026; owner `triaperformance-pricing-and-positioning.md` §TrainingPeaks Premium)*.
