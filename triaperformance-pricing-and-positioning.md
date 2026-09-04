# Triaperformance — Pricing & Positioning

## The model: purchasing-power segmentation, not service tiers
TrainingPeaks frames coaching as three formal tiers — Bronze ($149), Silver ($229), Gold ($359) — differentiated by call frequency, adjustment frequency, and analysis depth. **That ladder is a US-market framing and does not describe how Triaperformance actually prices or delivers. Do not assume it does when reasoning about this business.**

The real model: one consistent service definition, priced differently depending on what the market and the individual athlete can bear.

## What the core service actually includes, at any price point
- One weekly check-in, always
- Plan adjustments on request — not every athlete asks
- Analysis on request — not every athlete asks
- WhatsApp communication through the week — responsive, but not same-day

That's the whole offer. There is no formal "pay more, get more calls" structure today — variation in how much an athlete uses is about the athlete's own engagement, not a tier they bought into.

## Why price varies
Latin America's coaching market is anchored around $60–100/month for what feels like unlimited access — that's the competitive baseline in Colombia, Panama, Mexico, Argentina, and Chile. Triaperformance started there and moved up gradually: 50% discount off the $149 nominal price, then 40%, then 30%, then flat $99, and now testing $149 outright.

**$149 works specifically with:**
- High-purchasing-power Latin Americans
- US-based athletes, for whom $149 undercuts TrainingPeaks' own $359 "Gold" framing and reads as inexpensive
- Working professionals with real discretionary income — recent acquisitions have included a fellow COO

**$149 is not a viable general Latin American market price.** The $75–99 range is where most of the current base sits and where new Latin American acquisition outside the high-purchasing-power segment will likely continue to land. Both price points are correct for their respective segments — this isn't a single number to converge on.

## The referral-rate exception — now "founding members"

> **Named and settled August 26, 2026, by Iván.** *This section previously left the question open ("worth keeping as an explicit, named exception… rather than something that happens ad hoc"), and `open-loops.md` NEXT #10 carried it as a collision to resolve before the referral program launched. **It is resolved: they get both.*** **The rate is earned and so is the $50 referral reward** — several athletes sit at $75 after long tenure, and paying them twice is the correct outcome, not a leak. Iván's words: ***"that's the definition of being founding members."***
>
> **The name is the policy.** "Founding member" is not decoration — it is what makes the rate defensible to the athlete, communicable in the referral disclosure message, and closed as a question. *The alternative framings — "legacy rate", "discount" — both invite the athlete to calculate a number pricing rule 5 depends on nobody calculating.* **Never write "descuento" for these athletes.** See `referral-program-brief.md` §4.
>
> **Uncapped, deliberately.** The earlier suggestion to cap it "at a small number of athletes" is dropped: the population is closed by construction — it is the early cohort, and rule 5 means no new athlete can enter it.

At least one athlete is intentionally priced below what this segmentation would suggest ($75, currently the highest-touch relationship on the roster) because of the referrals and credibility he brings. This is a deliberate policy, not a pricing failure. Worth keeping as an explicit, named exception ("referral-source rate," optionally capped at a small number of athletes) rather than something that happens ad hoc for every athlete Iván likes.

## Implication for a hired coach
Because the service is uniform rather than tier-differentiated, onboarding a new coach doesn't require inventing a restricted scope — the standard service described above is already well-bounded and is what a hired coach would deliver. The economics only work at the $149 price point, though: at 3.5% commission (Private channel, via TP Payments), $149 nets $143.79, split 50/50 is $71.89 to the coach and $71.89 to Iván. At $89–109, the split gets thin fast and likely isn't worth either side's time. *(A **referred** Private athlete carries a further $9 for TrainingPeaks Premium — $134.79, i.e. **$67.40/side**. Noted Aug 26, 2026.* ***Where that cost falls is a live question:*** *taking the split after Premium is symmetric at $67.40 each; taking it before hands the coach $71.89 and leaves Iván $62.90 for the same work. Not decided.)* At $89–109, the split gets thin fast and likely isn't worth either side's time.

## ICP signal worth acting on
The highest-value, lowest-price-sensitivity buyers are busy, senior professionals — executives, people managing their own P&L or team, with real disposable income and limited patience for hand-holding. That profile matches the actual service well: structured, autonomous, weekly cadence, not same-day. It also matches Iván's own positioning as an operator and athlete. Worth reflecting in website copy and targeting rather than a generic "for all runners" pitch — the generic pitch competes on the $60–100 Latin American baseline; a professional-athlete pitch competes on value instead of price.
Validated by reviews: adaptation-to-schedule/travel is the most-mentioned theme (15/38 written reviews), and athletes independently cite the proactive weekly check-in as the differentiator. See `social-proof-and-reviews.md`.

## Draft product ladder
*(See `growth-roadmap.md` for the infrastructure behind each row.)*

| Tier | Price | What it is | Status |
|---|---|---|---|
| Passive plans | ~$60 one-time | Static plans, 4–24 weeks, 3 languages | Live, ~~303~~ **328** listings |
| All-Access | $29.99–39.99/mo | Plans + TrainingPeaks Premium + a real tools library (see below) | Live, dormant (~~2 subscribers~~ **1 subscriber, Portuguese**) |
| AI Coach *(proposed)* | TBD, likely $25–40/mo | AI-guided self-coaching on Iván's own methodology | Not built |
| 1:1 coaching | $75–149/mo | Weekly check-in, on-request adjustments/analysis, WhatsApp | Live — price set by segment, see above |

*Two corrections to the table above, August 14, 2026 (status audit).* **(1) Catalogue count:** *the Passive plans row read* **"Live, 303 listings"** *— stale since Aug 12. It is **328** (ES 164 / EN 111 / PT 53), owner `data/training_plans_inventory.csv`, cross-checked against the live catalog pages. This file owns every **price**; it does not own the catalogue count and arguably should not restate it.* **(2) Subscriber count:** *this read* **"2 subscribers"** *; Iván states **1, Portuguese**, one having churned (Aug 14, 2026). Five files carried 2 while `ai-infrastructure-documentation.md` carried 3 from a July 29 Twenty check — the stale lower number won on repetition. Owner is `triaperformance-business-overview.md` §Revenue streams, and **from the September close onward that row cites `monthly-close/YYYY-MM.md` rather than being hand-updated.** Note the pricing consequence, since this file owns prices: **the only live All-Access subscriber is on the $29.99 PT tier, not $39.99** — so the product's entire current revenue sits at the discounted price point.*

# Pricing policy — decided July 2026

## The decision

**$149/month is the single list price for 1:1 coaching, on both channels, for all athletes (single-sport and multisport), shown publicly on the website.**

| Channel | Athlete pays | Commission | Iván nets | Coach-hire 50/50 split |
|---|---|---|---|---|
| CoachMatch | $149 | 20% (TrainingPeaks) | $119.20 | n/a — cannot be delegated |
| Private | $149 | 3.5% (TP Payments) | $143.79 | $71.89 / $71.89 — viable |
| Private, **referred** | $149 | 3.5% **+ $9 TrainingPeaks Premium** | **$134.79** | **$67.40 / $67.40** — viable |

The same athlete is worth **$24.59/month more on Private** — **$15.59 if they arrived as a referral**, which carries a $9 TrainingPeaks Premium cost the other Private athletes do not (see the section below, Aug 26, 2026). Private is therefore the priority acquisition channel; the website, lead magnets, and referrals all feed it. CoachMatch stays as-is ("pick Bronze, I'll give you Gold service level" against TP's public $149/$229/$359 ladder — $149 reads as the cheap option there).

## TrainingPeaks Premium — referred athletes only, from August 26, 2026

**Scope, stated first because the obvious reading is wrong:** Iván buys TrainingPeaks Premium ($9/month, out of pocket) **for athletes who arrive through the referral program.** *Not* for Private athletes generally. A lead who finds the website and signs up gets no Premium by default. *(Corrected the same day it was written — the first version of this section applied the $9 to all Private athletes and moved every Private net figure in the repo with it. It was wrong, and the reverts are in this file's history.)*

**Why the scope is what it is, and it is not a parity argument.** TrainingPeaks pays for Premium on **CoachMatch** athletes and not on Private ones. **Most of the current book is CoachMatch** — so the athlete doing the referring almost always has Premium, and describes the service to their friend as including it. **The $9 exists to make the referrer's description true.** *That is a narrower and better reason than "the same service should be the same everywhere," and it is Iván's.*

**What it costs and what it buys.** $9/month per referred athlete, against a **$19.95/month retail** value (the figure the All-Access page already argues from). ***The margin case is the weaker half; the pitch is the stronger half*** — it converts $9 of cost into $19.95 of stated value, which is Iván's own framing: *"I have one more thing to sell."*

> ⚠️ **The open tension, logged rather than resolved: this creates a service difference keyed to acquisition channel, which is what pricing rule 4 exists to prevent** (*"No formal service tiers. One uniform service."*). Two athletes both paying $149, one with Premium and one without, differing only in how they arrived — and **referred athletes are the most likely of all to know another athlete personally**, since that is how they got here. Ferenz and Liby Feher are family.
> **Do not size this from the Private headcount.** *An earlier version of this line multiplied 5 Private athletes by $9 and asserted $45/month. That is wrong and was withdrawn the same day:* **the incremental cost is only the athletes who have no Premium and are not leaving** — some arrive already holding it, some buy it themselves annually, and a churning athlete costs nothing. **The true figure is materially lower than headcount × $9, and it moves every month, so it is counted at decision time from the live roster — never derived here.** *Iván's implementation rule, when he decides: where an athlete already holds Premium, pay nothing until their current period ends.*

~~**Where it appears in copy:** the value-prop list on `/referidos/`. **It must NOT be added to the coaching page or `sales-playbook.md` A5** — those describe the standard Private offer, which does not include Premium.~~

🚨 ***SUPERSEDED September 4, 2026 — Iván changed the offer: TrainingPeaks Premium is now included for EVERY 1:1 coaching athlete, not only referred ones.*** *(Decided previously in conversation, surfaced and confirmed here when the homepage rewrite hit the rule above.)* **Shipped the same day on all three homepages, on both coaching surfaces** — the services card and the $149 price card — *because leaving it off one of them would contradict the other within a single scroll.*

⚠️ ***The consequence has to be stated, because it removes the referral program's reward without replacing it.*** *The $9 Premium inclusion existed specifically so a referred athlete got something a normal $149 athlete did not — Iván's framing was "I have one more thing to sell."* **If everyone gets Premium, that is no longer a reward, and the founding-member pitch in `referral-program-brief.md` loses its concrete half.** *The tension logged above — a service difference keyed to acquisition channel, against pricing rule 4's "one uniform service" — is now resolved in favour of rule 4. That is the upside, and it is real. But the referral offer needs a new differentiator or it needs to stand on the $50 gift card alone.* **Logged in `open-loops.md`; owner is `referral-program-brief.md`.**

⚠️ **The cost is material against this business's actual cost base and is not yet measured.** *Close #1 records **36 coaching athletes** and a TrainingPeaks invoice carrying **1.4839 Premium licences ($13.36)** — i.e. Iván was buying Premium for about two people.* ~~**Upper bound at 36 × $9 = $324/month, against total August operating costs of $245.25** — *so the worst case more than doubles the cost base.*~~ **The real figure is lower and must be counted, not derived:** the standing rule in this section already says some athletes arrive holding Premium, some buy it annually themselves, and a churning athlete costs nothing — *so it is counted at decision time from the live roster.* **Read the actual number at the September close; do not let this land as a surprise line.**

🚨 ***The cost estimate immediately above is WRONG and is struck, September 4, 2026 — corrected by Iván within the hour, then verified against `data/monthly_close/2026-08-roster.csv`.*** **TrainingPeaks pays for Premium on CoachMatch athletes** *(it is part of what the 20% commission buys)*, **All-Access already carries its own $9 deducted by TrainingPeaks before payout**, so ***the only athletes Iván pays Premium for are the Private ones.*** **The roster: `billing_channel` = COACHMATCH 35 · PRIVATE 4 · ALL_ACCESS 3, and `premium_fee` = 9 on exactly THREE rows in the whole file.** *Of the 4 Private athletes, 3 are active and one already carries `premium_fee: 9`.*

**So the real marginal cost is 2 × $9 = $18/month, upper bound 3 × $9 = $27/month — not $324.** *Against $245.25 of operating costs that is ~7–11%, not a doubling. **The decision is cheap and the analysis that made it look expensive was mine, not the data's.***

⚠️ ***The instructive part: this file already told me not to do what I did.*** *The referral note above says, in bold —* **"Do not size this from the Private headcount… The true figure is materially lower than headcount × $9 … it is counted at decision time from the live roster — never derived here."** *I derived it anyway, from the wrong headcount (all 36 coaching athletes rather than the 4 Private ones), and produced a figure 12–18× too high on a decision Iván was actively taking.* **The roster was one file away and answers it exactly.** ***A standing rule that says "count this, do not derive it" is worth reading before writing the number, not after.***


## Rules

1. **One public price.** The website shows $149. No lower price is ever listed anywhere.
2. **Discounts are private exceptions, not tiers.** Purchasing-power adjustments (LatAm) and the referral-source rate are negotiated case-by-case, unlisted, never advertised. The list price does not move.
3. **No single/multisport price split.** Discontinued.
4. **No formal service tiers.** One uniform service (weekly check-in, on-request adjustments/analysis, WhatsApp). The $75 monthly-check-in athlete remains a one-off exception, not a product.
5. **Legacy rates are grandfathered — until a pause.** Existing athletes at $74.50/$89/$99 keep their rate for as long as they stay continuously active. An athlete who pauses returns at $149. **No exceptions** — this rule is the migration mechanism and only works if it's absolute.

## Why $149 Private (not $120)

$120 was derived by matching net income across channels ($115.80 ≈ $119.20). Wrong invariant — athletes never see the commission. What matters:

- Private leads (referrals, website, Instagram) are warmer than CoachMatch leads; the highest-trust channel should not carry the lowest price.
- Coach-hire economics: viable at $149 ($71.89/side; $67.40 on a referred athlete carrying Premium), non-viable at $120 ($57.90/side — **$53.40 on a referred athlete**, *noted Aug 26, 2026*). The program launches this year, so the price must support it now.
- Validation: the last 7 CoachMatch sign-ups all converted at $149.

## Execution notes

- $149 converts only with active pipeline discipline (follow-ups, 1–2 extra messages, the Gold-service framing). March 2026's zero-conversion month was price + passive follow-up combined; the price alone was not the problem.
- Current legacy book (July 2026): 6 @ $74.50, 5 @ $89, 17 @ $99 (CoachMatch); 5 privates at $75–109. Left alone — attrition and the pause rule converge the base to $149 over time.

## Starting fee — Private channel

New Private athletes pay a $50 one-time starting fee in month one (nets $48.25 after 3.5%), covering setup: onboarding, testing, studying the athlete, building the first plan.

- A promo code exists to waive the fee — this is a deliberate closing lever for negotiation, not a discount on the monthly price. Concede the fee, never the $149.
- Already validated: charged successfully a couple of times before being formalized.
- CoachMatch has no equivalent; this is a Private-channel tool only.


## All-Access subscription pricing

Two live products, priced by market purchasing power:

| Edition | Price/mo | TP Payments 3.5% | Premium fee | Iván nets | Effective take |
|---|---|---|---|---|---|
| Spanish / English | $39.99 | −$1.40 | −$9.00 | $29.59 | 26.0% |
| Portuguese | $29.99 | −$1.05 | −$9.00 | $19.94 | 33.5% |

The Portuguese discount is historical (weak BRL made USD pricing feel expensive). Because the $9 TrainingPeaks Premium fee is fixed, lower prices carry disproportionately worse margins — any future All-Access pricing decision should account for that floor. At 2 subscribers, the constraint is distribution, not price: this product is built, recurring, near-zero marginal effort, and unpromoted.

***Renamed August 13, 2026 (ES and EN only).*** *The checkout titles now match what the site calls the product. Previously the nav said "Membresía All-Access" and the checkout said "Suscripción Triaperformance" or "FULL ACCESS" — a different product name appearing at the exact moment of payment. Also fixed "Training Peaks" → "TrainingPeaks", which was wrong in both. **Portuguese was not renamed** (existing subscriber); note that its title omits TrainingPeaks Premium entirely, hiding a $9/mo inclusion from PT buyers — worth adding to the TP description field if one exists.*

> ***Standing warning: renaming a TP Payments product is a two-system change.*** *`subscription-lifecycle-automation.json` identifies the product by matching substrings of this exact title, in two separate Code nodes. The Aug 13 rename removed both anchors (`"Suscripci"` and `"FULL ACCESS"`) and every new ES/EN subscription silently classified as UNKNOWN — no welcome email, no members token, no `ALL_ACCESS` customerType, and **no error anywhere**, because the payment itself succeeds. Caught within the same 30-minute window, with no live subscriptions lost. **Before changing any product title here, grep `automation/` for the string you are about to delete.**

**Checkout links (added Jul 2026, for website CTA buttons; subscriber counts corrected Aug 2, 2026 — one Spanish subscriber churned, so the live total is 2: 1 ES + 1 PT):**

| Language | Checkout URL | Product name (as set in TP Payments) | Price | Subscribers | Renameable? |
|---|---|---|---|---|---|
| Spanish | https://checkout.trainingpeaks.com/product/188df02f-d71f-4b5b-8d43-abd4edb446f3 | "Triaperformance All-Access — Todos los planes y guías + TrainingPeaks Premium" | $39.99 | 1 | Renamed Aug 13, 2026 |
| English | https://checkout.trainingpeaks.com/product/7127a1e4-f736-45b7-b98d-1bbe468d950a | "Triaperformance All-Access — All training plans and guides + TrainingPeaks Premium" | $39.99 | 0 | Renamed Aug 13, 2026 |
| Portuguese | https://checkout.trainingpeaks.com/product/938a0833-d337-4a9f-a33a-34199d662d4a | "Acesso Total: Planos de Treino (Corrida + Ciclismo + Triatlo)" | $29.99 | 1 | No — existing subscriber |

**Private 1:1 coaching checkout link** *(added September 4, 2026 — Iván. This URL had existed nowhere in the repo, which is why warm leads kept getting sent to `trainingpeaks.com/coach/ivankoch#pricing` and closing through CoachMatch at **20% instead of 3.5%**. `referral-program-brief.md` §4 and the Sept 3 AI-lead item both raised it; this is the fix.)*

| Product | Checkout URL | Price |
|---|---|---|
| Private 1:1 coaching | https://checkout.trainingpeaks.com/product/89fd8761-0301-4cca-bded-394238ae1b8a | $149/mo |

*This is the `{CHECKOUT_URL}` placeholder in `sales-playbook.md` A5 · Private, and the link the referral blurb carries.*

Subscription flow: athlete pays via TrainingPeaks Payments checkout → TP links them to Iván's coach profile, grants TrainingPeaks Premium, and grants access to **the entire plan catalog**. *(Resolved Aug 2, 2026 — this line previously said "the plans Iván has selected into the offering (not the entire catalog — exact scope not yet documented)." Confirmed by Iván: all plans are included and it is safe to claim so in marketing copy. The old caveat is retired.)* Same product-in-TP-Payments mechanism as the 1:1 coaching plans, just a different product.

***Value proposition update — August 13, 2026.*** *The third component of All-Access stopped being "light extras".* The members library went from ten Spanish-only pages to **eight entries in each of three languages** in one day (inventory owned by `triaperformance-business-overview.md`): a zones calculator, an adaptive activation builder, knee and Achilles loading programmes, a core routine, a breathing tool, a training-load guide, and downloads. **This is the first time the subscription has something that is neither a plan nor TrainingPeaks** — i.e. the first component a subscriber cannot buy anywhere else, at any price.

*Why that matters for pricing rather than just for product:* the worked example below shows All-Access competing on **price** against Premium-plus-plans. It has never had an argument that competes on **difference**. It does now, and the honest version of it is narrow — the tools are worth something to an athlete who is injured, travelling, or unsure what their zones are, which is most athletes some of the time.

🚨 ~~***The public All-Access page does not say any of this, and what it does say is wrong.***~~ ✅ ***RESOLVED September 4, 2026.*** *The three `Qué incluye` sections were rewritten from the real inventory: the nutrition guide, the mental-prep guide and the zone-sessions guide came out as top-level inclusions — they duplicated the `Descargas` entry inside the library section directly below, and* **the zone-sessions guide is the free lead magnet given away for an email on the zones calculator, so a $39.99 page was selling as a headline inclusion something the site hands out for nothing.** *The "flexibility, kettlebell, lower back pain" copy this line was written about had already gone with `library.json` in August; what survived until today was the hand-written summary card above it, which claimed* **eight** *tools against a real thirteen. The page now renders the count and names nothing by hand.* **The original diagnosis stands as the reason it mattered and is kept:** the page sold a library that did not exist while the one that does was invisible.

***Coach support added to All-Access — September 4, 2026, Iván's call, deliberately framed as a bet.***

**What was added:** a `Soporte del coach` card on all three All-Access pages — *questions about a tool, your zones, or which plan to pick, answered personally.* **What was removed in the same pass:** the `Consulta semanal en vivo` card (a standing Thursday 5PM ET call). *That was a recurring group session under another name, which the project guardrails rule out, and it booked a weekly slot in the calendar this business is trying to empty. Async support is strictly better on both counts, and removes the timezone problem for a product sold in three languages.*

**Why it is defensible at $39.99 next to $149 coaching, and where the line is.** The card and the FAQ both state the boundary in the copy: **no review of your training, no weekly adjustments, no personalised testing — those are what define 1:1.** *The distinction that protects the coaching price is **individualised weekly adjustment**, not access to a human.* ⚠️ **This is the risk to watch, not to dismiss:** *close #1 records **26 legacy athletes below $149**. A page promising "ask the coach anything" for $39.99 would be a visible downgrade path for them, which is exactly why the promise is scoped in writing rather than left warm and open.* **If the boundary has to be defended in a real conversation, that is the signal the scope is too loose — tighten the copy, do not start delivering the wider thing.**

**The guardrail is internal and is not on the website.** *Iván, explicitly: the number is "for us, not for the website" — no scarcity framing, no counter, no "first 10" language in the copy.* **Run it for the next 10 subscribers. If the support load is unreasonable, the card comes off the site, those 10 keep it for as long as they stay, and subscriber 11 onward is support-free.** *Recorded here rather than in copy so that removing it later is a clean decision and not a broken promise.*

⚠️ **The trigger is a count, and at current volume a count may never fire.** *August added zero net All-Access subscribers and the book stands at one.* **So read this at the monthly closes, not by waiting for the tenth signup** — if 10 has not been reached by the end of the year, the honest read is that the bet was never tested, not that it passed.

*The one existing subscriber gets it retroactively. Iván is reaching out to them September 4 — All-Access NRR is 27.3% and that subscriber has never logged in, so this doubles as the re-engagement excuse that did not otherwise exist.*

**Value framing (from Iván, Jul 2026):** TP Premium alone runs $19.95/mo (monthly), $16.33/mo (quarterly), $11.25/mo (annual). A consistent, single-goal athlete on annual Premium + one $50 plan every ~12 weeks (~$17/mo amortized) is already near the $39.99 All-Access price on their own — so the subscription's real edge is for anyone *not* that profile: multi-sport athletes, athletes switching goals mid-cycle (e.g. a fast 5K then a 10K a few months later), or anyone still on monthly Premium pricing. Worked example: 3 months of monthly Premium ($19.95×3 = $59.85) + a 5K plan ($40) + a 10K plan ($50) = $149.85 over 3 months (~$50/mo) — well above All-Access's flat $39.99/mo, which also includes free plan-swapping. **"All plans included" is an approved claim** (confirmed by Iván, Aug 2, 2026) — use it. Every plan in the catalog, in every language, plus unlimited swapping between them.


