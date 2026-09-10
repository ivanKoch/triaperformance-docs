# Race Page — Content Outline

**Rewritten September 5, 2026 (Iván).** Home doc for what a race page contains and in what order. Data fields: `race-page-data-schema.md`. Voice and visual rules: `brand-guidelines.md`. Plan ladder: `race-landing-pages-longlist.md` §1.

## The test every block has to pass

> **Does the answer change how you train, or whether you choose this race?**

In: course, elevation, altitude, weather, start time, date, how you get in, qualifying standards, cut-offs, and the field numbers that answer "is this fast."

Out: kit collection, shirt swaps, medal engraving, bag drop, expo hours, transport to the start, corral opening times.

> 🚨 **A falsified belief worth keeping, September 5, 2026.** The batch-5 harvest counted runner questions across 18 races and found kit rules asked by 16/18 and the course by only 8/18. That was read as a priority ranking and briefly reordered this page to lead with registration and kit. **It is good data about the wrong population.** "Who can collect my kit" is asked by someone already registered and three days out, with nothing left to sell them; "is Valencia flat" is asked by someone choosing a race or opening a block, which is the window a plan sells in. *Frequency of question is not value of asker.*
>
> **The second reason, which holds even if monetization were irrelevant:** kit venues, expo hours and corral times change every year. They are the fastest-decaying facts about any race, and these pages are evergreen by standing decision. A kit block would force an annual rewrite of every page's top section, forever.

## Blocks, in order

**1. What kind of race this is.** Median finish, sub-3 %, field size, and the cut-off as a pace floor. Answers "is this for me" in one screen. Cut-offs live here, not in their own section — a cut-off is an answer to that question, not a topic.

**2. The course.** Profile, elevation, altitude, and where the field actually comes apart. The differentiator: a tourism site can describe the route, only a coach can say that CDMX punishes a fast Insurgentes opening at km 17–30, or that Boston's mile 20 is the slowest mile every year because the Hopkinton downhill already took the quads.

**3. Conditions.** Race date, typical weather with real numbers, start time. Start time is training-relevant — a 05:30 gun is a body-clock and fueling input, not logistics.

**4. Getting in.** Registration model (lottery / loyalty / direct / qualifying), when entries open, how fast it sells out, and qualifying standards where they apply. Decision input, not administration.

**5. How to train for this one.** `methodology.md` applied to blocks 2 and 3 — altitude pacing for CDMX, downhill-quad prep for Boston, heat and hydration for Cartagena, hills for São Paulo. Not a restatement of the course section: it answers "so what do I do differently because of that."

**6. Plans, laddered → email capture.** The ladder is a constant, not a per-race lookup (see below). Same laddered offer as every plan page: plan → plan + testing-and-zones consultation (+$50) → All-Access ($39.99/mo). All-Access module and capture form are the existing partials, reused unchanged. Capture comes before any TrainingPeaks redirect — non-negotiable, Phase 1 rule.

**7. Questions.** Four to six, built from the facts already on the page — the date, the cut-off, where the field comes apart, when to start counting back, how to get in. Rendered visibly as a `<dl>`, never accordion-only, and emitted as FAQPage JSON-LD **from the same array**, so schema and DOM cannot drift. A SportsEvent block is emitted alongside it, but only where the organiser has published a date.

*Expectation to keep honest: Google restricted FAQ rich results in 2023 to authoritative health and government sites, so this will almost certainly not produce a rich snippet. It earns its place because the questions are what people type, and because it is what gets the page quoted by an assistant.*

## Dates, and why nothing here is ever blank

Organisers publish on wildly different horizons: Boston has 2027 and 2028; Mexico City ran in August and will not name an April-2027 registration date for months. **Two fields, not one.**

- `typical_window` — always filled, prose. "Late August." "First Sunday in December."
- `next_edition_date` — filled only when the organiser has published it.

The page renders whichever exists and never presents an inference as a confirmed date. Registration behaves identically: `registration_window` as prose ("lottery opens late January"), exact dates only when published.

**A missing date does not weaken the page, and the reason is a coaching argument worth making on it:** nobody starts an 18-week block from zero on a start date. You arrive at a specific block already active. So the plan ladder shows in full regardless of the countdown — *there is no date filter on the plan join.*

**Where a date exists, it is turned into the answer people actually want.** "12 or 18 weeks" is abstract; *the 18-week block starts on 2 August* is the query behind "when do I start". Computed from `next_edition_date`, so it is different on every page and cannot be hand-written wrongly. No confirmed date, no invented one — the page says to count back from the typical window instead.

**The year goes in the title, never in the slug.** The event is annual and "maratón X 2027" is a real query shape; keeping the year out of the URL means next year's edition is an update to this page rather than a new one. A race with no confirmed date gets no year rather than a guessed one.

## Optional is optional

Corral policy (is an accredited time required, by when), proof-of-time rules, and sell-out speed are filled where the organiser publishes them and absent otherwise. **No page waits on them, and no research pass is commissioned to find them.** Same for anything else in this outline that a given organiser simply does not publish.

## The plan join is a constant

3 difficulties × 2 durations (12/18w) for the marathon, on heart rate, in all three languages. 21 km is Beginner 16w / Intermediate 16w / Advanced 12w, on pace. Verified against `data/training_plans_inventory.csv` September 5, 2026. **Never researched per race, never gated on, never filtered by countdown.** The uneven half-marathon durations are the coaching design, not a hole to fill.

## Where the content comes from

| Block | Dossier section |
|---|---|
| 1. What kind of race | §5 field, §4 cut-offs |
| 2. The course | §1 course, §2 where runners struggle |
| 3. Conditions | §3 conditions |
| 4. Getting in | §7 registration reality |
| 5. How to train | `methodology.md`, applied |
| 6. Plans | inventory constant |

§6 start logistics and §8 real questions are **not** page sources under this outline. §9 (what is written already) is competitive input for the writer, not page content.

## Site IA

Race pages are children of the sport hub, not a new top-level section:

- ES `/planes/running/[race-slug]/`
- EN `/en/plans/running/[race-slug]/`
- PT `/pt/planos/running/[race-slug]/` — **resolved September 11, 2026.** Portuguese race pages briefly sat under `/pt/planos/maratona/`, which is a *distance* level where ES and EN use a *sport* level; the first half-marathon race page would have split the Portuguese race set across two hubs while the other two languages kept theirs in one. A `running` hub was created and the race template moved while exactly one Portuguese page existed. *(The reason usually given for this — that mismatched paths break hreflang — is false; hreflang exists to map differently-shaped URLs and was emitting correctly across all three before the move. The argument is maintenance.)* `maratona` stays as the distance hub it always was.

`transKey` set across a race's language siblings so hreflang and the switcher wire up; a single-language race simply emits none. `noindex` stays off — these are public acquisition pages. Everything else (GA4, Clarity, canonical, sitemap) comes free from `layouts/base.njk`.

Hero image per race: **2:1 at 960 / 1600 / 2560, `.webp` + `.jpg`**, at `/assets/images/races/<race-slug>-<width>.<ext>`. Widths match the breakpoints `site.css` already uses for the homepage hero. Built by `automation/resize-blog-images.py` from `_incoming/races/<race-slug>.jpg` (races mode added September 10, 2026).

**The race hero is an `<img>`, not a CSS background.** The homepage hero hardcodes its widths per breakpoint in `site.css` and carries an inline LQIP data URI — correct for one image shared by three homepages, unusable for a per-page image that has to come from data. An `<img>` carries `fetchpriority="high"` on its own, so it needs neither the LQIP nor the `hero: true` preload flag. The scrim becomes an overlay element rather than `::before` on a background. This is `design-refresh-brief.md` item 33 (split hero, carbon tokens) applied to a new page type — the hero and the final CTA are two of the four public surfaces §3.3 of the guidelines permits on carbon.

## Deliberately not here

No template syntax, no `.njk` structure, no field list. Fields are `race-page-data-schema.md`'s job and follow from the blocks above.
