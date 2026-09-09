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

🚨 **Correction, same day, Iván: the cap broke the sport hubs, and worse than it fixed the catalogue.** *He clicked through to `/planes/hyrox/` and got* ***one plan***. **Measured across all seven ES hubs: cycling showed 1 of 33, swimming 1 of 19, HYROX 1 of 7, Ironman 2 of 13, weight-loss 1 of 19.** *Cause: the cap hid everything not in the curated one-per-goal set, and only a handful of any single sport's plans are in that twelve.* ⚠️ ***A rule that is right for the page it was designed against is not automatically right for the page that reuses the component*** — the same partial serves the catalogue and all seven hubs, and it was only ever tested on the first.

**Fixed with two cap modes:**

| Page | Mode | Why |
|---|---|---|
| `/planes/` | **curated** — the one-per-goal set | *That IS the page: pick a goal, get the most approachable plan for it.* |
| Any sport hub | **count of 12, filled as a difficulty ladder** | *The athlete has already chosen the sport and wants its range.* Round-robin across Beginner / Intermediate / Advanced, so a hub always opens with something for a beginner **and** something for an advanced athlete — **running and cycling now open 4 / 4 / 4** instead of 5 and 1. |

*Two separate hiding mechanisms, deliberately: `hidden` means "the filter excluded this", `data-cap-hidden` means "this is past the cap".* **They lift independently, so revealing the rest can never un-hide a card the athlete filtered away.**

⚠️ **Second bug found in the same pass:** `/planes/hyrox/` has 7 plans, fewer than the cap, so there was nothing to reveal — and the reveal button shipped **still reading its own `{n}` placeholder**, because the early-out called `liftCap()`, which returns immediately when there is no cap to lift and therefore never hid the button. *Hidden at the call site now.*

**Still true and worth watching:** the `/planes/` curated twelve are all Beginner, by construction — "most approachable per goal" selects for that. *On the hub that is defensible, because the goal ladder is one click away on the sport hub. If it ever reads as a beginners-only catalogue, the fix is to pick two per goal at different levels rather than to widen the goal list.*

**⚠️ Criterion 4 is deliberately only half done, and the reason should survive.** *The plan was to move the grid out to the sport hubs and leave `/planes/` as tiles alone.* **Two sports have no hub page — Strength and Duathlon — so removing the grid would leave those plans reachable only from the sitemap.** *Inventing two hubs to satisfy a layout is the wrong order.* The catalogue therefore stays on `/planes/`, below the fold, capped. **Splitting it is a real follow-up and needs those hubs first.**

**Two decisions worth recording:**

- **The recommended set is derived, not a list.** One plan per goal from a fixed goal order, picking Beginner → fewest weeks → cheapest. *A hand-kept list of plan ids goes stale the first time a plan is retired and nothing fails; this repo has learned that three times.* A goal absent in a language is skipped, not substituted — **the Portuguese catalogue is a third the size and should show a shorter row, not a padded one.**
- **The `0` badge was Iván's own call** *(Aug 6, 2026: "the row of dots reads better than badges popping in and out")* **and was not reversed.** *The zero state now renders an actual dot instead of the numeral — which is closer to what he asked for than "0" was — so the row stays steady and stops stating a number that reads as a result count.* ⚠️ **The results line above the grid had the same defect in reverse: it said "164 planes" over twelve cards.** It now reads `12 / 164` while capped and restores itself the moment the cap lifts.

---

### Phase 1.5 — the hub cap, finished (September 9, 2026)

**Six rules came in as a ticket. Two were already shipped, one was a real remaining defect, one was half-right, two passed on inspection.**

| Rule | Status |
|---|---|
| `/planes/` default: capped recommended, one per goal | **already shipped** |
| Sport facet shows that sport's plans, not `recommended ∩ sport` | **already fixed** in the previous pass — the ticket predated it |
| Minimum 3, twelve then "ver los N" | **already shipped** |
| **Variety by goal, not three FTP beginners** | 🚨 **real, and it was exactly right** |
| Counter `12 / 47`, never `12 / 164` on a hub | passed — `12 / 33` on cycling |
| Facet list scoped to the sport | 🚨 **broken on load** |

🚨 **The variety defect, measured: `/planes/ciclismo/` opened twelve cards that all read "CICLISMO · FTP".** *The v1 ladder round-robinned across DIFFICULTY, which fixed the count and not the content — a beginner, intermediate and advanced version of the same goal.* **Variety in the axis nobody was looking at.** *Buckets are now distances (a distance IS the goal here: FTP, VO2Max, Sprint, 5 km, HYROX), and the outer loop walks the goals: cycling opens FTP 3 / VO2Max 3 / Sprint 3 / Weight Loss 3.*

⚠️ **Then the same mistake appeared one level down.** *With goals varied, `/planes/running/` opened* ***twelve Beginner cards*** *— six goals, two rounds, and taking `[0]` then `[1]` from a bucket sorted Beginner-first gives two beginners whenever a goal has 19 plans and most are beginner.* **Each bucket is now itself a difficulty round-robin**, so round one is one beginner per goal and round two is one *intermediate* per goal. **Running 7/5, cycling 6/3/3, swimming 6/5/1.** *The lesson is that fixing a variety bug on one axis does not fix it on the other, and the second one only becomes visible once the first is gone.*

🚨 **Facet scoping: `updateDependentFacets()` only ever ran on a change event**, so a preset applied server-side never triggered it and `/planes/running/` offered **1500m** as a distance. *Called on load now — running offers 10 km, 21 km, 42 km, 5 km, HYROX, Weight Loss and nothing else.*

---

### Phase 2 — started September 9, 2026

**The All-Access page sold thirteen interactive tools and contained zero images of any of them.** *The strongest evidence this product has could only be seen after paying for it.*

**Shipped: a "míralo antes de pagar" section on all three All-Access pages**, carrying **screenshots of the real built pages driven into a real state** — a running athlete's seven zones computed from a 168 bpm threshold, and the activation setup with three answers chosen. *Not mockups, not stock: generated from `_site/` by driving the actual tools, in each language, so the English page shows the English UI.*

⚠️ **They are generated, so regenerate them from the build rather than editing them by hand.** *A screenshot that stops matching the product is worse than no screenshot — it is a claim about a page that no longer exists.* **The shots sit on a wash band because the product is carbon and a dark image floating on white reads as a pasted rectangle.**

**Still open, and it is Iván's:** *the brief's opening question for this phase — ungate one more tool as a public taste, or stop at screenshots.* **The zones calculator already has a public sibling and it is the only tool a stranger can touch**, so the pattern is proven; the question is whether a second one earns it. *Screenshots were the half that needed no decision, and they are done.*

---

### Phase 2, second tranche — the public runner core earns its keep (September 9, 2026)

**The phase's opening question was "ungate a second tool as a public taste, or stop at screenshots". Iván took the tool** — `/core-para-corredores/` + EN/PT, extracted rather than duplicated so the routine still exists once — **and then chose what it trades for an email.**

**Offer: "La semana de fuerza del corredor"**, six pages, three languages. `lead-magnet-semana-de-fuerza.md` owns it. *Chosen from four options against the test set one day earlier by the decision NOT to put a capture on the pace converter:* **an email box belongs on a tool only when an artifact exists that continues the job the tool started.** *The tool ends and the athlete's real question is "how often, and what else?" — which the tool cannot answer and this does.*

**Pipeline: `/api/tool-lead`, one generic endpoint** rather than a third copy of plan-lead and zone-workouts. `tool-lead-runbook.md`. **Every magnet after this one costs two edits and zero UI work from Iván** — that was the whole basis of the choice.

**Placement answers this branch's own opening measurement.** `/planes/` put Buy at y=556 and its email capture at y=625, **69 px apart** — two competing primary actions. Here the capture sits below the tool and the All-Access CTA at the foot of the page, **measured ~500 px apart**, with the done overlay carrying a one-line link rather than a second form.

🚨 ***Two defects found on pages that shipped the previous day, both invisible from inside their own stylesheet and both found by rendering:*** *`.cta-final` painting near-white on pale blue at about 1.03:1 on all three public pages, because `site.css` declared that component's background and inherited its colour; and `.visually-hidden` existing only in `plan-page.css`, so the capture's screen-reader label rendered as visible text.* **Detail: `ai-infrastructure-documentation.md` §49.3 and §49.4.**

⚠️ **NOT LIVE — three steps are Iván's** (Twenty enum, Caddy reload, n8n import), and one content question is his: **the week grid on page 4 of the guide is derived from his placement rules and has never been signed off as a week.**

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
