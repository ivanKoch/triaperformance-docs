# Race Page — Data Schema

**Rewritten September 10, 2026.** *Updated September 11, 2026 — `registration_state`, `registration_when`, `coach_hook`, `plan_note`, plus the name-strip and Spanish-register rules the first six pages earned.* Backs `data/races/<race_id>.json` — **one JSON file per race, not a CSV row.**

> **Why the container changed, decided while building the first page.** Every other dataset in `data/` is a table because something outside this repo produces it as one: `training_plans_inventory.csv` is a TrainingPeaks export. Race data is the opposite — most of a race is multi-paragraph prose in three languages, and a CSV cell is the wrong container for a paragraph. The July `races.csv` already carried 900-character quoted fields with embedded commas and was unreadable in every tool that opens a CSV. One file per race gives one commit per race and a diff that shows which paragraph changed. `data/races.csv` is superseded; its 13 rows are the old research set and do not match the 19 dossiers. Page structure and the test every field has to pass: `race-page-content-outline.md`. Plan ladder: `race-landing-pages-longlist.md` §1.

## Design principle

One file per race. The template reads the row and renders the six blocks. **Nothing about training plans is stored here** — the ladder is a constant (3 difficulties × 12/18w on HR for the marathon; Beginner 16w / Intermediate 16w / Advanced 12w on pace for the half, all three languages), so the page renders it from the inventory without consulting the race row at all.

**Every field is either always-filled or optional, and the schema says which.** An optional field that an organiser does not publish is left empty and its block simply does not render. Nothing is inferred to fill a gap, and no research pass is commissioned to close one.

> 🚨 **A falsified belief, kept because it explains an absence.** The July 30 version specified plan matching as a live join filtered by `weeks ≤ floor((race_date − today)/7)`, plus a facet ladder across intensity type and a strength add-on. **Both are gone.** The countdown filter was tested against the real inventory on September 3, 2026 and rendered **zero plans for 8 of the 13 races then in `races.csv`** — marathon plans exist only at 12 and 18 weeks, so any race inside 12 weeks showed an empty ladder, which is precisely the window when search demand peaks. The facet grid was retired the same week: *"most coaches only have three difficulty levels and that's all."* **There is no date filter on the plan join, and the reason is a coaching argument, not a workaround** — nobody starts an 18-week block from zero on a start date, so the full ladder is always the honest answer.

## Fields

### Identity — always filled

- `race_id` — slug, and the join key for everything. **It is also the hero-image filename**, so `valencia-marathon` resolves to `/assets/images/races/valencia-marathon-{960,1600,2560}.{webp,jpg}` with no field required. One naming system, not two.
- `race_name_es` / `race_name_en` / `race_name_pt` — display name per language; empty where the race has no page in that language.
- `slug_es` / `slug_en` / `slug_pt` — the URL segment per language, so a Spanish page can be `maraton-de-valencia` rather than carrying an English slug for SEO. **Falls back to `race_id` when empty**, which is the right answer for most races.
- `city`, `country`.
- `language_market` — comma-separated (`ES`, `ES,EN,PT`). Drives which pages get built and which `transKey` siblings exist. `transKey` is `race_id`.
- `distance` — `42k` / `21k`.

### Dates — `typical_window` always, `next_edition_date` when published

Organisers publish on wildly different horizons: Boston has 2027 and 2028; Mexico City ran in August and will not name its next registration date for months. **Two fields, and the page never renders blank.**

- `typical_window` — **always filled**, prose. "Late August." "First Sunday in December."
- `next_edition_date` — ISO date, **only when the organiser has published it.** Empty otherwise. Never an estimate, never an inference: the page shows the window instead, which is honest and still useful.

### Getting in — `registration_window` always, the rest optional

- `last_verified` — ISO date, **always filled**. When the entry and conditions facts were last checked against the organiser. Rendered under that block as a stamp. This is the block that rots every season; a date and a link to the organiser is what can actually be maintained across nineteen races, and it is cheaper than pretending it will be.
- `registration_window` — **always filled**, prose. "Lottery opens late January." "Loyalty window the week after race day, general ballot mid-December."
- `registration_state` — **always filled**, one of `open` / `window` / `sold_out`. Drives the one-line entry state rendered *beside the plan ladder*, not only inside block 4. Added September 11, 2026: a page that sells a 12-week block to someone who cannot get a bib for eleven months is selling the wrong thing quietly.
- `registration_when` — optional, **per-language object** (`{es, en, pt}`). The prose that goes with the state: *"la ventana de solicitud fue del 14 al 18 de septiembre de 2026"*. Kept separate from `registration_window` because that one is the evergreen rhythm and this one is the current edition's specifics.
- `registration_model` — lottery / ballot+loyalty / direct / qualifying-time. Optional.
- `sell_out_note` — optional. "First 10,000 bibs gone in two hours." "67-minute sell-out."
- `qualifying` — optional. BQ standards, WMM status, World Athletics label, the Boston downhill index. Where it applies it is often the strongest block on the page; where it does not, it is empty and renders nothing.
- `corral_policy` — optional. Whether an accredited time is required and by when. **Registration decision, not race-week logistics** — the hours corrals open are deliberately not in this schema.
- `proof_of_time` — optional. What document, in what language, from which qualifying races.

### The course — the differentiator

- `course_profile` — flat / rolling / hilly, one line.
- `elevation_gain_m` — number. Optional; several organisers publish no official figure and a scraped one is not worth the risk.
- `altitude_m` — optional, and where it exists it usually *is* the page (CDMX at 2,288 m, Bogotá, Medellín).
- `course_notes` — free text, the km-by-km shape. From dossier §1.
- `where_they_struggle` — free text, **the field this whole initiative exists for.** Boston's mile 20 as the statistically slowest mile across 110,013 finishers; CDMX's Insurgentes opening paid for at km 17–30; Floripa's runners contradicting the official "80% plano." A tourism site can describe a route; this is the part only a coach writes.

### Conditions

- `typical_weather` — real numbers where they exist, not "can be warm."
- `start_time` — training-relevant: a 05:30 gun is a body-clock and fueling input.

### The field — answers "is this fast"

- `median_finish`, `sub3_pct`, `finishers`, `field_year` — all optional, all from a named source.
- `cut_off` — overall limit, and intermediate gates in clock time where published. **Renders inside block 1** as the pace floor, not as its own section.

### SEO and provenance

- `target_queries_es` / `_en` / `_pt` — semicolon-separated, only for languages the race has a page in.
- `sources` — URLs actually used, semicolon-separated.
- `confidence_flags` — anything unverified. **Treat as a pre-publish checklist, not decoration.** Standing rule: an organiser's reglamento or FAQ wins over any derived reading, and where ours conflicts with theirs that is a question for the organiser, never a claim on a page.

### Voice — always filled

- `coach_hook` — **always filled**, per-language object, **one sentence**, race-specific. It is the carbon banner's only line and the one place on the page that has to sound like a coach who has watched this race. A hook reused across cities is worse than no hook; the publish gate's similarity check treats it the same as `hook` and `where_they_struggle`.

### The ladder, where this race changes what a rung means

- `registration_state` note: a race whose entries are simply *closed until the next cycle* is `window`, not `sold_out`. `sold_out` means the places existed and went; `window` means the window is shut. Nine of the twelve races are `window`, which is what a page built out of season looks like and is not a defect.
- `plan_note` — optional, per-language object. **The one exception to "no plan fields", and it is not one:** it stores no plan id, no duration and no matching rule. It is prose explaining what a rung means *on this race* — Boston's sub-90 km block is the beginner rung everywhere else and here only fits someone who already holds a qualifying bib and wants to finish. Fill it wherever a qualifying standard, an altitude or a cut-off changes what a rung is for. Leave it empty otherwise; most races need none.

## What the card prints, and what a plan name must not repeat

The race card prints the **duration** (22 px, above the name) and the **volume band** (its own chip) as their own elements. The plan name is therefore stripped of both, by `stripDuration` in `.eleventy.js`.

⚠️ **That strip is a segment pass, not one regex per naming convention, and the reason is a defect.** The first version anchored a regex per catalogue and missed the Portuguese shape — `Maratona - 12 semanas - Entre 110 e 135 km por semana - Ritmo` — so every PT card printed its duration twice, in two different type sizes, for as long as it shipped. Names in all three catalogues are separator-delimited (`A | B | C` or `A - B - C`); a segment that is *only* a duration or *only* a volume band is dropped wherever it sits, and a volume band living inside a parenthetical beside the difficulty (`(Beginner <90km)`) keeps the difficulty and loses the band. **The naming conventions differ per language and per catalogue vintage; the meaning of a segment does not.** When a new catalogue shape appears, extend the segment test — never add a fourth anchored regex.

## Writing Spanish into these files

~~🚨 `automation/register-sweep.py` scans `.njk` and does not scan `data/races/*.json`.~~ **Closed September 11, 2026.** *The sweep's default targets were `site` and `automation`; `data/races` is now the third.* The gap was real and it had already cost something — voseo reached a shipped race page through it (`Elegí`, `podés`, `medís`, `sumás`) and was caught by reading rather than by the gate. **The fix was one line, and the reason it took a month is the instructive part: the sweep already handled `.json` files perfectly well. Nothing was broken. The directory simply was not in the list, and a gap that is a missing entry rather than a missing capability does not announce itself.** Run it before shipping Spanish race copy; the second batch turned up five `acá` that the eye had passed over twice.

**Every prose field here is markdown, and the template has to render it.** Bold and paragraph breaks are normal in `course_notes`, `where_they_struggle` and `how_to_train`; they are equally normal in `typical_weather`, `start_time`, `qualifying` and `registration_window`, and those four printed their own asterisks on live pages until September 11, 2026. `automation/race-page-check.js` now fails the build on any `**…**` that survives into the HTML, so this cannot ship again — but when adding a NEW field, wire it through `raceProse` (or `plainProse` where it feeds a FAQ or schema answer) at the same time you add it.

Three more that the first six earned:

- **Percentages go through the `pct` filter.** A dot decimal in a Spanish or Portuguese percentage is wrong in both languages, and JSON gives you one by default.
- **`name` must survive the 60-character title clamp with the year appended.** Boston, Monterrey and Ciudad de México were all caught by the gate rather than by eye: the sponsor — or the full civic name — belongs in `official_name`, and the short market name in `name` (*"Maratón de Boston"*, *"Maratón de la CDMX"*).
- **A race with no combined median finish gets the two-tile fallback,** not an empty block. Boston publishes medians by gender and no overall figure; the block renders both rather than nothing.

## Not in this schema, deliberately

- **No plan fields of any kind** — no `plan_id`, no `plan_duration_weeks_available`, no `plan_matching_rule`. (`plan_note` is prose about what a rung means on this race, not a plan field — see above.) The ladder is a constant. Storing plan IDs per race would recreate the race-year-stamped-plan problem this initiative was built to kill.
- **No hero-image field** — the filename is `race_id` by convention.
- **No price** — prices live on plan rows.
- **No testimonial** — sourced from `social-proof-and-reviews.md`'s quote bank at render time.
- **No kit collection, expo hours, bag drop, shirt swaps or transport to the start.** These fail the outline's test and they are the fastest-decaying facts about any race, so carrying them would break the evergreen rule on every page at once.

## The publish gate

**A race that does not differ does not build.** Nineteen pages from one template is structurally what a search engine calls a doorway set, and the defence is mechanical rather than editorial. Two halves:

`site/_data/races.js` checks what the data alone can show and **drops the offending race** — never throws, because one unfinished city must not stop the other eighteen shipping (the same idiom `plans.js` uses for dead plans). It blocks on: a missing `hook`, `course_notes`, `where_they_struggle`, `typical_window` or `registration_window`; an empty `sources`; an incomplete hero image set; a hero image byte-identical to another race's; and a `where_they_struggle` or `hook` more than 55% similar to one already loaded, per language.

`automation/race-page-check.js` checks what only exists after a build and **exits non-zero**, so it can gate a deploy: hreflang complete and resolving to pages that were built, `x-default` present, title not truncated by the 60-character clamp and carrying the year where a date is confirmed, four breadcrumb nodes, exactly one `<h1>`, valid JSON-LD, **FAQPage matching the visible `<dl>` question for question**, SportsEvent present if and only if a date is confirmed, every referenced hero file present, and the ladder's *shape* identical across the languages a race publishes in.

⚠️ **Shape, not price.** Grok's original template proposed failing a page when the plan price differs by language. That contradicts a standing decision — price is a purchasing-power lever, so the PT marathon ladder is US$ 24/36 against US$ 49.99/59.99 deliberately (`triaperformance-pricing-and-positioning.md`). A check that fires on every run gets silenced, and then so does everything next to it.

## Open

**The two São Paulo races need distinct ids.** `sp-city-marathon` (Iguana, July, Pacaembu → Jockey) and the Yescom Maratona Internacional (April, Ibirapuera) are different events in the same city, dossiered separately in batches 1 and 4. One hero image currently exists under `sao-paulo-marathon`; the second race needs its own id and its own photo before either page ships.
