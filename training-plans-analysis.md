# Training Plan Sales — Analysis

**Regenerated August 6, 2026** from the full TrainingPeaks sales export (Jan 2023 – Aug 2026). Replaces the original July 18, 2026 analysis, which was never committed and is the reason this file exists — see the note on provenance at the foot.

**Source files, both in `data/` and both de-identified:**
- `plan_sales.csv` — one row per transaction (507 rows). Columns: `plan_id`, `plan_name_at_sale`, `date`, `payment_type`, `amount`, `tax`, `fee`, `earnings`.
- `plan_performance.csv` — one row per plan (396), joining the above to `training_plans_inventory.csv`: language, sport, distance, difficulty, weeks, price, published flag, all-time units/gross/earnings, first and last sale date.

**What was deliberately stripped before committing:** `SoldToName` (507 values), `SoldToEmail` (251 values), `OwnerPersonId`, `SoldToAllowMarketingEmails`. Same rule as the 2,073-contact HubSpot export — customer PII does not go into a git repo, and nothing in the analysis below needs it. The raw export stays outside the repo, wherever Iván keeps it.

---

## 1. The headline numbers

| | all time (Jan 2023 – Aug 7 2026) |
|---|---|
| Transactions | 507 (504 sales, 3 credits) |
| Gross | $20,896.57 |
| TrainingPeaks fees | $6,133.58 |
| **Earnings** | **$14,333.54** (69% of gross) |
| Average sale | $41.22 gross |

*Supersedes the July 18 figures (499 units, $20,549 gross, $14,095 earnings) — the difference is three weeks of additional sales, not a restatement.*

## 2. Growth — and it is real

| year | units | gross | earnings | avg sale |
|---|---|---|---|---|
| 2023 | 57 | $1,213 | $831 | $21.3 |
| 2024 | 160 | $5,564 | $3,834 | $34.8 |
| 2025 | 170 | $8,276 | $5,665 | $48.7 |
| **2026** (7 months) | **119** | **$5,812** | **$3,973** | **$48.8** |

Two things worth separating. **Volume has plateaued** — 160 → 170 → a 2026 pace of ~204, respectable but not a step change. **Price has more than doubled**, $21.3 to $48.8, and that is where the revenue growth actually came from. 2026 tracks to roughly $6,800 earnings, which would be the best year, on flat-ish unit volume.

The implication for the storefront: the lever that has been working is *price and mix*, not traffic. All-Access at $39.99/mo is the natural continuation of that trend, not a departure from it.

## 3. Race-stamped plans — the question this file was regenerated to settle

**19 units, $599 earnings, across three and a half years.** That is 3.7% of units and 4.2% of earnings.

| race | 2023 | 2024 | 2025 | 2026 | total |
|---|---|---|---|---|---|
| London | — | 3u $83 | — | 1u $42 | **4u $125** |
| Rio | — | 1u $14 | 1u $27 | 3u $80 | 5u $120 |
| Tokyo | — | 2u $67 | 1u $34 | — | 3u $101 |
| Santiago | — | — | 2u $96 | — | 2u $96 |
| Berlin | — | 1u $28 | 1u $30 | — | 2u $58 |
| Barcelona | — | — | 1u $35 | — | 1u $35 |
| Chicago | — | — | 1u $34 | — | 1u $34 |
| Boston | — | — | 1u $30 | — | 1u $30 |

Iván's recollection was correct — London and Tokyo *did* sell. The magnitude is what settles it. **The best race in the best year is London 2024: three units, $83.** The decision rule agreed in `open-loops.md` was "≥10 units or ≥$300 earnings per edition, in 2 of the last 3 years." Nothing comes within an order of magnitude, in any year.

Against a build cost of 18 variants per race (2 durations × 3 volume tiers × 3 languages), for pace only. London earns about **$42 a year**.

**Decision: do not republish. The race-stamped plan model is retired permanently.** Race demand is served by evergreen race landing pages joining the generic marathon plans. This closes the November 1 decision three months early.

## 4. The long tail is half the catalogue

- 303 published plans; **152 have never sold once (50%)** *(recomputed Aug 10, 2026 after the two EN full-distance Ironman plans were confirmed live and flagged `TRUE`; was 301 / 150, same 50%. Recomputed Aug 8, 2026 after the Rio 2026 plan was unpublished; was 302 / 151.)*
- Top 20 plans = **$5,959 of $14,334 — 42% of all earnings**
- 178 plans have ever sold; 218 never have

Consistent with the July 18 finding (55%) and not improving. The storefront's "enrichment effort only on plans with proven views/sales, long tail gets auto-generated pages" rule is the right response and is now implemented — every plan page is generated, so the tail costs nothing to carry.

## 5. Return per plan built — the finding that should change what gets built next

| sport | units | earnings | published plans | **earnings per plan built** |
|---|---|---|---|---|
| **Duathlon** | 47 | $1,819 | **15** | **$121** |
| Strength | 6 | $140 | 2 | $70 |
| Triathlon | 99 | $3,374 | 51 | $66 |
| Swimming | 80 | $1,638 | 40 | $41 |
| Running | 195 | $5,001 | 135 | $37 |
| **Cycling** | 57 | $1,769 | **60** | **$29** |

*Updated Aug 10, 2026 — Triathlon's published count went 49 → 51 and its return per plan $69 → $66, after `442088` and `439815` were confirmed live on TrainingPeaks and their stale `is_published=FALSE` flags corrected. Both have sold zero units, so the numerator is unchanged; only the denominator moved. No other row changes. `data/plan_performance.csv` also carried a stale `is_published=TRUE` for `612978` (the Rio plan unpublished Aug 8) — corrected in the same pass, so the inventory and performance files now agree at 303 published.*

Running earns the most in absolute terms and should keep its catalogue. But the build-effort question is different: **Cycling has 60 published plans returning $29 each, while Duathlon has 15 returning $121 each** — four times the return on a quarter of the inventory. Duathlon is the most under-built category in the catalogue and nobody had noticed, because it is small in absolute revenue.

Note this does not contradict building the Ciclismo hub page (Aug 6) — 60 plans genuinely need a door. It argues against building *more cycling plans*.

## 6. Language

| language | units | earnings | share |
|---|---|---|---|
| Spanish | 279 | $8,062 | 58.7% |
| English | 176 | $4,981 | 36.3% |
| Portuguese | 29 | $698 | 5.1% |

Portuguese confirms the July 18 read exactly: ~17% of build effort, 5% of revenue. The three thin PT hub pages shipped Aug 6 are the cheap test of whether that ratio can move; they cost an afternoon rather than a translation programme.

## 7. Seasonality

| Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **58** | 31 | 49 | 49 | 50 | **55** | 35 | 39 | 32 | **26** | 38 | 44 |

January and June peak, October troughs — confirms the earlier read. January is New Year resolutions (and why the weight-loss line sells); June is the southern-hemisphere off-season build and the northern race run-up. **Content and promotion should lead these by 4–8 weeks**, i.e. November–December and April–May, not during the peak itself.

## 8. Email capture — and a decline that needs explaining

*Corrected August 6, 2026, same day. This section first read "0 of 507 buyers opted into marketing," taken from `SoldToAllowMarketingEmails`, which is FALSE on every row. That column is not the opt-in signal. **The real signal is whether the buyer shared an email at all** — 251 of 507 did, and Iván created a HubSpot contact for each and nurtured them. The original claim was wrong and would have justified work that isn't needed.*

**251 of 507 buyers (49.5%) shared an email.** The rate has fallen over time:

| year | shared an email | rate |
|---|---|---|
| 2023 | 34 / 57 | 59.6% |
| 2024 | 94 / 160 | 58.8% |
| 2025 | 87 / 170 | 51.2% |
| **2026** | **35 / 119** | **29.4%** |

**This is a fact, not a problem, and there is nothing to do about it.** *(Framing set by Iván, Aug 8, 2026, replacing an earlier read that called it "a halving in two years, and nobody was watching it" and asked for the cause to be investigated.)* The decline is entirely TrainingPeaks' — it's their checkout, their consent flow, their prompt placement, and Iván is an SMB seller with no account manager to escalate to. He does not control this lever and cannot influence it. Nothing should be built, escalated or worried about on account of it.

**What it does mean, and this is the only actionable read:** the channel that used to supply half his buyers' contacts now supplies under a third, and that share will keep drifting wherever TrainingPeaks puts it. **The site's own capture form is therefore the durable channel, not a supplement** — which is exactly what shipped on Aug 6. Every future contact worth having is one the business captures itself.

## 9. Repeat purchase — small, and clustered at plan length

Among the 235 identifiable customers:

- **15 bought more than once (6.4%)** — 31 units, $657 earnings
- **Median gap between purchases: 72 days**

72 days is about ten weeks — roughly the length of the block they just finished. Buyers who come back come back *when their plan ends*, which is the whole basis for the timed re-targeting idea below. The 6.4% is close to the 8% quoted in the storefront brief and confirms the pattern: a plan buyer is, today, close to a one-time customer.

## 10. The re-targeting opportunity, sized

Joining buyers-with-email to the plan length they bought (237 purchases, 235 unique people), and asking when each plan *ends*:

| | buyers |
|---|---|
| Still training (>4 weeks to go) | 8 |
| **Finishing in the next 4 weeks** | **3** |
| Finished in the last 3 months | 14 |
| Finished 3–12 months ago | 60 |
| Finished over a year ago | 152 |

The live pipeline is thin — 11 people currently training or about to finish — because capture has fallen and volume is flat. **The value is in the back catalogue: 74 people finished a plan within the last year and were never asked what came next.** At the current $48.8 average sale, converting even 10% of those is ~$360 gross; the mechanism, once built, then runs forever on every future buyer.

Most plans bought are 8, 12 or 16 weeks (56, 46 and 66 units respectively), so a single rule — *contact at plan length minus one week* — covers the bulk of the catalogue without per-plan configuration.

---

## 11. Sales as an independent check on `is_published` (August 12, 2026)

The `is_published` flag has been confirmed stale four times in a week and every one of those was found by hand. The reason no check caught them is worth stating precisely, because it is a method problem and not an attention problem: **`automation/check-plan-links.py` skipped every row where `is_published != TRUE`.** The flag was the checker's input filter, so its output could only ever confirm the TRUE set. Three of the four known cases were FALSE-but-live, which that script structurally could not see. *(Fixed the same day — `--audit` mode now checks unpublished plans too and reports disagreements in both directions.)*

**`plan_sales.csv` is the independent source the audit was missing.** Transactions come from TrainingPeaks payouts, not from the inventory, so they are not derived from the thing being tested. That gives a one-line assertion with no network calls behind it:

> **A plan cannot have sold without having been published at the time of the sale.** So `is_published = FALSE` combined with a recent sale is not a candidate for review — it is a contradiction.

Run against the full catalogue, 12 plans are flagged FALSE and carry sales. Seven are race-dated for 2026 races already run (Tokyo, London, Barcelona) and are correctly retired. **The other five are not, and they are all Portuguese triathlon:**

| plan_id | plan | units | earnings | last sale |
|---|---|---|---|---|
| 567302 | Triathlon Sprint, 12 wk, Iniciante | 1 | $16.80 | **2026-07-30** |
| 567303 | Triathlon Olímpico, 16 wk, Iniciante | 3 | $67.20 | **2026-07-23** |
| 567560 | Triatlo Olímpico, polarizado | 1 | $26.60 | 2026-06-22 |
| 567305 | Distância Completa, 21 wk, Iniciante | 3 | $88.20 | 2026-06-10 |
| 567304 | Média Distância, 18 wk, Iniciante | 2 | $50.40 | 2026-05-27 |

A sale thirteen days ago is not a stale record. **A sixth plan, `567561` (Olímpico 19 wk, Avançado), has no sales but sits in the same family and the same FALSE state** — it completes the ladder, and it is the one a zero-sales rule would miss. Same for `567564`, its Spanish sibling.

**Why this matters more than five plans normally would:** Portuguese publishes **29** plans. These six take it to 35, a 21% increase in the thinnest catalogue, and they are the entire PT beginner triathlon ladder — Sprint 12 wk → Olympic 16 wk → Middle 18 wk → Full 21 wk, plus the advanced Olympic. That is a complete distance progression currently invisible on the site, in the language where §6 shows the least inventory. *(These are the "PT triathlon siblings" already named in `open-loops.md` as one of the four confirmed staleness cases — they were identified and never actually flipped.)*

**The remaining 21 unpublished non-race plans have zero sales all-time** and are genuinely ambiguous: built-and-never-published and published-then-retired look identical from here. They need the link check, not this one.

**Standing method, now that it exists:** before spending eight minutes crawling TrainingPeaks, run the sales join. It is instant, it needs no network, and it produces near-certainty rather than evidence — a live URL only shows a page resolves, whereas a sale shows money changed hands.

### Outcome, same day — the catalogue was understated by 24 plans

Iván checked the unpublished set against TrainingPeaks directly and confirmed **24 plans were live all along**. Flipped in both CSVs. **The catalogue is 303 → 327 (ES 164 / EN 111 / PT 52).**

**Portuguese went 29 → 52, up 79%.** Every doc in this repo has described PT as the thin catalogue — §6 below, the three-thin-PT-hubs probe, the "PT is a marathon-only play" conclusion in the race-page longlist. **That premise was an artefact of a wrong flag, not a fact about the business**, and anything resting on it needs re-reading before it is acted on. The PT hub pages in particular shipped "deliberately under-stocked as a demand probe" against inventory that was not actually missing.

**Denominators that moved with it — §5 recomputed at 327 published:**

| sport | plans | per published plan |
|---|---|---|
| Duathlon | 19 | **$96** |
| Strength | 2 | $70 |
| Triathlon | 58 | $58 |
| Swimming | 40 | $41 |
| Running | 142 | $33 |
| Cycling | 66 | **$27** |

*The §5 ranking is unchanged and its conclusion survives: Duathlon still returns roughly 3.5× Cycling per plan built. But every absolute figure in §5 was computed on 303 and is now low — Duathlon reads $121 there and is $96 here. Never-sold among published is 171/327 = **52%**, up from 50%, which is arithmetic rather than news: 24 plans were added and only 5 of them had ever sold.*

**One plan was deliberately NOT published: `567564`.** Iván flagged it as "really 480116" — and `480116` is a separate inventory row that is already published, already carries 10 sales / $436, and holds the same TrainingPeaks link. So `567564` is a duplicate row for a plan that is already in the catalogue, not a missing plan. Publishing it would have put two cards on the site pointing at one purchase page, under two different names, and split its pixel analytics across two `plan_id`s. **Left `FALSE`; it should be retired from the inventory rather than fixed.**

## Provenance, and why this file is here

The July 18, 2026 analysis and its `plan_performance.csv` were named as companion files by the (now retired) `plan-storefront-project-brief.md` but were never committed. Every "what sells / what doesn't" claim in that brief — including the one used on August 6 to retire 17 race-stamped plans — rested on data nobody could re-check. Both are now regenerated from the source export and committed. **Standing rule: any figure quoted in the storefront brief must be reproducible from a file in `data/`.**
