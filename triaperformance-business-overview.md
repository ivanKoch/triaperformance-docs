# Triaperformance — Business & Financial Overview

*Last updated: August 8, 2026. Update this file whenever the numbers move — every other document assumes this one is current.*

## What Triaperformance is
*Plan-sales figures are owned by `training-plans-analysis.md` (regenerated Aug 6, 2026 from the full TrainingPeaks export): 507 transactions since Jan 2023, $20,897 gross, $14,334 earnings, 2026 tracking to a record ~$6,800 on flat unit volume.*

A triathlon and running coaching business, founded roughly three years ago, run solo. Coaching (CoachMatch + Private), training plan sales, and a dormant subscription product, all currently operating through TrainingPeaks as the backbone. The website has migrated off HubSpot onto the self-hosted VPS (live at `triaperformance.com` via Caddy). *Updated Aug 2, 2026:* it is no longer "a basic homepage" — it runs on an Eleventy build with a three-language blog, a gated members area hosting the interactive tools, per-language All-Access landing pages, and a dynamic plan catalog + individual plan-page template built July 30 — *corrected Aug 6, 2026: this said "(deploy pending)"; it is live, verified against the live site. Count corrected again Aug 8, 2026 — **301 plans across ES/EN/PT**, re-derived from `data/training_plans_inventory.csv` after the race-stamped retirement.* The CRM is the self-hosted Twenty instance, sole system of record for leads and customers; **HubSpot is sunset and runs no live flow**. The only HubSpot item left is a one-time import of the 2,073 historical contacts (CSV already exported as insurance), parked until the storefront is ready to land a re-engagement blast. See `growth-roadmap.md`.

## Revenue streams (June 2026 snapshot)

| Channel | Monthly revenue | Active count | Commission | Notes |
|---|---|---|---|---|
| CoachMatch (1:1) | $2,773 | 30 athletes | 20% to TrainingPeaks | Inbound, TP-sourced leads only. Cannot be delegated to a hired coach. |
| Private (1:1) | $473 | 5 athletes | 3.5% via TP Payments | Referral / Instagram / website sourced. Can be delegated to a hired coach. |
| Passive plans | $847 | 301 listings | Standard TP marketplace terms | 164 Spanish, 108 English, 29 Portuguese. Near-zero hours invested in H1 2026. |
| All-Access | ~2 subscribers | 2 | — | Dormant — built, never marketed. Details below. |
| **Total** | **~$4,093** | | | |

**Target:** $5,000+/month. Current gap: ~$900/month (~22% of current run rate).

**Trend context:** February 2026 total was $4,862 (CoachMatch $3,311 / Private $799 / Plans $752) — a period of active full-time coaching alongside a demanding job. June's mix shift (Plans growing while CoachMatch and Private declined) reflects several months of deliberate maintenance mode, not a structural problem with those channels. CoachMatch specifically may already be inflecting: recent acquisitions have consistently landed at the higher $149 price point.

## Existing assets (built, under-distributed)

- **301 training plans** across three languages (ES 164 / EN 108 / PT 29), live on the TrainingPeaks marketplace. The most consistent, lowest-effort revenue line. *(Count corrected Aug 8, 2026 — this read "300" as a round number since the file was written, and separately "321" elsewhere in the same document. The owner of this figure is `data/training_plans_inventory.csv`; 381 rows, `is_published=TRUE` is the count. It moved twice in three days — 17 race-stamped plans retired Aug 6, one more Aug 8 — which is exactly why no doc should carry a hand-typed catalog number without saying where it came from.)* Full per-plan parameters live in that CSV and are the data source for the live plan catalog — see `growth-roadmap.md` §Training Plan Storefront.
- **All-Access subscription** — TrainingPeaks' bundled product. Subscribers get the entire catalog (301 plans today) + TrainingPeaks Premium (~$22/mo value on its own) + whatever add-ons the coach chooses to run (office hours, webinars, exclusive content). Priced $29.99/mo (Portuguese) or $39.99/mo (English, Spanish). Genuinely good value once an athlete runs 2+ plans; weaker value for someone executing just one. Fully built, never actively marketed — the occasional new subscriber comes from an unknown source.
- **3 lead magnets** (Spanish only): nutrition, mental preparation, and a training-zones explainer. Each has an 8-email nurture sequence promoting plans, All-Access, and coaching. Moved off HubSpot onto the site as part of the CRM migration. *Path corrected Aug 2, 2026:* the PDFs live at `/assets/guias/*.pdf` (old `/guias/<file>.pdf` URLs 301-redirect, since they're linked from already-sent emails); the bare `/guias/` path 404s and the only real page is the gated, `noindex` `/members/guias/`. One is pinned on Instagram; all are surfaced in email 3 of the CoachMatch welcome sequence. **Open gap:** there is no public landing page that captures an email in exchange for a guide, so nothing external can start a nurture sequence — tracked in `open-loops.md`.
- **Interactive tools** — **nine are live in the gated members area** (`/members/*`), behind the per-subscriber token gate, on the shared 3-tab template. HTML/CSS/JS, fully owned code, in the repo. *(Rewritten Aug 8, 2026 — this paragraph still described two tools sitting on public Claude share links with "migration to the owned website, with a paywall, pending." That was true in July; the gate went live July 24 and the publishing pipeline Aug 1. It had been wrong for two weeks in the doc every other doc treats as current.)* Still unbuilt and tracked in `open-loops.md`: one finished activation prototype awaiting port, plus the pace converter, threshold calculator, carb-loading calculator and the zone calculator three published articles already promise. Process: `artifact-publish-runbook.md`.
- **45 five-star GBP reviews** (zero negatives, Sep 2024–Aug 2026; count confirmed by Iván Aug 2, 2026 — the 43-vs-45 discrepancy previously flagged here is resolved at 45) — 36 have been repurposed to Instagram, 9 never posted. Curated quote bank, gaps (3 English, 0 Portuguese), and deployment plan live in `social-proof-and-reviews.md`. The July 2026 review push produced 7 reviews in 2 days — asking works. Supply is not a constraint: ~22 active athletes have never been asked, ~14 are due an ask in the next cycle, and already-posted reviews are freely recyclable after ~a year.

## Current infrastructure (mid-migration)

- **Website**: migrated off HubSpot, live on the Hostinger VPS (same box as Hermes) behind Caddy at `triaperformance.com`, auto-deployed via a daily cron pull+sync (see `deploy-runbook.md`). *Updated Aug 2, 2026:* the site is now an Eleventy build sourced from `site/` (not the old hand-written `website/` folder), with templated analytics, canonical/hreflang and sitemap. Live: homepage, three-language blog, per-language All-Access landing pages, category pages, a contact form wired into Twenty, and a token-gated `/members/` area with the interactive tools. *Corrected Aug 6, 2026 — this previously read "Built but not yet deployed: the dynamic plan catalog + individual plan-page template (July 30)." It is **live**: `/planes/`, `/en/plans/` and `/pt/planos/` serve every published plan with facet filters, plus an individual page per plan.* *Updated Aug 8, 2026 — Storefront Phase 1 closed Aug 6 (email-capture backend live and tested, Product schema validated green). The catalog serves **301 plans**. Record in `open-loops-archive.md`; what's still unbuilt is in `growth-roadmap.md` §Training Plan Storefront.*
- **CRM / lead pipeline**: self-hosted Twenty CRM (Docker, same VPS), stood up July 16, 2026, now the sole system of record for leads and customers. The CoachMatch pipeline (Gmail lead → Twenty Person → Telegram notification → 3-email n8n nurture → WhatsApp watchdog) and the website contact form both run end-to-end into it. *Updated Aug 2, 2026:* **HubSpot is sunset — no live flow of any kind still runs on it.** Decided July 29: migrate all 2,073 historical contacts (not active-only), deliberately parked until the storefront can land a re-engagement blast; the full CSV is already exported as insurance against losing access. Formal HubSpot decommission follows that import. Full detail: `growth-roadmap.md`.
- **Payments**: TrainingPeaks bills CoachMatch directly (20% commission, paid monthly). Private athletes bill through TP Payments (3.5% commission), which runs on a Stripe account + Mercury bank account under Iván's US entity, KOCH Ventures LLC. This same Stripe account is the planned backbone for the future website paywall.
- **Training data**: TrainingPeaks is the system of record for all athlete workouts, aggregating Garmin, Polar, Wahoo, and other devices. No programmatic access to this data exists today.
- **Athlete context**: currently informal — an onboarding survey, manual review of WhatsApp history, and workout data, reassembled by hand per athlete when planning. No structured system yet. See `growth-roadmap.md` for the plan.

### Coaching & subscription book — July 2026 snapshot

| Channel | Segment | List | Discount | Athlete pays | Commission | Net/athlete | Athletes | Net total |
|---|---|---|---|---|---|---|---|---|
| CoachMatch | Bronze, full price | 149.00 | — | 149.00 | 20% | 119.20 | 7 | 834.40 |
| CoachMatch | Bronze, legacy 50-OFF | 149.00 | 34% | 99.00 | 20% | 79.20 | 17 | 1,346.40 |
| CoachMatch | Bronze, legacy 40% | 149.00 | 40% | 89.40 | 20% | 71.52 | 3 | 214.56 |
| CoachMatch | Bronze, legacy 50% | 149.00 | 50% | 74.50 | 20% | 59.60 | 6 | 357.60 |
| Private | Single sport (old rate) | — | — | 89.00 | 3.5% | 85.89 | 2 | 171.78 |
| Private | Multi sport (old rate) | — | — | 104.00 | 3.5% | 100.36 | 1 | 100.36 |
| Private | Single sport (new rate) | — | — | 99.00 | 3.5% | 95.54 | 1 | 95.54 |
| Private | Multi sport (new rate) | — | — | 109.00 | 3.5% | 105.19 | 1 | 105.19 |
| All-Access | Spanish/English | 39.99 | — | 39.99 | 3.5% + $9 | 29.59 | 1 | 29.59 |
| All-Access | Portuguese | 29.99 | — | 29.99 | 3.5% + $9 | 19.94 | 1 | 19.94 |

**Coaching totals (38 athletes):** average paid $103.45 · average net $84.89 · blended commission 17.94% · net coaching revenue ~$3,226/mo.

**Read on this table:** blended net ($84.89) vs. the $149 list price is the growth gap. All legacy rates are grandfathered and closed to new athletes; the pause rule ($149 on return) plus natural attrition converges the book toward $149 without renegotiation. Every new sign-up nets $119.20 (CoachMatch) or $143.79 (Private).
