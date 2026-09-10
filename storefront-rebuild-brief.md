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

### Phase 1.6 — the chooser stopped lying, September 9, 2026

*From Iván's audit. Three items accepted, and the measurement behind one of them found a bigger defect than the audit did.*

🚨 ***The sport chooser counted 20 plans twice and left 12 with no door.*** *The six tiles were Running 70 · Ciclismo 33 · Triatlón 30 · Natación 19 · HYROX 7 · Ironman 13 —* **which sums to 172 against a 164-plan catalogue.** *Measured from `data/training_plans_inventory.csv`:* **all 7 HYROX plans are `sport = Running`** *and* **all 13 Half/Full plans are `sport = Triathlon`**, *so both tiles were distances wearing a sport's clothes and double-listing plans that already sat inside their neighbour.* **Meanwhile Duatlón (10) and Fuerza (2) had no tile at all.** 🔑 *The audit spotted Ironman. It did not spot HYROX doing the identical thing, or the 12 plans reachable from nowhere — and fixing Ironman alone would have left a chooser that still did not add up.* **Now: four sports = 152, a secondary "o por objetivo" line for HYROX and Ironman, and a sentence naming Duatlón and Fuerza. 152 + 12 = 164.** ⚠️ ***Do not put a distance back in that row.***

**Also shipped, all three from the audit and all verified in a browser:**

- **The sport facet is hidden on a sport hub.** `/planes/running/` was offering Ciclismo and Duatlón as checkboxes: ticking one navigates nowhere and un-ticking Running empties a page whose identity is Running. 🔑 ***A control that can only take you off the page you are on is not a filter, it is a broken link with a checkbox*** — and it is the strongest "admin tool" signal the page had. *Hidden, not deleted: the preset checkbox is what `catalog-filters.js` reads to know which sport the hub is.* **`/planes/running/` now shows Distancia · Nivel · Duración · Características, and `/planes/` still shows Deporte.**
- **Tiles became a row of links.** No radius, no shadow, no fill; hairline separators, name left, count right. *Six identical white boxes invite comparison and offer nothing to compare — the only difference between two of them is a word and a number.*
- **The hub hero is one paragraph.** Five hubs had two plus a "Ver planes" button pointing at a grid already on screen. *The second paragraph moved BELOW the catalogue rather than being cut — it is a real selling point, and under the grid it reads as a footnote to a decision instead of a delay before one.* **`.plan-hero` bottom padding 48 → 24px: on `/planes/` the stack put 132 px of nothing between "Elige tu objetivo" and the four links that answer it.**

**Measured after:** `/planes/` 3,307 px desktop and 5,719 px mobile, `/planes/running/` 3,000 px, zero horizontal overflow at 390 and 1440, 12 of 164 cards visible, `npm test` exit 0.

**Still open from the audit, and not done here:** cards → rows in the catalogue itself, the PDP, and All-Access merchandising. *Two follow-ups this pass created rather than closed:* **`/planes/duatlon/` and `/planes/fuerza/` have no hub**, which is why Phase 1 criterion 4 is still only half met and why those 12 plans are named in a sentence rather than given a link.

---

## Phase 2 — All-Access, and letting a stranger see the members area

**Absorbs `open-loops.md` NOW → "Nothing in the library is visible to a prospect."** *That item's three options — ungate one tool, screenshots, or a screen capture — are this phase's opening decision and are not decided here yet.*

**Definition of done:** a prospect can see a real members tool working before paying, and the All-Access page shows the product rather than describing it.

**The asymmetry to exploit:** the zones calculator **already has a public sibling** — indexed, working, and the only tool a stranger can touch. *That pattern is proven; the question is which second tool earns the same treatment.*

**Open, and Iván's:** ungate one more tool as a public taste, or ship real screenshots, or both. `site/_data/library.json` stays the single source for what the library contains.

---

### Phase 2 — All-Access reordered, September 10, 2026

**The page explained the SKU and never showed it.** Iván's read: *"Math is a benefit. The product is the dark timer and 'the plan appears on your TP calendar.' Show those first."*

**New order, all three languages — WHAT before WHY:** hero as a statement (not the old rhetorical question) → **how a plan gets onto your TrainingPeaks** (four steps + a real calendar + a session opened from the inside) → **the members area moving** (the activation loop in a phone frame + the zones calculator) → **a tool you can run logged out** → the Zwift argument → *Haz la cuenta* → what's included → the library → FAQ.

**Measured:** the first picture of the product moved to **y≈1,300**; the maths to **y≈4,900**; the sixteen-card library grid became **three rows**. Zero horizontal overflow at 390 and 1440, `npm test` exit 0, register sweep clean.

**Three calls made in the build:**
- 🚨 **The loop is Spanish-only, and EN/PT get their own-language still in the same frame.** *Shipping the ES recording on the English page is `ai-infrastructure-documentation.md` §40 exactly — Spanish chrome on four EN/PT pages for three weeks.* **When an EN recording exists it is a two-line swap and nothing else changes.**
- **One device on the page.** The phone frame is on the loop only; the zones calculator stays a desktop crop, because it is a table you read. *Iván's rule: a page where every image is framed reads as a template.*
- **The live-demo block is deliberately not styled like a library card.** It is a product you can open, not the seventeenth tile in a grid.

⚠️ **An athlete's name was on one of the source screenshots** (`Luis Casillas`, on the coach dashboard) and was cropped out before the asset entered the repo. *This repo's standing rule is that customer names never enter it; on a public sales page it is also a consent question.* **Check every screenshot for names before it ships, every time.**

---

### Phase 2 — the PDP rebuilt, September 10, 2026

**Two passes in one day, and the second reversed part of the first.** *Morning: Iván asked for colour — "at least one card in dark the same as Training peaks is doing when they offer premium". Afternoon: he read the live page and an external audit, and the read was sharper than the ask.*

**His two sentences are the whole brief:** *"before sharing anything about the plan we put in front of the user 2 options… two prices, and they don't even know where they are standing"* and *"the moment you scroll down, we are back to having 4 boxes of bullet points with no separator, no color in between, no nothing."*

#### The first-screen rule this page now obeys

🚨 **One price and one primary action.** *The morning's build put this plan's price beside All-Access's, which asks a reader to pick a commercial model before they have decided the plan is theirs.* **All-Access survives in the rail as one sentence and one link — never a second button, which would be the same defect in smaller type — and the card moved to a full-width carbon band mid-page.**

🔑 ***The numbers made the trade cheap, and they came from `monthly-close/2026-08.md`:*** *All-Access went* **3 → 1 subscriber, NRR 27.3%**, *and the one remaining subscriber has never logged in.* **Its problem is delivery, not exposure** — so the first screen was being spent arguing for a product that currently converts nobody, against the product that actually sells.

#### The audit's one concrete asset recommendation was the worst move available

**It said to reuse the banner images Iván already serves from the VPS inside his TrainingPeaks listings.** *They were opened before answering.* 🚨 **`vp_es.png` bakes five sentences into an 880 KB PNG** — different typeface, different palette (teal/olive/gold), `coach@triaperformance.com` rendered as pixels — **and all five panels state things the page already says in HTML.** 🚨 **`header_running_es.png` carries the retired `TP / TRIATHLON & RUNNING PERFORMANCE` lockup, not the current wordmark, and "+1000 planes vendidos" baked in where no one can ever correct it.**

⚠️ ***Iván's own message contains the reason they exist:*** *"I have a 4000 char limit and… I can only use `<p> <h1> <h2>` and `<font>`."* **They are the output of a constraint we do not have here.** *Inheriting a workaround's output onto 328 pages, three files per surface, untranslatable and unindexable, would have undone the design refresh on the largest indexed surface the site has.* **The general rule: an asset built to survive someone else's CMS is evidence of that CMS, not a design decision to import.**

#### What was built instead

- **Hero chips** replace the meta line and the flag row: `16 semanas · Avanzado · Por ritmo · 6:42 h/sem · Incluye gimnasio`. *Hours per week is the figure most people decide on and it was the furthest from the top.*
- **The week, as an object rather than a table row.** Stat blocks per discipline — count, hours/week, longest — plus rest days. **It replaces the breakdown table and the morning's spec list, which were stating sessions-per-week twice.** ⚠️ ***A seven-day calendar is NOT derivable and was deliberately not built:*** *session counts sum to exactly 7 on only* **145 of the 301** *plans with breakdown data — doubles push 62 to 8 and 33 to 9 — so a weekday grid would be wrong on half the catalogue.* **What is honest is the shape of the week, not the days of it.**
- **Heat, for the first time on a plan page, on the longest session** — `--heat` at **5.18:1 on white, sampled from rendered pixels**. *§3.3 licenses Heat for "the hard end of something"; the longest session is the hard end of the week and the figure that decides whether a plan fits someone's Sunday. If that stops being true the colour goes, not the figure.*
- **Prose rhythm:** two sections on different grounds (wash, then white) with the carbon band between them. **The separator is made of product, not decoration.**
- **One image:** a real TrainingPeaks calendar with a plan applied. 🚨 *It is not this plan's week and the caption says so in all three languages — a screenshot of another calendar presented as "your plan" is the one error class on this page that would matter.*
- **The foot All-Access module was retired** (`all-access-module.njk` deleted, now included nowhere). *With the band mid-page and a line in the rail it was the third mention of one product on one page, and it made the last thing a reader saw a different product than the one the page sells.*

#### Two defects found by building, not by the suite

🚨 **`.chip` is defined only in `members-carrera.css` and `admin-secuencias.css`, neither of which a plan page loads.** *The chips row was written as `class="chip"` and would have rendered as unstyled inline text on 328 pages, with a clean build and a green suite.* **Renamed `.plan-chip`.** *Same reason `.plan-shot` is not All-Access's `.aa-shot`.* ⚠️ **Sixth and seventh instance of this branch's one recurring defect — a style written against one context and reused in another — and the first two caught before rendering rather than by it.**

🚨 ***"Puedes entrenar {sessions} días por semana" — the copy called sessions days, in all three languages.*** *`weeklyTotals.sessions` sums session counts and excludes rest days, so on* **66 of 301 plans it stated more than 7 training days a week**, *and on* **123** *it overstated because of doubles.* **It survived a month because nothing on the page contradicted it — the week block put the rest-day count directly above the sentence and it became obvious in one render.** *Now "sesiones por semana", which is what the number is. The Product schema description uses the same string and was wrong in the same way.*

#### And one thing that was tried and measured away

⚠️ **The rail is not sticky.** *It was written sticky, on the reasoning that the buy button is the only actionable thing on the page. Measured: after scrolling 1,600 px the button sat at viewport* **y = −1,039**. *A sticky child travels only within its own grid area, and that row is as tall as the week block beside it.* **Making it real means one grid wrapping the whole page, which is what the full-bleed carbon band and the two wash sections are built out of.** *Not traded. The rule was deleted and the comment now records why, rather than claiming a behaviour the page does not have.*

**Measured after, four page variants (ES, EN, PT, and one of the 27 with no breakdown data):** horizontal overflow **0** at 390 and 1440 · **one price and one primary** above the fold, All-Access band at y≈1,300–1,400 · one form per page · Buy at y≈520–560 desktop and y≈520–650 phone, before the week block on mobile · the no-breakdown variant degrades to a single centred rail rather than an empty column · `npm test` exit 0 · register sweep 0 lines.

#### Third pass, same day: the wrong-fit exit becomes a comparison

**Iván asked for "the plan alternative offering to improve", carrying a second audit note.** ⚠️ ***Most of that note was auditing the LIVE page, which is still the pre-rebuild version because none of this is pushed*** — the rail, the week blocks and the single help CTA it lists as missing were already in the working tree. **Checked item by item against the current build rather than answered from the ticket:** H1 renders **once**, forms **one**, filled primary buttons **three** (Buy top, Buy foot, All-Access). *Two claims survived, and one recommendation was new and good.*

**The new one, built:** *"¿No te encaja del todo?" plus two text links was a footnote.* 🔑 **A person on the wrong plan needs a comparison, not a whisper** — they cannot judge "Ver la versión para Intermedio" without the weeks, sessions, hours and price that made them reject this one. **It is now a `También puedes` row of up to three `.catalog-card`s after the first prose block**, ahead of the All-Access band, so the page reads as a ladder: *not this one → these three → or all of them.*

- **The same component as `/planes/`, not a second card system.** *`.catalog-card` is defined in `plan-page.css`, which plan pages already load — checked before writing it, because `.plan-card`, the obvious-looking name, lives only in the four sport-hub stylesheets and would have rendered nothing.*
- **The eyebrow carries the RELATION, not sport · distance.** *Every sibling is the same sport and distance by construction, so the catalogue's eyebrow would print the identical string three times.*
- **Their CTA renders as a link, not a filled button.** *On the catalogue these cards are the primary action; here the primary is Buy. Three filled blue buttons below it is the competing-CTA defect at a distance.* **Measured: three filled primaries on the page, and none of them is an alternative card.**
- **Nothing hardcoded.** `plans.js` derives the family. **`ref()` was widened from three fields to the card's set** — still primitives only, with `weeklyTotals` copied field by field, because *that* is what keeps plan A → sibling B → sibling A from blowing Eleventy's data cascade.
- **Coverage: 303 of 328 pages show a row** — 67 with three cards, 129 with two, 107 with one, 25 with none. *A plan with one sibling shows one rather than being padded from another sport.*

**The second surviving claim, fixed:** *the audit said "H1 printed twice". The H1 renders once — but the breadcrumb printed `plan.displayName` in full directly above an `<h1>` printing the same string, and these titles run to 90 characters, so the page opened with the same long sentence twice.* **Truncated to 48 characters.** 🔑 ***The observation was right and its stated mechanism was wrong, which is the case worth checking rather than accepting or dismissing.***

**Not done, and why:**
- **The TP banner images**, re-raised: decided against above, on the files themselves. *Not an open question.*
- **A sticky rail**, re-raised: tried and measured away above.
- **A "next distance" card slot.** *Siblings are scoped same-sport-same-distance in `plans.js`, so this needs a distance ladder per sport (5K→10K→21K→42K, Sprint→Olympic→70.3→140.6) that does not exist in the data.* **A real addition, not a template change — left for Iván to decide whether it earns its build.**
- **Trimming "Cómo funciona el entrenamiento"**, which is the same 80/20 paragraph on every plan page. *True, and it is coaching copy Iván owns — `methodology.md`, not a design call.*

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
