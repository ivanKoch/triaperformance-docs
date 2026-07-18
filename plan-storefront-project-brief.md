# Project Brief — Training Plan Storefront ("Vidriera")

*Self-contained kickoff doc. Everything needed to start the build in a fresh conversation. Written Jul 18, 2026. Companion files: `training-plans-analysis.md` (full analysis), `plan_performance.csv` (per-plan data: inventory + all-time sales + T12M sales + 12-month views + conversion), `growth-roadmap-ADDITION-plan-storefront.md` (to commit to triaperformance-docs).*

## 1. The business today (verified numbers)

| Metric | Value |
|---|---|
| Catalog | 407 rows: 394 built, 338 published on TP. ES 199 / EN 135 / PT 70 |
| All-time sales (Jan 2023 – Jul 2026) | 499 units, $20,549 gross, $14,095 earnings |
| TP effective take | 29.4% |
| Trailing 12 months | $8,814 gross / $6,018 earnings; +11% YoY, growth driven by price ($21→$49 avg), not volume |
| Time invested since Jan 13, 2026 | Zero. 100% passive at $300–800/month |
| View→purchase conversion (12mo pixel data) | 1.19% (16,282 views → 193 sales), $0.57 gross/view |
| Median plan views on TP | 27/year. Only 1 published plan had zero views |
| Marketplace crowding (from sequential plan IDs) | ~80,000 new TP plans/year; we are 0.16% of new supply |
| Email opt-ins from 499 sales | 0 |
| Repeat buyers | 8% |

**What sells:** weight-loss mixes (#1 concept, 1.7% conv, 80% EN — ES untapped), Triathlon ES (1.8% conv, core franchise), HYROX (since Aug 2025, $56 avg, accelerating), 21km running, FTP/cycling *views* (but see below). January and June are peak months.

**What doesn't:** race-year-stamped marathon plans (110 built, $1,620 all-time, Boston 16 plans/0 sales) — annual rebuild treadmill for nothing. Portuguese (17% of build effort, 5% of revenue). 55% of published plans have never sold once.

**Wasted views (cheapest fix in the dataset):** EN Cycling (3,082 views, 0.5% conv; several FTP plans with 150–180 views and 0 sales) + EN Triathlon (777 views, 0.5% vs identical ES plans at 1.8%). ~24% of all traffic converting at ¼ rate ≈ ~$1,500/yr recoverable by rewriting listings. EN conversion gap is competitive (80/20 Endurance, MyProPlan ~900 EN plans, 100k+ sold, authority + reviews) — so EN needs differentiated positioning, ES/PT is where SEO is a blue ocean.

**Price elasticity is mild:** $46–60 plans earn $0.66/view vs $0.38 for ≤$30. Premium pricing wins per eyeball.

## 2. Strategy decided

**Option A now — showcase + redirect to TP.** Keeps 100% passivity. TP's 30% on current volume (~$2.6k/yr) is not worth becoming merchant of record (VAT/tax compliance, refunds, chargebacks, support). Site's job #1 is traffic volume, not margin recovery.

**Option C built into A — capture email before redirect.** Lead magnet / "email me my recommended plan" / discount code. The list is the compounding asset TP can never take. Every redirect carries UTM + plan_id.

**B-lite as premium layer (approved):** "Plan + 20-min onboarding call" — apply plan to calendar, answer doubts, set thresholds. Sold direct, top sellers only. **Pricing: flat +$50 USD** (preferred over 2x: plan prices span $24–80, 2x underprices the call on cheap plans). Also a coaching-funnel touchpoint; the athlete meets a real coach.

**Full direct checkout: deferred.** Trigger: site-attributed TP sales > ~$1k/month sustained. Then pilot top-20 sellers, freelancer handles the apply step (~5 min/sale), or merchant-of-record (Paddle / Lemon Squeezy, 5–10%) to keep tax outsourced.

**All-Access = flagship upsell (approved).** TP subscription product, $39.99/mo (ES + EN), all plans + unlimited swaps + TP Premium included + guides/PDFs. Currently 2 subscribers — zero distribution to date, so untested, not failed. Economics: median plan buyer pays $48 once and never returns (8% repeat); a subscriber staying 2+ months already beats that, and realistic tenure = one race-prep cycle (3–4 months) → ~3x revenue per customer. Value-prop math for the promo module: 1 plan ≈ $15/mo amortized + $21/mo TP Premium = ~$36/mo for one plan, vs $39.99 for everything.

- Laddered offer everywhere purchase intent exists (plan pages + AI-picker results): **plan ($X) / plan + 20-min call (+$50) / All-Access ($39.99/mo)**.
- Segment the pitch: push subscription to marathon/tri/HYROX/multi-goal athletes; keep first-timer short-plan buyers on clean one-time conversion. Plan-swap freedom doubles as an anti-hesitation argument ("can't pick wrong").
- Flywheel rule: every future artifact (race-ready calculator, carb loader, new guides) launches inside All-Access first. The accumulating bundle is the moat plan-only competitors don't have. "Training journeys" (weight-loss → 5k → 10k → 21k) = pure curation, attacks between-race churn.
- **To verify with TP account manager:** rev share on All-Access vs 30% plan take; monthly subscriber/churn reporting; whether library additions are same-day.

**Operating rule:** site DB = source of truth, TP = dumb mirror. Never bulk hand-edit TP listings again (300 plans × 1 min each, weeks of description-polishing with no revenue lift — lesson learned). Enrichment effort only on the ~100 plans with proven views/sales; long tail gets auto-generated pages.

## 3. Build plan

### Phase 1 — Storefront core
1. Load `plan_performance.csv` into a table on the Hostinger VPS.
2. One dynamic plan-view template renders all plans (description HTML already exists per plan; enrich top 100 first). Cross-sell block: "athletes also bought" + same-collection plans.
3. Facet filters: sport, distance, difficulty, weeks, language, pace/HR/power, strength included, weight-loss.
4. Email capture before every TP redirect; UTM + plan_id on every outbound link.
4b. All-Access promo module on plan pages + dedicated landing page per language (ES/EN).
5. SEO foundation: language sections with hreflang (ES first — 57% of revenue, least competition); intent hub pages ("plan medio maratón intermedio 12 semanas"); Product schema with price + review stars from the social-proof quote bank. Plan pages are conversion destinations; hub pages are the door — 394 thin pages alone won't rank.
6. **Fix the Cloud Run tracking pixel** (died ~Jun 30, 2026; check ignored Google Cloud emails — likely billing/deactivation). Only funnel instrument we have.

### Phase 2 — Discovery & conversion
1. AI plan picker: user types "quiero correr un 10k rápido en 8 semanas" → cheap LLM (Haiku-class) parses intent → facets → ranked 2–3 plans. No vector DB needed at 394 plans; cost is fractions of a cent/query. Doubles as email capture ("send my recommendation to my inbox").
2. Rewrite EN Cycling + EN Triathlon TP listings copying the ES tri positioning that converts.
3. Race+year SEO landers (Boston 2027, Berlin 2027, Valencia…) pointing to evergreen plans — the page carries the year, the plan doesn't. Kills the 99-plan annual rebuild.

### Phase 3 — Monetization (trigger-based)
1. B-lite bundle (+$50 call) on top-10 sellers, direct checkout for the bundle only.
2. Full direct-sales pilot if trigger hit (see §2).

### Data model gaps to fill (top ~100 plans only)
- 2–3 sentence goal description (what athlete, what outcome).
- Target weekly hours / volume range.
- Fix 4 duplicate plan_ids in inventory: 439394, 439396, 439397 (Boston 2026 EN double-listed), 612974 (Lima ES/PT rows).
- 13 "not built" plans = HYROX EN/PT + WL ES — build HYROX EN first (EN is 60% of HYROX revenue), then WL ES.

## 4. KPIs
Site sessions by language · email opt-ins/week · UTM-attributed TP views & sales · site-referred conversion (target ≥2% vs 1.19% TP-native) · B-lite attach rate · revenue per view · **All-Access subscribers, monthly churn, avg tenure (breakeven vs plan sale ≈ 2 months)**.

## 5. Open questions
- VPS stack choice for the storefront (aligns with existing Hermes/Hostinger setup; the storefront is the first vertical slice of the broader website rebuild that gates the tools-library migration).
- Review display: TP reviews can't be exported cleanly — decide how to source/verify testimonials per plan (social-proof quote bank exists).
- Whether the AI picker should also quote B-lite ("add a 20-min coach call for $50") at recommendation time — likely yes, zero marginal cost.
- Domain/URL structure for three languages (subfolders /es /en /pt recommended for consolidated authority).
