# Triaperformance — Business & Financial Overview

*Last updated: July 2026. Update this file whenever the numbers move — every other document assumes this one is current.*

## What Triaperformance is
A triathlon and running coaching business, founded roughly three years ago, run solo. Coaching (CoachMatch + Private), training plan sales, and a dormant subscription product, all currently operating through TrainingPeaks as the backbone, with a HubSpot-hosted website/CRM that's being phased out.

## Revenue streams (June 2026 snapshot)

| Channel | Monthly revenue | Active count | Commission | Notes |
|---|---|---|---|---|
| CoachMatch (1:1) | $2,773 | 30 athletes | 20% to TrainingPeaks | Inbound, TP-sourced leads only. Cannot be delegated to a hired coach. |
| Private (1:1) | $473 | 5 athletes | 3.5% via TP Payments | Referral / Instagram / website sourced. Can be delegated to a hired coach. |
| Passive plans | $847 | ~300 listings | Standard TP marketplace terms | 150 Spanish, 100 English, 50 Portuguese. Near-zero hours invested in H1 2026. |
| All-Access | ~2 subscribers | 2 | — | Dormant — built, never marketed. Details below. |
| **Total** | **~$4,093** | | | |

**Target:** $5,000+/month. Current gap: ~$900/month (~22% of current run rate).

**Trend context:** February 2026 total was $4,862 (CoachMatch $3,311 / Private $799 / Plans $752) — a period of active full-time coaching alongside a demanding job. June's mix shift (Plans growing while CoachMatch and Private declined) reflects several months of deliberate maintenance mode, not a structural problem with those channels. CoachMatch specifically may already be inflecting: recent acquisitions have consistently landed at the higher $149 price point.

## Existing assets (built, under-distributed)

- **300 training plans** across three languages, live on the TrainingPeaks marketplace. The most consistent, lowest-effort revenue line.
- **All-Access subscription** — TrainingPeaks' bundled product. Subscribers get all 300 plans + TrainingPeaks Premium (~$22/mo value on its own) + whatever add-ons the coach chooses to run (office hours, webinars, exclusive content). Priced $29.99/mo (Portuguese) or $39.99/mo (English, Spanish). Genuinely good value once an athlete runs 2+ plans; weaker value for someone executing just one. Fully built, never actively marketed — the occasional new subscriber comes from an unknown source.
- **3 lead magnets** (Spanish only): nutrition, mental preparation, and a training-zones explainer. Each has an 8-email nurture sequence promoting plans, All-Access, and coaching. One is pinned on Instagram; all are also surfaced in email 3 of the CoachMatch welcome sequence. Low traffic today — an asset waiting on distribution, not a rebuild.
- **Interactive tools built as Claude artifacts** — a yin yoga routine and a kettlebell strength routine confirmed so far, with more planned (carb-loading calculator, pace converter, threshold calculator, hip activation routine). HTML/CSS/JS, fully owned code. Currently living on Claude's own public share links (free, unpaywalled, no login required) — migration to the owned website, with a paywall, is pending.
- **45 five-star GBP reviews** (zero negatives, Sep 2024–Jul 2026) — 10 haven't been published to Instagram. Curated quote bank, gaps (3 English, 0 Portuguese), and deployment plan live in `social-proof-and-reviews.md`. The July 2026 review push produced 7 reviews in 2 days — asking works.

## Current infrastructure (being replaced)

- **Website + CRM + workflows + marketing**: HubSpot, currently free through a personal connection. Retail cost would be ~$800/month for the full stack in use (CRM, website, workflows, sequences, marketing) — not viable at current revenue. After the free access ends, a year of runway exists at roughly a 90% discount, so there's no hard deadline — but every month on the current site is foregone traffic on the Private channel and the lead magnets, which is reason enough to move quickly once time allows.
- **CoachMatch pipeline**: TrainingPeaks emails a lead → a Claude scheduled task creates a HubSpot contact → a HubSpot workflow sends a 3-email sequence → manual WhatsApp follow-up once a phone number is shared. This needs a new home before HubSpot access ends — it's revenue-critical and currently 100% dependent on HubSpot.
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
