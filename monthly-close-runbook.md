# Monthly Close — Runbook

**Created August 12, 2026.** Home doc for the monthly reporting rhythm: what gets measured, where each number comes from, what it costs to produce, and what the close is allowed to conclude.

**First close: August 2026, run on September 1–2.** *(This satisfies the "formalise by end of August" trigger in `open-loops.md` NEXT.)*

---

## 1. What this doc is, and the problem it exists to fix

Every point-in-time figure about this business currently lives as a **snapshot inside a narrative document**, and the narrative document is never dated the same way twice. That produces two failures the repo has already hit:

**(a) Two docs measuring the same thing in different tenses can never agree.** `triaperformance-business-overview.md` §Revenue streams is a June snapshot (30 CoachMatch / 5 Private). `data/athlete_tenure.csv` is a full history and puts 40 active on June 30. Both are honest; they disagree because one is a photograph and the other is a film, and **nothing in the repo holds a series of photographs**. That reconciliation is still open, and it is exactly the gap a monthly close closes — not by arguing, but by producing a dated file every month until the disagreement has nowhere to hide.

**(b) A single good month becomes the run rate.** `triaperformance-business-overview.md` currently states passive plans at **$847/mo**. That figure is June 2026's earnings to the cent ($846.81 — the best month in the file). **July was $301.63, on 9 units against June's 23.** Nobody typed a wrong number; a snapshot was taken on a peak and then quoted as a rate for two months. *A monthly close with a trailing-3-month column alongside the month makes this specific mistake structurally impossible.*

### What this doc owns

**This doc owns the process. The dated files own the numbers.** Once the first two closes exist, `monthly-close/YYYY-MM.md` is the owner of every point-in-time business figure for that month, and every other document **points at it rather than restating it**.

That is a deliberate change to the hygiene rule, and it is the point of the whole exercise: today the repo's answer to "one home per figure" is to nominate a narrative doc as owner and correct it in place whenever the number moves. It has moved five times in six days for the catalogue count alone. **A dated file per month replaces maintenance with accumulation** — you never correct last month, you just write this month.

### What it does not own

- **Tenure, churn and retention method** — `tenure-analysis.md`. The close *feeds* it (one row per athlete per month) and quotes it; it does not redefine it.
- **Plan sales history** — `training-plans-analysis.md`, sourced from `data/plan_sales.csv`. The close appends a month; the analysis owns the read.
- **Prices** — `triaperformance-pricing-and-positioning.md`.
- **Open items** — `open-loops.md`. The close *produces* items; it does not keep its own list. **There is no "monthly close action list."** That is how a second competing list gets born.

---

## 2. Artifacts — what a close produces

Four files per month, three data + one narrative. All dated, all committed, none ever edited after the following month's close is written.

```
data/monthly_close/2026-08-roster.csv     one row per paying athlete
data/monthly_close/2026-08-pnl.csv        one row per money line
data/monthly_close/2026-08-metrics.csv    one row per non-money metric
monthly-close/2026-08.md                  the read: what moved, why, one decision
```

### 2.1 `roster.csv` — the book, as it stood at month end

`athlete_id, source, channel, monthly_rate, commission_pct, net, first_month, status`

- **`athlete_id`** uses the **same derivation as `data/athlete_tenure.csv`** — `'A' + sha256(normalised_name)[:8]`, lowercased, accents stripped, whitespace collapsed. Not a new id scheme. This is what makes the two files join for free, and what lets a returning athlete's second period land on the same id as their first. **No names in the repo**, same standing rule as every other export.
- **`monthly_rate` is the point of the file, not a nice-to-have.** `tenure-analysis.md` §3's revenue view is currently *modelled from a price ladder*. This column turns it into a measurement. Without it the close is just a headcount, and headcount is the number that has already misled once — the book is **−30% in heads but −21% in MRR**, because $75–99 athletes are leaving and $149 athletes are arriving.
- **`status`** — `active` / `new` / `churned` / `paused`. Paused is not churned and the distinction has bitten already (Fernando Alva's two billing periods).
- **`first_month`** makes cohort retention computable directly off the close files, without re-deriving from `athlete_tenure.csv`.

**Definition, which must be fixed once and never drift: a paying athlete is one whose payment for that service month has cleared by month end.** Not "has an active TrainingPeaks record", not "has a Twenty Person marked customer". Write the rule here the first time an edge case appears, rather than deciding it fresh each month.

### 2.2 `pnl.csv` — the profit and loss

`line, category, gross, platform_fee, net, source, note`

**This does not exist today in any form. Costs have never been totalled.** Building the first one is the largest single piece of Month 0 work (§6).

**Revenue lines** — gross, platform take, and net stated separately on every line, because the blended take rate is itself a strategic figure. It is the entire argument for the parked **direct checkout** item, and there is currently no number attached to it.

| Line | Gross source | Platform take |
|---|---|---|
| CoachMatch coaching | roster.csv | 20% to TrainingPeaks |
| Private coaching | roster.csv | 3.5% via TP Payments |
| Plan sales | `data/plan_sales.csv` | **~29%** measured, not the headline rate — see below |
| All-Access | roster.csv | 3.5% + $9/subscriber |

> **On the plan take rate: use the measured one.** `fee ÷ amount` in `plan_sales.csv` has run **28.6%–29.7% every month since Dec 2025** and 31.4% lifetime ($20,897 gross → $14,334 earnings). It is stable enough to trust and it is not a number anyone would guess from the marketplace terms. Compute it monthly rather than assuming it — a change in it is a TrainingPeaks pricing change, which is material and would otherwise go unnoticed.

**Cost lines** — the categories, so that the Month 0 inventory has somewhere to land:

| Category | What belongs here | Notes |
|---|---|---|
| `infrastructure` | Hostinger VPS, domain registration, Google Cloud (BigQuery + the plan-view Cloud Function), any backup storage | Small, fixed, and the easiest to total first |
| `software` | Anthropic/Claude, TrainingPeaks coach account, Loom, design tools, anything on a card | **n8n, Twenty, Caddy, Postgres are self-hosted and cost $0** — list them at zero anyway, so the saving is visible and so a future move to a paid tier shows up as a change rather than a surprise |
| `professional` | KOCH Ventures LLC filing/registered-agent/franchise fees, accounting | Annual or quarterly; amortise monthly rather than spiking one month |
| `contractors` | None today. The **coach hire** and the **nutritionist sign-off** on the weight-loss guide land here | A zero line that is expected to become non-zero is worth carrying |
| `marketing` | $0 today — no paid acquisition | Carry the zero. The guardrail is "don't expand paid acquisition before the CRM catches leads"; a visible zero is what makes the moment it changes a decision rather than a drift |

**Derived lines, computed not entered:** contribution margin (net revenue − platform take is already netted, so this is net revenue − direct costs), operating margin, and **revenue per coaching hour**.

> **Carry an `hours` line even though it is not money.** The entire strategy is *"does this take his time once, to build something durable, or does it take his time forever?"* — and **nothing in this repo measures the denominator.** `tenure-analysis.md` reports revenue per coaching hour up 13% off a modelled hour count. One honest number a month — hours on coaching, hours on build/content — converts the project's central test from a judgement into a measurement. **Estimate it; a rough number monthly beats an exact number never.**

### 2.3 `metrics.csv` — everything that isn't money

`metric, value, unit, period, source, tier, pulled_by`

Flat and boring on purpose. `pulled_by` is `ivan` or the name of the script, which is what makes the automation roadmap (§7) measurable: the close gets cheaper as that column fills with script names.

### 2.4 `monthly-close/YYYY-MM.md` — the read

Short. Four sections, and a hard rule on the last one:

1. **The scoreboard** — this month, last month, trailing 3, same month last year where it exists.
2. **What moved and why** — only the lines that moved beyond noise. At 2–3 signups a month most lines will not.
3. **What we still can't see** — the honest list of things the close wanted and couldn't get. This section is what drives the automation roadmap; delete it and the close silently narrows to whatever is easy to pull.
4. **One decision.** Not a list. **The close's output is exactly one decision, written into `open-loops.md`.** A monthly review that produces seven action items produces zero, and this repo has four consecutive sessions of documented evidence that a list which exceeds its limit stops being read.

---

## 3. The metric inventory

**Tier is the mechanism that keeps this from becoming a two-day job.** At current volume most things do not deserve a monthly read — 2–3 signups a month means a monthly conversion rate is mostly noise, and reporting noise monthly trains you to ignore the report.

### Tier M — monthly, always

| Metric | Source | Automatable? |
|---|---|---|
| Paying athletes at month end, by channel and rate | Iván / TrainingPeaks + Twenty | Partial — Twenty API |
| New signups, churns, pauses | Same | Partial |
| **Net revenue retention** | Computed from two consecutive `roster.csv` | **Yes, from close #2 onward** |
| MRR by channel, gross and net | `roster.csv` | Yes |
| Plan sales: units, gross, fee, earnings, take rate | `data/plan_sales.csv` | **Yes today** — needs the TP payout export appended monthly |
| All-Access subscribers, new and churned | Iván / TP | No |
| **Total operating costs by category** | Mercury / Stripe / card statements | Partial once the inventory exists |
| **Hours worked, coaching vs build** | Iván, estimate | No |
| Leads by source, and closes by source | Twenty | Yes — Twenty REST/GraphQL API |
| GA4: sessions, top landing pages, conversion events | GA4 / BigQuery export | Yes — export already live |
| GBP: views, searches, actions, new reviews | Google Business Profile | Yes — Performance API |
| GSC: impressions, clicks, average position, coverage errors | Search Console | **Not today** — the GSC↔GA4 link is reporting-level only; a real pull needs the Search Console API |
| Ahrefs Webmaster Tools: new warnings only | Ahrefs | No — glance, 5 minutes |
| Members-area access counts (delta) | `psql` on `analytics-postgres` | Yes |
| n8n failed executions | Daily error digest | Yes — rollup of a job that already runs |
| Content shipped: articles, GBP posts, IG posts, tools | Repo + Iván | Partial |
| Catalogue delta: plans added, retired, published | `data/training_plans_inventory.csv` | Yes |

### Tier Q — quarterly

| Metric | Why not monthly |
|---|---|
| Retention by signup cohort at fixed horizons | Cohorts don't move meaningfully in 30 days |
| Earnings per published plan by sport | The build-priority signal (Duathlon $121/plan vs Cycling $29); it changes on the timescale of building plans, not monthly |
| Full SEO audit — structure, canonicals, internal linking | The monthly check is *new warnings only* |
| Clarity session recordings | Qualitative, no export exists, and there is no honest monthly number to extract |
| Instagram: reach, saves, profile clicks | **Blocked** — needs a Business account, an open decision in `content-engine-brief.md` §9. Until then, follower count alone is vanity and gets a quarterly glance, not a monthly row |
| Price-band conversion / elasticity | Needs volume to say anything; the pricing test in `open-loops.md` is the proper home |
| Review inventory and EN/PT gap | `social-proof-and-reviews.md` |

### Tier A — annual

Lifetime value, blended CAC (currently ~$0 — no paid acquisition), full catalogue ROI, and the survival curve rebuild.

### Deliberately not measured

- **Follower counts without reach.** A number that only goes up is not information.
- **Pageviews without a conversion path.** Traffic to a page with no capture is a cost, not a result — and there is currently **no public page that captures an email**, which is an open item, not a metric.
- **Anything with fewer than ~10 events in the month gets reported as a count, never as a rate.** "33% conversion" on 3 leads is a sentence that will get quoted for a year.

---

## 4. What his original list was missing

The starting list — athletes, costs, GA4, GBP, IG, Ahrefs/GSC, leads and sales — is the right skeleton and covers the channels. What it doesn't cover is the handful of numbers that would actually change a decision:

1. **A P&L.** Costs and revenue were listed as separate items. The number that matters is what they do together, and no document in this repo has ever stated a margin.
2. **Net revenue retention.** Free from the second close onward, and nothing measures it today. For a subscription-shaped book it is more informative than churn count, because it prices the mix shift instead of hiding it.
3. **Book composition by rate.** The book is −30% in heads and −21% in MRR because $75–99 legacy athletes are being replaced by $149 ones. **That cushion is self-limiting** — it works only while legacy athletes remain, and ends when the book is all $149. The close should show how many legacy athletes are left, because that number is a countdown.
4. **Break-even signups per month.** Currently **3.4/month at $149 against a run rate of 2–3**. One signup a month is the entire gap between shrinking and growing, and it is the single most decision-relevant figure in the business. It belongs on the scoreboard, not in an analysis doc.
5. **Churn reason.** Iván's own point, and nothing in the data can see it: an athlete completing their goal and resting is not the same event as an athlete leaving dissatisfied, and the current data counts them identically. **Needs a field in Twenty, captured at the time** — it cannot be reconstructed later.
6. **Time-to-close, by source.** ⚠️ **Not computable from existing data, and this is a trap worth naming.** `tenure-analysis.md` §1 establishes that `signup_date` is *the start date the athlete chose*, not the day they agreed — TrainingPeaks lets them pick it. Anyone computing sales-cycle length from it gets a plausible wrong answer. **Needs an `agreementDate` captured in Twenty at the time of the sale.**
7. **Members-area usage.** Of ~35 real athletes with active tokens, **two have ever opened it.** This is the metric that says whether All-Access is a product or a promise, and it moves the moment the announcement goes out — which makes it the cleanest before/after measurement available right now.
8. **Email list size and capture rate.** Currently unmeasurable because there is no public capture page. Carry it as a zero with a note, so the row exists the day the page ships.
9. **Content shipped against the standing promise.** Every All-Access welcome email now promises *"new tools every week."* Nothing counts whether that happened. A promise made at scale with no counter attached is how a business discovers its own credibility gap from a customer.
10. **Review velocity, not review count.** 45 reviews is inventory. *New reviews this month* and *asks made this month* is the process — and the July push produced 7 reviews in 2 days, so the process demonstrably works and demonstrably isn't running.
11. **Infrastructure health.** The n8n error digest already runs daily. A monthly count of failed executions costs nothing and is exactly the shape of signal that would have surfaced the `=UNKNOWN` language-routing leak months before it was found by hand.
12. **Hours.** Covered in §2.2, and repeated here because it is the one the whole strategy is graded against.

---

## 5. The rhythm

**Two sessions, not two days.** The first close will run long because it includes Month 0 setup; steady state should land around **90 minutes of capture plus a 60-minute read**, and should shrink every month as the `pulled_by` column fills with script names.

### Session 1 — Capture (day 1)

**Iván pulls only what nothing else can reach:**

- The month-end athlete roster with rates — from TrainingPeaks and his own spreadsheet
- The TrainingPeaks plan payout export → appended to `data/plan_sales.csv`
- All-Access subscriber count, new and churned
- The month's costs — Mercury, Stripe, card statements
- An hours estimate, coaching vs build
- Screenshots or exports from GBP, Ahrefs and (for now) GSC and IG
- Any churn reasons he knows

**Claude does the rest in the same session:** computes the P&L, the plan-sales month, the roster diff against last month, NRR, the catalogue delta, members-area access counts, the n8n rollup, and writes all four files.

*A capture session is not a discussion. Anything interesting that surfaces gets written down and read tomorrow — otherwise the capture stalls on the first interesting number and the boring ones never get pulled.*

### Session 2 — Read (day 2)

Claude drafts `monthly-close/YYYY-MM.md` against the three data files, and only those files. Iván reviews, corrects, decides.

**Ends with:**
1. The narrative committed.
2. **One decision, written into `open-loops.md`** with its trigger.
3. If the close revealed a number that some other doc restates — update that doc to *point at the close file* rather than carry its own copy. This is the mechanism by which the repo gets smaller over time instead of larger.

### The standing rule this creates

**After close #2, no document states a current business figure. It cites `monthly-close/YYYY-MM.md`.** `triaperformance-business-overview.md` stops being a snapshot and becomes what it should be: a description of the business, with the numbers by reference.

---

## 6. Month 0 — before the August close can work

Five one-time pieces. Four are small; the first is not.

1. **Build the cost inventory.** One pass through Mercury, Stripe and card statements for the last **three** months, not one — three months is what distinguishes a recurring cost from a one-off, and it also gives the first close a comparison instead of a lone data point. Output: the `category` rows of §2.2, populated. **This has never been done and is the reason a margin has never been stated.**

2. **Fix the roster definition.** "Paying athlete at month end" needs a written rule before the first edge case, not after — mid-month pauses, failed payments, and refunds each need an answer. Write it into §2.1 the first time one appears.

3. **Resolve, or explicitly park, the 40-vs-30/5 reconciliation.** `triaperformance-business-overview.md` and `data/athlete_tenure.csv` disagree in opposite directions a month apart, so it is not a constant offset. **The close does not need it resolved to start** — but it does need to state which counting rule it uses, so that closes are consistent with each other even if they are inconsistent with June.

4. **Add two fields to Twenty: `agreementDate` and `churnReason`.** Both are only capturable at the time. Every month without them is a month of history that cannot be reconstructed, which is the strongest possible argument for doing it before the first close rather than after the third.

5. **Pick a canonical name spelling.** `athlete_id` is name-derived. `tenure-analysis.md` already flags one athlete with two valid surname forms — the second form generates a second id and silently splits her into two people across close files. Decide once, before the first roster export.

---

## 7. Automation roadmap

The close should get cheaper every month. Roughly in order of value per hour of build:

| # | What | Status | Note |
|---|---|---|---|
| 1 | **Plan-sales month rollup** | **Buildable today** | `data/plan_sales.csv` already has `date, amount, fee, earnings`. Units, gross, fee, earnings and take rate are one script. Only manual input is appending the TP payout export |
| 2 | **Roster diff + NRR** | **Buildable from close #2** | Two `roster.csv` files in, movement out. No external system needed |
| 3 | **Members-area access delta** | Buildable today | `psql` against `analytics-postgres`. **Query the `token_roster` view, never the table** — the view structurally cannot return a token, which is why it exists |
| 4 | **n8n failure rollup** | Buildable today | The daily error digest already runs; this is a monthly count of it |
| 5 | **Twenty pull** — leads, sources, statuses, closes | Needs the API script | Twenty is Tailscale-bound, self-hosted, REST/GraphQL with an API key. The community MCP server is already parked in `open-loops.md` LATER and would cover this |
| 6 | **GA4 pull** | Needs a query | The BigQuery export is already live and feeding the same GCP project as the plan-view pixel |
| 7 | **GBP pull** | Needs API setup | Business Profile Performance API |
| 8 | **GSC pull** | Needs API setup | The existing GSC↔GA4 link is **reporting-level only — no data flows.** A genuine pull needs the Search Console API separately. Don't assume the link covers it |
| 9 | **Instagram** | **Blocked on a decision** | Needs a Business account (`content-engine-brief.md` §9) |
| — | **Ahrefs, Clarity, costs** | Permanently manual | No export on the current tiers. Keep them small and glance-shaped rather than pretending they'll be automated |

**Standing practice, same as everything else on the box:** any script written for the close lives in `automation/`, is invoked from the repo clone, and is never authored directly on the VPS. If it runs on a cron, the crontab line points into the clone with a `git pull` in front of it.

**And the standing rule that applies to every one of these:** a script that reports a clean result without having looked is worse than no script. The audit-runtime-paths script reported `outside: 0` regardless of what it found, because its counters incremented inside a subshell — **test each of these against a fixture with a known-bad value before trusting a clean run.**

---

## 8. Standing decisions

- **The close produces one decision, not a list.** *(Aug 12, 2026.)*
- **Dated files accumulate; they are never edited after the following close.** A wrong number in a past close gets a dated correction in the *current* close, the same way `ai-infrastructure-documentation.md` handles it. The wrong version is evidence.
- **No names, ever.** `athlete_id` only, same derivation as `data/athlete_tenure.csv`.
- **Every figure in a close is reproducible from a file in `data/monthly_close/`.** Same standing rule as `training-plans-analysis.md` and `tenure-analysis.md`. If it can't be reproduced, it doesn't get stated.
- **Report a count, not a rate, below ~10 events.**
- **The trailing-3-month column is not optional.** It is the specific control against the failure in §1(b).
