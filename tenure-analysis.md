# Athlete Tenure & Retention

**Created August 12, 2026.** Home doc for **every retention, tenure and churn figure** about the 1:1 coaching book. Source: `data/athlete_tenure.csv` — 98 rows, May 2024 → Aug 2026, de-identified.

*Standing rule, same as `training-plans-analysis.md`: any tenure or churn figure quoted anywhere must be reproducible from that file. If it can't be, it doesn't get quoted.*

**What this doc does not own:** revenue and active-athlete counts (`triaperformance-business-overview.md`), prices (`triaperformance-pricing-and-positioning.md`), why athletes leave as a coaching matter (`methodology.md` §2, termination criteria).

---

## 1. The data, and what it isn't

`data/athlete_tenure.csv` — `athlete_id, source, signup_date, churn_date`. Blank churn = active as of the export.

**`athlete_id` is derived from the athlete's name**, not assigned: `'A' + sha256(normalised_name)[:8]`, where normalising means lowercased, accents stripped, whitespace collapsed. **This is deliberate and it matters — a future export produces the same id for the same person**, so a refreshed file reconciles against this one without a name ever entering the repo, and a returning athlete's second period lands on the same id as their first. *(The ids are stable, not secret: anyone with the name list can recompute them. They exist to keep names out of the repo, which is the standing rule, not to anonymise against someone who already has the data.)*

### Three things about this data that change how it reads

**(1) It is one row per billing period, not per athlete — and earlier periods are missing.** *(Iván, Aug 12, 2026, on Fernando Alva: "one of those examples of an athlete that had 2 billing periods… it corresponds to the second billing period.")* No id appears twice in the current export, so **every athlete who paused and came back is present once, with their earlier period simply absent.**

This biases two numbers in known directions and it is worth being precise about which:

- **Tenure is understated.** A returner's total paid months are split, and the earlier split is missing entirely.
- **Churn is overstated.** A "churn" that was followed by a return is a pause, and it is currently counted as a loss with no offsetting re-acquisition.

**Neither bias is small if returns are common, and nobody currently knows how common they are.** It is the one input this analysis is missing — see §6.

**(2) `signup_date` is the start date the *athlete chose*, not the day they paid — and TrainingPeaks lets them choose it.** *(Iván, Aug 12, 2026.)* An athlete can confirm on the 12th, enter their card, and set the start for tomorrow, next Monday, or the last day of the month; TP sends the confirmation with that start date. **The start date is also the delivery anchor** — a service month runs from it, and it is the date churn is measured against.

Cross-checked against the WhatsApp transcripts read the same day: Alfonso agreed Jun 2 and is recorded `2026-06-15`, the start he requested; Rafael paid Aug 4 at 22:49 and is recorded Aug 5; Eliezer was welcomed Apr 22 and is recorded Apr 27. **So this column is exactly right for tenure and revenue, and wrong for anything about the sale — do not use it to compute time-to-close.** *Measuring sales-cycle length needs the agreement date, which exists only in WhatsApp and is not captured anywhere.*

**(3) Churn dates are rounded to the billing anniversary, deliberately.** *(Iván: "when I know when they are churning, I just round to the same date on that churn month — fabricated but true.")* 74% land on the signup's day-of-month for that reason, plus genuine billing-boundary cancellations. **The practical consequence: tenure is accurate to the month, not to the day.** Medians and survival curves are unaffected at this sample size; anything that needs day-level precision does not exist in this data.

### Source-export findings *(reviewed with Iván, Aug 12, 2026 — all resolved)*

| | Status |
|---|---|
| Fernando Alva `2026-02-11 → 2026-06-11`, filed out of chronological order | **Not an error** — a real second billing period. It is the finding that revealed (1) above. |
| Boaz Yonah — signup and churn both `2025-04-22`, zero days | **Real.** Injured immediately and asked for a refund. Genuine zero-tenure row; left in, since removing it would flatter month-1 retention. |
| A name spelled differently here than in that athlete's WhatsApp thread | **Two surnames, both correct.** No action, but **pick one canonical spelling before the next export** — `athlete_id` is name-derived, so the other form generates a second id and the athlete splits in two. |
| Source value `Private` (1 row) alongside `Private - Referral` / `- Website` / `- Ads` | **Left as `Private`, deliberately, after Iván pushed back on reclassifying it.** She is the spouse of a CoachMatch *lead*; every other `Private - Referral` is **a paying athlete referring someone after working with him**. Those are not the same acquisition event and collapsing them would inflate the only baseline the referral program has. **That baseline: 9 referrals from paying athletes in 27 months** (`open-loops.md` NEXT #10). |

---

## 2. Tenure — the headline figures

**Kaplan-Meier, all 98 rows, which is the only method that uses the 37 still-active athletes without pretending they've already left.**

| Figure | Value |
|---|---|
| **Median tenure** | **9.0 months** |
| Mean months over the first 24 | 11.2 |
| *Churned-only median (the naive number — do not use)* | *6.0 months* |

**The naive figure understates median tenure by a third**, because it discards everyone still paying — and the still-paying are, by definition, the long ones. It is the number that falls out of a spreadsheet, so it is the one most likely to be quoted by accident.

**Survival curve:**

| Month | 1 | 2 | 3 | 4 | 6 | 9 | 12 | 18 | 24 |
|---|---|---|---|---|---|---|---|---|---|
| Still active | 98% | 91% | 86% | 77% | 65% | 48% | 39% | 29% | 4% |

Early churn is low: **2% leave inside the first month, 9% inside two, 13% inside three.** Whatever is wrong with retention, it is not that athletes arrive and immediately bounce — they stay a block and then go.

**By channel** — no meaningful difference, and the Private sample is too small to claim one: CoachMatch n=82 (50 churned, median 6.0 months among those); Private n=16 (11 churned, median 6.5). Private is **16% of every athlete ever signed**, and exactly one came from paid ads.

---

## 3. The finding: the book is shrinking, and it isn't only acquisition

**Active athletes have fallen in 5 of the last 6 months — 53 at end of February, 37 today.**

| Month | Signups | Churns | Net | Active at month-end |
|---|---|---|---|---|
| 2026-01 | 7 | 3 | +4 | 48 |
| 2026-02 | 9 | 4 | +5 | **53** |
| 2026-03 | 0 | 3 | −3 | 50 |
| 2026-04 | 5 | **10** | −5 | 45 |
| 2026-05 | 2 | 5 | −3 | 42 |
| 2026-06 | 3 | 5 | −2 | 40 |
| 2026-07 | 2 | 6 | −4 | 36 |
| 2026-08 (to 12th) | 1 | 0 | +1 | 37 |

**26 churns since April 1 against 13 signups.**

**And retention by cohort is degrading, which is the part that isn't explained by slower acquisition:**

| Signup cohort | n | 3 mo | 6 mo | 9 mo | 12 mo |
|---|---|---|---|---|---|
| 2024-H2 | 15 | 100% | 87% | 73% | **73%** |
| 2025-H1 | 27 | 74% | 59% | 41% | 30% |
| 2025-H2 | 25 | 88% | 60% | 41% | **17%** |
| 2026-H1 | 26 | 86% | 55% | — | — |

*Measured at fixed horizons among athletes old enough to have reached them, so a young cohort isn't penalised for being young.*

**Caveats, stated before the conclusion rather than after it:**
- The 2024-H2 cohort is **15 people**. One row moves it 7 points. Treat the top row as suggestive.
- **If returns are common, this table is wrong in the direction of pessimism** — a paused-and-returned athlete is currently counted as churned and never counted as re-acquired.
- The 6-month column degrades much more gently than the 12-month one (87% → 59% → 60% → 55%). The damage is concentrated in **months 6 to 12**, not at the start.

### Cause — answered by Iván, August 12, 2026

**Not the price migration. Attention.** *"Until January 2026 I was working full time at a very easy job. Then in January I got this COO role at a SaaS startup that really affected my deliverability."*

The timing fits without being forced: the role starts in January, the churn wave starts in **April**, roughly one training block later — which is exactly the lag you would expect, because an athlete does not quit the week service thins, they quit when the block they already paid for ends. **This is the strongest available evidence that the weekly ritual is not a nice-to-have but the actual retention mechanism** — it is also what athletes name in reviews (`social-proof-and-reviews.md`: adaptation-to-schedule, 15/38, the most-mentioned theme). A cohort signed during full attention held 73% to twelve months; cohorts signed since hold 17–30%.

*Iván is now full-time on the business, so the natural test is whether the 2026-H2 cohort's 6-month retention recovers toward the 2024-H2 line. First readable ~February 2027.*

**Two qualifiers he added, both fair:**
- **Some churn is success.** An athlete who completes their goal race and rests is a legitimate exit, not a failure, and this data cannot tell that apart from a quit. *That is the third column in §6, and it matters more now that the headline number looks bad.*
- **Acquisition slowing is largely deliberate.** The price went $75 → $89 → $99 → $149; conversion fell with each step. **That is a chosen trade, not a broken funnel** — see the revenue view below, which is the honest way to read it.

### The revenue view — and why headcount overstates the damage

**Iván's correction, and he is right: *"don't look just at logos."*** The athletes leaving are on $75/$89/$99; the ones arriving are on $149.

*Rates are **modelled**, not measured — assigned by signup-date band from Iván's stated price ladder, with the $149 cutover placed between 2026-05-03 and 2026-05-26 (the last six $99 signups and the first seven $149 signups are both confirmed by the WhatsApp transcripts). **Validation: the model independently reproduces the July book in `triaperformance-business-overview.md` — 7 @ $149 and 5 @ $89 exactly, 21 vs 17 at $99, 4 vs 6 at $75.** Close enough to trust the shape; replace it the moment `monthly_rate` is exported.*

| | Feb 28, 2026 | Today | Change |
|---|---|---|---|
| Active athletes | 53 | 37 | **−30%** |
| Estimated MRR | $4,917 | $3,867 | **−21%** |
| Average rate | $93 | $105 | **+13%** |

**So the mix shift absorbs about a third of the headcount loss.** He is right that it is not a 30% problem.

**Where the argument stops working.** *"For every $149 athlete I can lose two at $75"* is true arithmetic and the wrong flow rate:

| Feb–Jul 2026 (6 months) | Heads | Est. MRR |
|---|---|---|
| Signed | 21 (3.5/mo) | +$2,379 |
| Churned | 33 (5.5/mo) | −$3,049 |
| **Net** | **−12** | **−$670** |

**Break-even is 3.4 signups a month at $149**, against a recent run rate of 2–3. The gap is small — one extra signup a month closes it — but it is a gap, and it is on the acquisition side of a business whose acquisition is deliberately getting harder. *The mix shift is also self-limiting: it works because $99 athletes are being replaced by $149 ones, and it stops the month the book is all $149.*

**The other thing headcount understates: hours.** A $149 athlete costs the same weekly hours as a $75 one, so revenue per hour is up 13% and rising. **For a business whose binding constraint is Iván's calendar, that is the number that matters most and it is the only one in this section that is unambiguously good.**

---

## 4. What this settles: the referral reward

The question that produced this analysis (`open-loops.md` NEXT #10).

At **9.0 months median** and **$134.79/month net** on the Private channel, a referred athlete is worth roughly **$1,213**. A **$50 reward is 4.1% of median LTV** — safe by a wide margin, and safe even against the pessimistic churned-only figure (6.2%).

> ***Corrected August 26, 2026.*** *This read* **"$143.79/month net… roughly $1,294… 3.9%… $100 would still sit under 8%."* **Iván now buys TrainingPeaks Premium, at $9/month, for athletes who arrive through the referral program** (`triaperformance-pricing-and-positioning.md` §TrainingPeaks Premium). ~~***Referred athletes only*** *— a Private athlete who found the website still nets $143.79.*~~ 🚨 ***SUPERSEDED September 4, 2026: Premium is included for EVERY Private athlete, so $134.79 is the net on all of them and the referred/not-referred distinction is gone.*** *The figures in this section are unaffected — they were already computed with the $9 in — but the reason has changed: $134.79 is now the standard Private net, not a referral-specific one. Owner: `triaperformance-pricing-and-positioning.md` §TrainingPeaks Premium.* ⚠️ **What DID move: the Private-vs-CoachMatch gap is $15.59, not $24.59, for every athlete rather than just referred ones.** The net rate for this population dropped and every figure derived from it moved with it. **The one claim that did not survive is the last one: $100 is now 8.2% of LTV, not "under 8%."** *Struck rather than quietly re-worded, because it was the sentence that made a larger reward look pre-approved — and it is now marginally outside the band it was asserting.* The $50 decision is unaffected.

Paying on the referred athlete's **second** payment rather than the first protects against the 9% who churn inside two months, which costs nothing since almost nobody leaves in month one anyway.

*Note the direction of the bias: if returners are missing from this file, real LTV is **higher** than $1,213, so the reward is safer than stated, never riskier.*

---

## 5. Reconciliation — explained, and the fix is a process not a correction

**The active-athlete counts here do not match `triaperformance-business-overview.md`:**

| Date | This file | Business overview |
|---|---|---|
| 2026-06-30 | **40** (34 CM / 6 Private) | **35** (30 CM / 5 Private) |
| 2026-07-31 | **31 CoachMatch** | **33 CoachMatch** (July book table) |

**Iván's answer, Aug 12, 2026, and it is the right one:** *"The business-overview was created in June, then July happened and now we are in August. Those numbers are never going to match unless we are in the same month."* The overview holds a **snapshot** that was true when written and drifts every day after; this file is a **history** that can be evaluated at any date. **They are not two measurements of the same thing, and reconciling them is not the fix.**

*(That said, the two disagree in opposite directions a month apart, which pure drift doesn't fully explain — the missing earlier billing periods from §1 are the most likely remainder. Not worth chasing: the process below makes it moot.)*

**The fix — Iván's proposal, to be formalised by end of August 2026:** a **list of paying athletes at every month close**, which makes retention and revenue analysis reproducible month over month and gives every doc a dated figure to point at instead of a copy to maintain. Logged in `open-loops.md`. **The design point that matters: a monthly close file should carry the rate, so §3's revenue view stops being a model.**

**Until then, the ownership split stands:** `triaperformance-business-overview.md` owns the active-athlete count and revenue as a dated snapshot; this doc owns tenure, churn and retention. **Neither should be edited to agree with the other** — a snapshot that gets silently updated to match a history stops being evidence of what was true in June.

---

## 6. What would make this analysis materially better

Three columns, ideally on the monthly close file from §5 rather than as a one-off export:

1. **`monthly_rate`.** **Promoted to first** *(Aug 12, 2026)* — the cause question it was meant to settle has been answered by Iván, but §3's entire revenue view is currently a model built from a price ladder and two transcript-confirmed cutover dates. It reproduces the July book closely, which is reassuring and is not the same as being right. **This is the single column that converts the most important table in this doc from an estimate into a measurement.**
2. **Every billing period as its own row.** The name-derived `athlete_id` handles it with no extra work — a second period lands on the same id automatically. **Still the gap that biases both headline numbers**: tenure understated, churn overstated, because a paused-and-returned athlete is counted as a loss and never as a return.
3. **A churn reason, even three values:** `goal_completed`, `paused`, `left`. **Iván's point that some churn is success is exactly right and this data cannot see it** — an athlete who finishes their race and rests is a different event from one who quits mid-block, and today they are the same row. *This matters more now than it did this morning, because the headline retention number looks bad and some unknown share of it is the service working.*
