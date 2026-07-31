# Race Page Data Schema

**Status: proposed July 30, 2026, revised same day after Iván's review.** Backs `data/races.csv`. Companion: `race-landing-pages-longlist.md`, `race-page-content-outline.md`.

**Revision note:** the original version of this schema only joined plans on distance + language + weeks + difficulty. That undercounted real inventory (missed 2 of 3 EN full-distance Ironman plans because they're flagged `is_published=FALSE` — likely a stale flag, see `race-landing-pages-longlist.md` §1) and left out two real, already-planned facets: intensity type (pace/HR/power) and the strength/gym add-on. Both fixed below.

## Design principle
One row per race in `data/races.csv`. The page template reads a row plus a **live join** against `training_plans_inventory.csv` — it does not store plan IDs statically. This is what makes the whole system evergreen: as a race date approaches or passes, the same row keeps producing the right plan recommendations without a data edit. The only thing that goes stale in `races.csv` is the race's own facts (date, course, hooks) — which is exactly the "update the page, not the plan" model already agreed.

## Fields

**Identity**
- `race_id` — slug, e.g. `valencia-marathon`. Used for the page URL and as the join key from any internal link.
- `race_name_es` / `race_name_en` / `race_name_pt` — display name per language. Empty where no page exists in that language (e.g. Boston has no `race_name_es`).
- `city`, `country`.
- `language_market` — **resolved this session:** comma-separated list on a single row (e.g. `EN,ES,PT` for California International Marathon), not one row per market. `race_name_es`/`race_name_en`/`race_name_pt` and `target_queries_es`/`_en`/`_pt` already carry the per-language content, so a second row would just duplicate the race facts (dates, course, hooks) for no reason. A race only gets a language in this list where the (distance, language) pair clears the 3-plan floor — e.g. Boston stays EN-only, Valencia stays ES-only, but a race like CIM or Rio that has real (or, for CIM, test-purposes) multi-language relevance lists all three.
- `distance` — `42k` / `21k` / `70.3` / `140.6`.

**Race facts**
- `next_edition_date` — ISO date where confirmed; otherwise a clearly-labeled estimate string (see confidence_flags below). This is the field that makes the page "carry the year."
- `typical_month` — for the recurring/evergreen pattern, independent of the exact confirmed date.
- `registration_notes` — lottery vs. direct entry, qualifying windows, field size, sell-out risk. Feeds FAQ content directly.
- `course_profile` — flat/rolling/hilly, one line, plus `elevation_gain_m` as a separate field so it can be sorted/compared across races later if useful.
- `course_hooks` — **the differentiator field, and the reason this schema exists.** Free text, real research per race: Heartbreak Hill, CDMX's 2,240m altitude, Valencia's flatness, Cartagena's heat — whatever makes training for *this* race different from generic advice. This is what a thin auto-generated page can't fake.
- `typical_weather` — race-day conditions, feeds both the hooks and FAQ.
- `qualifying_relevance` — BQ, Abbott World Marathon Majors, World Athletics Platinum Label, IRONMAN Championship status, or "none." Directly answers a real search intent for the majors.

**Plan matching (the join, not a static list)**
- `plan_duration_weeks_available` — which week-counts actually exist in the inventory for this distance+language (e.g. marathon ES = `12,18`). Static reference so the template knows what's possible.
- `plan_matching_rule` — documents the full join, corrected this session: `sport` + `distance` + `language` filter, `weeks ≤ floor((race_date − today)/7)`, then a facet ladder of **difficulty** (Beginner/Intermediate/Advanced) × **intensity_type** × **strength add-on** — not difficulty alone. Written out per row mainly so a future build session (or Hermes) doesn't have to reverse-engineer the logic from code.
- `intensity_type` (facet, not a races.csv column — read live from `training_plans_inventory.csv`'s `pace_based`/`hr_based`/`power_based` booleans) — lets the athlete choose zones by pace, heart rate, or power, exactly like the storefront facet filter already planned in `growth-roadmap.md` Phase 1 ("features: strength/power/HR/pace"). **Known data-quality gap:** at least one plan (476791, "Maratón con Potencia ⚡ (Stryd)") has all three flags `FALSE` despite being named as power-based — these columns need a cleanup pass before either the storefront or a race page can trust them without spot-checking. Not something to silently auto-correct; flag for Iván to confirm plan-by-plan, same as any other catalog data-quality item.
- `strength_addon` (facet, same source, `strength` boolean column) — some plans are the pure-endurance plan plus gym work (e.g. 612551 "Maratón Base + Gym" vs. 434678, the same tier without it). Surface as a checkbox, not folded into difficulty.
- **Template behavior when a facet cell is empty:** not every difficulty × intensity × strength combination exists for every distance/language. The template must degrade gracefully — fall back to the nearest available intensity type (e.g. no power-based Advanced/18wk plan exists → show the HR- or pace-based Advanced/18wk plan instead) — rather than render a dead facet combination or a "no plans found" state. This needs to be a real rule in the build, not an edge case discovered in QA.

**SEO**
- `target_queries_es` / `target_queries_en` / `target_queries_pt` — real target search queries in whichever language(s) the page exists, semicolon-separated. Only the relevant language column gets filled per row.

**Provenance**
- `sources` — URLs actually used, semicolon-separated. Every Tier 1 row has at least one.
- `confidence_flags` — anything not fully verified: estimated dates, figures sourced from secondary blogs rather than official race sites, anything that needs a re-check before the row goes live on a page. Treat this column as a pre-publish checklist, not decoration.

## What's deliberately NOT in this schema
- **No plan_id column.** Storing specific plan IDs per race would recreate the exact "race-year-stamped plan" problem this whole initiative exists to kill — a plan_id baked into a CSV row goes stale the moment that plan is retired or a better-fitting one is added. The join stays live.
- **No price field.** Prices live on the plan rows in `training_plans_inventory.csv`; a race page never needs to know a price directly, only which plans qualify.
- **No testimonial/review field.** Reviews are sourced from `social-proof-and-reviews.md`'s quote bank at render time, same pattern as the blog's `planCard` shortcode — not duplicated into this file.

## Resolved this session
The multi-market question from the first draft is settled: `language_market` is comma-separated on one row (see above), tested live on the California International Marathon row (`EN,ES,PT`) in `data/races.csv`.

## Still open
The `is_published` flag in `training_plans_inventory.csv` has now got two confirmed staleness cases surfaced through this exercise alone (EN full-distance Ironman, PT triathlon half/full siblings) — worth asking whether a broader audit of that column is due before more facets get built on top of it, rather than finding the next one by accident.
