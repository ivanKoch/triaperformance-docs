# Referral Program — home doc

**Opened August 26, 2026.** Home doc for the referral program: every standing decision, the offer, the two motions, the attribution model, the payout mechanics and the open questions.

**What this doc owns:** the referral program's decisions. If a referral decision is restated anywhere else, that copy is wrong and gets a pointer here instead.

**What it does not own:**
- **Prices.** Owner is `triaperformance-pricing-and-positioning.md`. Every number below is a copy.
- **The message texts.** Owner is `sales-playbook.md` §B9. This doc owns *when and to whom*; that doc owns *the words*.
- **LTV, tenure and churn figures.** Owner is `tenure-analysis.md`.
- **Twenty field definitions.** Owner is `ai-infrastructure-documentation.md` §11.

---

## 1. The offer

- **$50 Amazon gift card to the referrer**, after the referred athlete's **second payment clears**.
- **`NOSTARTUP`** — the existing $50 startup-fee waiver — for the person referred.
- **Neither reward touches the $149.** That is the design constraint, not a detail. A free month or a monthly discount would breach pricing rules 1 and 2 and set a precedent about the rate. Off-platform is the point.
- Paying on the *second* payment, not the first, means never paying out for a one-month churner. `tenure-analysis.md` §2: 2% churn inside month one, so this costs almost nothing and removes the whole failure mode.

**The economics.** Median tenure 9.0 months at **$134.79/month net** on Private = **~$1,213 LTV**. **$50 is 4.1%.** *(That net is $143.79 less the **$9 TrainingPeaks Premium** Iván buys for referred athletes specifically — a Private athlete arriving any other way nets $143.79 and gets no Premium.)* Owner of those figures: `tenure-analysis.md` §4. *(copy corrected Aug 26, 2026 — the $9 TrainingPeaks Premium inclusion; owner `triaperformance-pricing-and-positioning.md` §TrainingPeaks Premium.)* *The previous line also claimed "$100 would still sit under 8%" — that is now 8.2% and has been struck at the owner, not softened here.*

---

## 2. Two motions, not one *(decided August 26, 2026)*

***The single most important distinction in this doc, and the thing NEXT #10 got wrong.*** It copied the GBP review-ask rules onto something that is not a review ask. **A review needs a result because the review must have content. A referral does not.**

| | **Disclosure** | **The personal ask** |
|---|---|---|
| What | "This program exists, here's how it works" | "¿Tenés a alguien en mente?" |
| Who | Every engaged athlete, any tenure | Best relationships only |
| When | Once. Then part of onboarding forever | After a result — a PR, a race, a clean test |
| Result required | **No** | Yes |
| Frequency | Told once, never repeated | Discretionary |

**Why the split matters.** *"Any time"* is not right either — for a three-week athlete a referral ask is not money in front of them, it is a task, from someone they are still deciding about. Disclosure removes that problem: it is information, not a request, so it costs the relationship nothing at any tenure. The ask stays earned.

**Disclosure is the motion that serves the 60-day acquisition goal** — ~32 messages, sendable in a week.

---

## 3. Timing and channel *(Iván, August 26, 2026)*

**Disclosure goes out on a Monday, after the weekly feedback loops are closed — not as a standalone blast.** Same timing principle Iván already uses for review asks. *The reasoning is his and it is right: 37 messages sent cold on a random day produces 37 athletes asking for something back. Riding the Monday check-in, after their own loop is closed, it lands as "by the way" rather than as an approach.*

**Channel: email + WhatsApp**, both carrying the terms-page link.

**Language: Spanish only for v1.** Cuts the build by two-thirds. *Open: the EN/PT athletes are skipped, and at least one (Nadine) is a full-price engaged athlete — decide whether she gets a hand-written English version.*

---

## 4. The founding-member framing *(decided August 26, 2026 — supersedes `sales-playbook.md` B9)*

**The disclosure message states the $149 rate and an unconditional guarantee that the athlete's own rate never moves.** B9 previously said the opposite — *"do not bundle the ask with 'you're on a legacy rate'"* — on the grounds that it converts a gift into a comparison and prompts *"is he about to raise my rate?"*

**Three reasons that objection does not survive contact with the actual message:**

1. **The referral is unintelligible without the price.** "$50 startup fee waived" means nothing to someone who does not know there is a $50 startup fee and a $149 rate. The offer requires the number.
2. **"Founding member" inverts the valence.** B9 imagined *"you pay a discount, full price is 149"* — which does read as a setup. Iván's framing is *"you are a founding member, your rate is locked, here is what a new athlete pays."* Same facts, opposite feeling. **The word is doing the work.**
3. **B9 had the retention effect backwards.** Pricing rule 5 makes a pause expensive (return at $149). An athlete who knows the market rate is double has a *reason not to let it lapse*. Against the retention numbers in `tenure-analysis.md` §3, that may be worth more than the referral half of the message.

**Three drafting rules, and they are load-bearing:**

1. ~~**Guarantee before number.**~~ ***Replaced August 26, 2026 — the rule is: do not raise the athlete's rate at all, in either direction.*** *The original rule said to lead with "tu tarifa no se toca, nunca" and then state $149. **Iván rejected the draft built on it — "so defensive it's unnatural" — and he was right.** A reassurance is only needed where a threat has been raised, so writing one **creates** the comparison B9 was afraid of; the athlete had no reason to think about their rate until the message supplied one.* **What works instead: state $149 as a fact about *new* athletes and say nothing about the reader's rate.** The market price is information the offer requires; the reader's own price is never mentioned, so there is nothing to reassure them about. *Kept as a struck rule rather than deleted, because the failure mode is subtle and inviting: the defensive version reads as considerate while doing the exact damage it is guarding against.*
2. **Never the word "descuento."** They are founding members, not discounted athletes.
3. **State the guarantee simply — do not explain the pause clause.** If an athlete asks what happens if they pause, answer straight. Volunteering it turns a promise into fine print.

***A structural safeguard, found by accident and worth keeping:*** the 32 legacy athletes are a mix of $75 / $89 / $99. **One message to all of them therefore cannot state any athlete's own rate — it can only state $149.** The thing B9 was most afraid of is prevented by the send list, not by discipline.

---

## 5. Attribution

`leadSource: REFERRAL` already exists on Twenty's Person (six values, confirmed Aug 8, 2026). **Who referred whom did not.** Two new fields:

| Field | Type | Notes |
|---|---|---|
| `referredBy` | Relation, **Belongs to one**, Person → Person. Reverse field `referrals` | The reverse field gives "Ronald has sent 4" for free. Fallback if the self-relation misbehaves: plain text holding the referrer's email — the reminder query is unaffected. |
| `referralRewardSentDate` | Date, `YYYY-MM-DD` | Empty = payout owed. **Lives on the *referred* athlete's record, not the referrer's** — one payout per referred athlete, so it belongs on the row that represents the payout. On the referrer, a second referral would overwrite the first. |

**Label these in English.** Twenty derives the API name from the label; a Spanish label yields `referidoPor` and silently matches nothing in n8n. Consistent with `coachingStartDate`, `churnDate`, `leadSource`.

**No `?ref=` URL system, no sign-up page** *(decided Aug 26, 2026)*. At ~1 referral/month it is over-built, and Iván handles every referral conversation by WhatsApp anyway.

---

## 6. Payout mechanics

**TrainingPeaks sends the coach no recurring-payment email** *(confirmed by Iván, Aug 26, 2026 — this closes the open question NEXT #10 raised and could not answer).* So the trigger is a date calculation, verified by hand against the TP payments list.

**The reminder query:**

```
referredBy              is set
referralRewardSentDate  is empty
churnDate               is empty
COALESCE(coachingStartDate, signUpDate) <= today - 35 days
COALESCE(coachingStartDate, signUpDate) >= 2026-09-01     <- program floor
```

***Both COALESCE lines were added August 26, 2026, after running the query against live data, and each fixes a defect the query had as originally written.***

**The floor date is the more important of the two.** Without it, the query pays out on **every referral ever recorded**, because attributing a historical referral in Twenty is indistinguishable from a new one. *This is not hypothetical: the first two rows ever created — Ferenz Feher's two referrals, signed up February 2026 — were immediately payout-eligible under the query as first written.* **The floor lets historical referrals be attributed freely** — which is what builds the `referrals` counts behind the founding-member story — **without any of them triggering money.** Retroactive payments become deliberate, named, hand-made exceptions, which is the only way they should ever happen.

*It also removes the need for a payout-status enum a second time: "attributed but not owed" is now expressed by the floor rather than by a field somebody has to remember to set.*

**Weekly, not daily.** When the second payment has not cleared yet, Iván does nothing, and a daily job would nag every morning until it did.

**Built as `automation/referral-payout-reminder.json`** *(Aug 26, 2026)* — schedule → Config → paginated Twenty fetch → Code (`Run Once for All Items`) → Telegram. **n8n is the live source; the repo file is documentation.**

> ***The first payout that can physically exist is October 6, 2026*** — floor (Sep 1) + 35 days. **Between now and then the reminder correctly sends nothing, and that is not a fault.** *Found by a fixture test whose first run "failed": every relative date it generated landed before the floor, because today is August. The code was right and the test was wrong, which is the cheaper way round to discover it.*

**Two guards, both because a silent under-report is worse than no report** (the `audit-runtime-paths.sh` lesson):
1. **Fewer than `MIN_EXPECTED_PEOPLE` (200) fetched → a loud Telegram alert instead of a payout list.** If pagination breaks, the node sees page 1 only and would otherwise report "nothing due" — indistinguishable from a quiet week.
2. **Attributed referrals with no start date at all are reported separately**, not dropped. They cannot be evaluated either way, and silently skipping them is how a payout goes missing.

*Verified against a fixture before deployment — 11 cases: due / already paid / churned / too recent / before floor / `signUpDate` fallback / exactly on the floor / not referred / undated / quiet week / truncated fetch.*

**Three details that are easy to get wrong:**

1. **35 days, not 60.** Payment 1 lands on the start date, payment 2 thirty days later, plus a few days to clear. Sixty days pays out a month late, every time.
2. **`coachingStartDate`, not `signUpDate`.** Person carries three date fields. A CoachMatch athlete can sign up in August and start in September, and TP bills from the start date — that is the mechanism behind `sales-playbook.md` A5b. Keyed to `signUpDate`, the reminder fires before the athlete has paid twice.
3. **`coachingStartDate` is null for the whole pre-August book** — the field was created Aug 8, 2026, after the backfill that created those records. A query keyed on it alone silently skips every existing athlete and reports zero, which reads exactly like "no payouts due." *New referrals are unaffected — the onboarding chain writes both fields — but the failure mode is silent, so COALESCE anyway.*
4. **No payout-status enum.** `churnDate` already exists and is already written by the subscription-lifecycle workflow, so an athlete who leaves before month two drops out of the queue automatically. *Note `leadStatus: CHURNED_CUSTOMER` is **not** usable for this — nothing writes it (`ai-infrastructure-documentation.md` §11), so a churned athlete still reads as `WON_CUSTOMER`.*

---

## 7. Buying the gift card

**Manual, deliberately.** ~12 payouts a year. A rewards platform (Tremendous and similar) would add a fee and an account for something that takes ten minutes a month, and Venezuela is prohibited on those platforms anyway.

**Amazon works for effectively the whole book, but not with one card.** Gift cards are marketplace-locked — a `amazon.com` balance cannot be redeemed on `amazon.com.mx` or `amazon.es`. The lock only bites where the athlete shops a *different* marketplace, and most of Latin America has no local Amazon, so they already shop `amazon.com`.

| Athlete in | Buy |
|---|---|
| Argentina, Colombia, Peru, Chile, Ecuador, Uruguay, Costa Rica, Caribbean, US | `amazon.com` — USD |
| Mexico | `amazon.com.mx` — MXN |
| Spain | `amazon.es` — EUR |

*Venezuela has no Amazon marketplace and is blocked on the rewards platforms. No Venezuelan athletes on the book as of Aug 26, 2026 — handle by hand if one arrives.*

**Why not cash.** A $50 transfer to a $149 athlete is a third of their month refunded, which is exactly the link pricing rule 1 exists to prevent. A gift card breaks it. **Never account credit.**

---

## 8. Standing decisions

1. **Two motions, not one.** Disclosure to all engaged athletes; the personal ask stays earned. §2.
2. **Referral and review asks are separate lists** *(Iván, Aug 26, 2026 — supersedes NEXT #10's "build one list, not two")*. **That argument is now void, not overruled:** it assumed both asks shared eligibility criteria. They no longer do — referral is "engaged, any tenure," review is "after a result." Different queries, different channels, different cadence. Merging them today would be the mistake.
3. **The founding-member framing.** §4. Do not re-raise B9's "do not mention the rate."
4. **The forwardable blurb carries the Private checkout link — never "búscame en TrainingPeaks."** *(Added Aug 26, 2026, from live data.)* **A referral that lands through CoachMatch costs 20% instead of 3.5%**, which drops the referred athlete's LTV from ~$1,213 to ~$1,073 *(copy corrected Aug 26, 2026 — the $9 TrainingPeaks Premium inclusion; owner `triaperformance-pricing-and-positioning.md` §TrainingPeaks Premium.)* and means paying TrainingPeaks ~$30/month to broker a lead the business generated itself. ***This already happened:*** both of Ferenz Feher's referrals carry `leadSource: COACHMATCH` — *Iván's own note, Aug 26: he wanted to offer them the same deal, they went through CoachMatch, and the 20% has been paid every month since.* **The program's whole margin case is that referrals feed Private** (`triaperformance-pricing-and-positioning.md`: Private is the priority channel at +$24.59/month). A blurb without a checkout link quietly routes them to the expensive channel.
   ***Amended August 26, 2026 — the blurb now routes to WhatsApp (`https://wa.me/573105437088`), not to a checkout.*** *Ivan's call, and it is the better design: it dissolved a blocker (the Private 1:1 checkout URL exists nowhere in this repo — only the three All-Access URLs do, so the blurb was one paste away from shipping an unfilled variable) and it improves attribution, since he hears who referred them in the athlete's own words instead of inferring it from a link.* **But it moves the channel decision out of the link and into his memory.** A checkout URL routed to Private mechanically; a conversation routes wherever he sends it. ***So the rule survives, restated: every referred lead closes on the Private checkout, never the CoachMatch profile link.*** The 20% is now a discipline, not a mechanism.
5. **Historical referrals are attributed but never paid. No exceptions.** *(Iván, Aug 26, 2026, asked directly about the first real case.)* **"Ferenz does not get the 100 and no one gets paid for referrals before the program."** The program starts Sept 1, 2026; nothing before it earns money. *The case for paying him was real — two referrals, ~$1,030 net delivered, neither churned, the exact founding-member archetype, and the disclosure message would have landed harder with a real payout behind it — and it was declined. Recorded here rather than argued again.*
   ***The value of attributing historical referrals anyway is the `referrals` count***, which is what makes "this athlete has sent me three people" a fact rather than a memory. The floor in §6 enforces the no-payment half mechanically, so attribution stays free. **Liby and Karen Feher need no action** — the floor excludes them permanently, and `referralRewardSentDate` should stay empty, since it means *reward sent* and no reward was.
6. **`excludeFromSequence` does not gate disclosure.** It means "no all-purpose emails" (Iván, Aug 26); disclosure is a personal message on the Monday check-in, not a campaign. *Revisit if it is ever split into per-purpose booleans.*
7. **The $75 athletes are paid twice, and that is correct** *(Iván, Aug 26, 2026)*. Several athletes sit at $75 after long tenure; the rate is earned and so is the $50. **That is the definition of a founding member.** Written into `triaperformance-pricing-and-positioning.md` §The referral-rate exception, which owns it.
8. **Manual payout, manual tracking, no automation beyond the reminder.** §6, §7.
9. **Spanish only for v1.** §3.

---

## 9. What this can realistically produce

**Stated so it is not later mistaken for failure.** Baseline is **9 referrals in 27 months with zero asks ever made** — 0.33/month unprompted. Disclosure to ~32 engaged athletes, over 60 days, plausibly yields **3–6 referred leads and 2–4 signups**.

**That is a good result, and it closes the gap that matters:** `tenure-analysis.md` §3 puts break-even at 3.4 signups/month against a run rate of 2–3. Two to four over two months closes it.

**It will not replace CoachMatch, and it has a lag CoachMatch does not** — the referrer needs someone in mind, and that person needs to be in a training decision. *Iván's stated intent (Aug 26, 2026) is to make this the main channel for two months while CoachMatch is soft and the SEO build matures. Treat it as the thing that closes the one-signup-a-month gap, not as the channel carrying acquisition.* **Planning for 10 reads as failure at 4, and 4 is a good outcome.**

*For raw volume inside the same window, the honest comparison is the 2,073 legacy contacts in `open-loops.md` NEXT #3 — ungated since Aug 6, audience already exported.*

---

## 10. Open

- [ ] `referredBy` created in Twenty and confirmed by a real API response (not the Data Model screen). `referralRewardSentDate` created Aug 26, 2026.
- [x] ~~The four Spanish messages~~ **DONE Aug 26, 2026 — five, not four.** `sales-playbook.md` B9a (disclosure, two variants), B9b (forwardable blurb), B9c (warm inbound reply), B9d (payout), **B9e (the referral that did not convert)** — the fifth was missing from the plan: the terms said *si cancela antes, no hay pago* and nothing said who tells the referrer. *Silence after a favour is the expensive failure, not the no.* **The forwardable blurb is the highest-leverage piece** — B9 tells the athlete to *"pásame el contacto o pásale el mío"* and hands them nothing to paste.
- [ ] Terms landing page — Spanish, `noindex`, off nav and out of `sitemap.xml`. Framed as *"cómo funciona"* for athletes already told, **not as a public offer.** *A published program is one you can no longer decline gracefully, and "discretionary" is the constraint doing the most work in §2.*
- [ ] Weekly payout-reminder cron in n8n.
- [ ] Referral row in the monthly close.
- [ ] Decide whether EN/PT athletes get a hand-written version.
