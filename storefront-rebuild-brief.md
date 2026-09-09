# Storefront rebuild — branch home doc

**Opened September 9, 2026. Iván's call, taken ahead of race landing pages.** *"I am committed to building a site that I am proud of."*

**What this doc owns:** the branch — its four phases, each phase's definition of done, the acceptance criteria that stop a phase being "finished" by restyling, and the decisions taken along the way.

**What it does not own, and must never restate:**

| | Owner |
|---|---|
| Storefront strategy, pricing levers, the monetization parking lot | `triaperformance-growth-roadmap.md` §Training Plan Storefront |
| Every price | `triaperformance-pricing-and-positioning.md` |
| Every sales figure | `training-plans-analysis.md` (from `data/plan_sales.csv`, `data/plan_performance.csv`) |
| Tokens, type, components, the reject list | `brand-guidelines.md` |
| What the members library contains, customer-facing | `site/_data/library.json` |
| Open items | `open-loops.md` — this branch is one entry there, and the phases are not separate items |
| The design system's own history | `design-refresh-brief.md` |

⚠️ **This is the fourth document that could plausibly hold a storefront decision.** *The storefront brief was retired in August for exactly this — it kept serving a 407-row catalogue and a retracted figure long after both were wrong.* **If a decision here belongs to one of the owners above, it goes there and this doc gets a pointer.** Retire this file when phase 4 closes.

---

## Why this branch, and why now

**The measurement, taken against the live site on September 9, 2026:**

- `/planes/` renders **164 cards on first paint, zero hidden, 18,737 px tall at 1920** — and roughly 47,000 px on a phone. No images, no volume, no hours. Titles repeat the eyebrow above them.
- The plan page puts **Buy at y=556 and the email capture at y=625 — 69 px apart.** Two primary actions competing. Zero images. The "what you'll train per week" table has **one row**.
- The athlete then lands on TrainingPeaks and finally sees a photo, chips and a sample week.

***The storefront hands off to the page that does the selling.*** **That is the branch in one sentence.**

**Why ahead of race pages** *(NEXT #1, researched and ungated since August 6)*: race pages send traffic into this funnel. **Building the top of a funnel whose middle is a warehouse spends the traffic to prove the middle is broken.** Race pages get better the day this closes, and they stay fully researched in the meantime.

**WIP:** the referral branch keeps its entry but not the slot — *its own note has said since August 26 that it is waiting on the calendar rather than on work, and the first payout that can physically exist is October 6.*

---

## Phase 1 — `/planes/` stops being a warehouse

**Definition of done:** a stranger lands on `/planes/`, sees something they could choose from without scrolling, and reaches a plan in two clicks.

**Acceptance criteria** *(written as criteria on purpose — a page this shape can be "improved" by restyling 164 cards and would still be a warehouse)*:

1. **First paint renders 8–12 plans, not 164.** One per real goal — 5K, 10K, 21K, 42K, Olympic, 70.3, FTP, HYROX. "Ver los 164" reveals the rest.
2. **Every plan stays in the DOM and stays crawlable.** *The catalogue is the internal-link structure to 164 pages; hiding it behind a fetch would cost the SEO the storefront exists for.* Reveal, don't load.
3. **Mobile document height under 8,000 px** on the default view. *Measured, not estimated.*
4. **`/planes/` is a hub, not a filtered grid.** Sport tiles plus All-Access; the grid lives on `/planes/running/` and its siblings. *Today `/planes/` and `/planes/triatlon/` are the same component with a different H1.*
5. **The card is a product, not a filename.** Eyebrow `5K · Principiante`, a short title, and real volume — `data/plan_weekly_breakdown.csv` has sessions per week, weekly average and longest workout per discipline. ⚠️ **It does not have hours per week**, and the units differ by sport (meters for swim). *Derive what the data supports and state it in the units it is in; do not compute an hours figure the file cannot produce.*
6. **Filter chips never render a bare `0`.** A count that reads as "no results" on a page that has 164 of them is worse than no count.
7. **No stock photography.** A sport mark and a volume line are enough. *`brand-guidelines.md` §7 permits stock on blog cards only, and 164 plan photos is exactly how that exception spreads.*

**Not in this phase:** pricing changes, catalogue pruning, new intent hubs.

---

### Phase 1 — SHIPPED September 9, 2026

**Measured against the criteria, not described:**

| # | Criterion | Result |
|---|---|---|
| 1 | 8–12 on first paint | **12** (ES) · 11 (EN) · 11 (PT) |
| 2 | Every plan in the DOM and crawlable | **164 cards in the DOM**, all 164 internal links intact — the cap is a class on the grid, not a slice of the array, plus a `<noscript>` override |
| 3 | Mobile under 8,000 px | **5,657 px** (was ~47,000). Desktop **3,240 px** (was 18,737) |
| 4 | Hub, not a grid | Sport tiles + All-Access line + "Empieza por aquí". ⚠️ **Partial, deliberately — see below** |
| 5 | Card is a product | Sessions/week, hours/week and longest session, from real data |
| 6 | No bare `0` chips | Renders `·` |
| 7 | No stock photography | None added |

🚨 **The hours correction.** *I told Iván the data could not produce hours per week. That was wrong.* **`plans.js` already derives it** — 470 of 765 breakdown rows are `HH:MM:SS` durations and it sums them, deliberately skipping metres and miles rather than guessing. **Coverage: 92% ES, 87% EN, 49% PT**, so the card degrades in steps — hours where they exist, sessions alone otherwise, nothing where there is no breakdown. *The raw CSV has no "hours" column, which is what I checked; the derived value was already sitting in `weeklyTotals` two functions later.* ⚠️ **Reading a schema is not reading the data layer built on top of it.**

**⚠️ Criterion 4 is deliberately only half done, and the reason should survive.** *The plan was to move the grid out to the sport hubs and leave `/planes/` as tiles alone.* **Two sports have no hub page — Strength and Duathlon — so removing the grid would leave those plans reachable only from the sitemap.** *Inventing two hubs to satisfy a layout is the wrong order.* The catalogue therefore stays on `/planes/`, below the fold, capped. **Splitting it is a real follow-up and needs those hubs first.**

**Two decisions worth recording:**

- **The recommended set is derived, not a list.** One plan per goal from a fixed goal order, picking Beginner → fewest weeks → cheapest. *A hand-kept list of plan ids goes stale the first time a plan is retired and nothing fails; this repo has learned that three times.* A goal absent in a language is skipped, not substituted — **the Portuguese catalogue is a third the size and should show a shorter row, not a padded one.**
- **The `0` badge was Iván's own call** *(Aug 6, 2026: "the row of dots reads better than badges popping in and out")* **and was not reversed.** *The zero state now renders an actual dot instead of the numeral — which is closer to what he asked for than "0" was — so the row stays steady and stops stating a number that reads as a result count.* ⚠️ **The results line above the grid had the same defect in reverse: it said "164 planes" over twelve cards.** It now reads `12 / 164` while capped and restores itself the moment the cap lifts.

---

## Phase 2 — All-Access, and letting a stranger see the members area

**Absorbs `open-loops.md` NOW → "Nothing in the library is visible to a prospect."** *That item's three options — ungate one tool, screenshots, or a screen capture — are this phase's opening decision and are not decided here yet.*

**Definition of done:** a prospect can see a real members tool working before paying, and the All-Access page shows the product rather than describing it.

**The asymmetry to exploit:** the zones calculator **already has a public sibling** — indexed, working, and the only tool a stranger can touch. *That pattern is proven; the question is which second tool earns the same treatment.*

**Open, and Iván's:** ungate one more tool as a public taste, or ship real screenshots, or both. `site/_data/library.json` stays the single source for what the library contains.

---

## Phase 3 — About, with the story it actually has

**Absorbs `open-loops.md` NOW → "The About page does not tell the story, and the story is the strongest asset the site has."** *(Iván, September 4.)*

**The arc, in his words:** he started coaching himself, then a friend, then family. **For years the goal for the whole year was to help one person.** Now he coaches 50+ athletes across Latin America.

***That progression is the claim — not the number on its own.*** *It says the coaching was real before it was a business, which is the one thing a prospect cannot verify from a price page and the one thing most coach bios cannot say.*

The portrait shipped September 9 and the page has a face on it. **The story is what is still missing.** Three pages: `site/sobre-ivan`, `site/en/about`, `site/pt/sobre-ivan`. Voice: `brand-guidelines.md` §10.

---

## Phase 4 — Race landing pages

**This is `open-loops.md` NEXT #1, unchanged and not re-scoped here.** Everything it needs is already done: the longlist, the tiering, `data/races.csv`, the per-race schema and the content outline. *It moves into this branch only so the order is written down once.*

---

## Testimonials: `data/testimonials.csv`

**Created September 9, 2026, and it answers the join question by removing the join.**

*The first proposal was an `athlete_results.csv` keyed to the quote bank by athlete name.* ⚠️ **A name join is the fragile part: accents drift (`Carlos Peña` / `Carlos Pena`), some athletes have no surname on file (`Limaris`), and a translated page would have to match a Spanish name.** **So the quote and the result live in the same row instead**, keyed by a slug this repo assigns (`luis-casillas`) rather than by anything a human types twice.

**One row per testimonial**, 14 columns: `id`, `name`, `country`, `figure`, `event_{es,en,pt}`, `quote_{es,en,pt}`, `source`, `consent`, `placement`, `note`.

Two columns carry the weight:

- **`source`** — `review` · `whatsapp` · `instagram` · `confirmed` · `recall`
- **`consent`** — `public_review` · `given` · `pending`

🚨 ***A row renders only when it has a `figure` AND a consent that is not `pending`.*** *A Google review is already public with a name on it; a WhatsApp or Instagram message the athlete sent you knowingly is `given`.* **`recall` is never publishable on its own** — a remembered finish time, printed beside a named real person, is a claim about their race, and it is the one class of error on this site that would actually matter.

**`figure` is language-neutral by design** — `Sub-3`, `600 km`, `70.3`, `Sub-2:05`. *If a figure needs translating it is not a figure, it is a label, and `brand-guidelines.md` §6 already says Heat at display size looks empty next to a label.*

**`placement`** (`home` / `about` / `plans` / `none`) means Iván moves a testimonial between pages by editing a cell, not by asking for a template change.

**Seeded with 17 rows** — the four running on Home, the ones with real quotes and no number yet, and the rest of the bank. **Four are publishable today; thirteen are waiting on a number.** *Getting one from `recall` to `confirmed` is a message worth sending anyway: it doubles as the review-generation ask in `open-loops.md` NEXT #7, which is why the English page currently has no figures at all.*

**Ownership:** this file owns what renders. `social-proof-and-reviews.md` keeps the review inventory, the counts and the generation playbook, and points here for deployed quotes. *Wiring is the `data/zones.csv` → `site/_data/zones.js` pattern: a small loader in `site/_data/`, never a second copy of the rows.*
