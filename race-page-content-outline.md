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

**6. Plans, laddered → All-Access → email capture.** The ladder is a constant, not a per-race lookup (see below). Same laddered offer as every plan page: plan → plan + testing-and-zones consultation (+$50) → All-Access ($39.99/mo). All-Access module and capture form are the existing partials, reused unchanged. Capture comes before any TrainingPeaks redirect — non-negotiable, Phase 1 rule.

## Dates, and why nothing here is ever blank

Organisers publish on wildly different horizons: Boston has 2027 and 2028; Mexico City ran in August and will not name an April-2027 registration date for months. **Two fields, not one.**

- `typical_window` — always filled, prose. "Late August." "First Sunday in December."
- `next_edition_date` — filled only when the organiser has published it.

The page renders whichever exists and never presents an inference as a confirmed date. Registration behaves identically: `registration_window` as prose ("lottery opens late January"), exact dates only when published.

**A missing date does not weaken the page, and the reason is a coaching argument worth making on it:** nobody starts an 18-week block from zero on a start date. You arrive at a specific block already active. So the plan ladder shows in full regardless of the countdown — *there is no date filter on the plan join.*

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
- PT — ⚠️ **open:** `site/pt/planos/` has `ciclismo`, `ironman`, `maratona`, `p` and no running hub. PT races go under `maratona` or a new `corrida` hub is created. Decide before the first PT page.

`transKey` set across a race's language siblings so hreflang and the switcher wire up; a single-language race simply emits none. `noindex` stays off — these are public acquisition pages. Everything else (GA4, Clarity, canonical, sitemap) comes free from `layouts/base.njk`.

Hero image per race: 3:2 at 1600 and 960, matching the site hero convention, at `/assets/images/races/<race-slug>-1600.jpg`. `automation/resize-blog-images.py` needs one added mode for this — blog cards are 16:10 at 1400 and do not match.

## Deliberately not here

No template syntax, no `.njk` structure, no field list. Fields are `race-page-data-schema.md`'s job and follow from the blocks above.
