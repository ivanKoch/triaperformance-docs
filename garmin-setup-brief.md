# Garmin setup — public article + members guide

**Status: v1 SHIPPED in all three languages, September 3, 2026.**

| | Public article | Members guide |
|---|---|---|
| ES | `/blog/garmin-dice-sobreentrenamiento/` | `/members/garmin/` |
| EN | `/en/blog/garmin-says-youre-overtraining/` | `/members/en/garmin/` |
| PT | `/pt/blog/garmin-diz-que-voce-esta-em-overtraining/` | `/members/pt/garmin/` |

*All six share `transKey: garmin-sobreentrenamiento`, so hreflang wires the three articles together. Each article's `toolCta` points at the calculator **in its own language** — that was the failure in the lead-magnet emails (§25) and it was checked here rather than assumed.*

**Source:** a draft Iván supplied, already SEO-targeted. The physiology was sound; the work here was the split, the zone mapping, and the guardrail.

## Why two pages and not one

***The split is what stops this being the duplication problem we spent a day fixing.*** Each page owns something the other does not:

| Public article | Members guide |
|---|---|
| **Why** the watch is wrong: age-based defaults, auto-detection overwriting tested values, cadence lock, how to read HRV and Training Readiness | **The doing:** the 7→5 zone mapping with real percentages, per sport, and the TrainingPeaks ↔ Garmin relationship |
| Generic fixes anyone can apply | Requires Iván's zone model, so it only makes sense behind the gate |
| Ends at the **public zones calculator** | Ends by pointing back at the public article for the long explanation |

**The public page is the point.** All of this session's strategy work said the funnel has no middle — cold traffic hits a paywall with nothing free to touch. This article's core instruction is *"enter your tested zones"*, and the public calculator is where a stranger gets them. `toolCta: zones` plus an inline link in a `datanote`. **Someone searching "garmin says I'm overtraining" is anxious, has done a test or is about to, and lands on a working tool.**

## The gap in the source, and the fix

The draft said *"input the exact baseline zone percentages"*. **Garmin gives five heart-rate fields; this model has seven** — 1, 2, X, 3, Y, 4, 5. An athlete following the draft opens the app, sees five boxes, and stops.

***Iván's mapping, in his own words to athletes, and it is lossless because X and Y are sub-ranges rather than extra zones:***

- Garmin Z2 runs from **zone 2's floor to X's ceiling** (X is part of zone 2)
- Garmin Z4 runs from **Y's floor to zone 4's ceiling** (Y is part of zone 4)

Everything else maps one to one. No gaps, no overlaps.

**Rendered by a new `garminZones` shortcode, never typed.** Same reasoning as the existing `zoneTable` shortcode, which exists because four published articles once hand-typed the seven-zone table and all four drifted from `data/zones.csv`. *A hand-typed Garmin mapping would drift the same way — and would then contradict the calculator the article sends people to.* The shortcode also **asserts the carve-outs are contiguous** (`X.ceiling == z3.floor`, `Y.floor == z3.ceiling`) and fails the build if a future CSV edit breaks that, because a broken carve-out would silently produce a gap or an overlap in the mapping.

## The guardrail

`triaperformance-project-instructions.md` says: *nothing Garmin-specific that would exclude Polar or Wahoo athletes.* This article is entirely Garmin.

**Iván's call: Garmin title, real section for the others.** The title targets the search volume — nobody googles the platform-neutral version — and a section covers Polar, Coros, Suunto and Wahoo, because the failure mode is identical everywhere: the device estimates your zones and then quietly re-estimates them. ***Do not delete that section to tighten the article; it is what keeps this inside the guardrail.***

## Corrections made to the draft

- **"A chest strap is mandatory" → softened.** Optical wrist sensing is fine for steady easy work; it fails on intervals, in the cold, and on the bike. An arm-band optical sensor is the middle ground. The original phrasing sells hardware the reader may not need.
- **Cadence lock is more common cycling than running** — wrist flexed on the bars plus road vibration — and worse in cold. Not in the draft.
- **"TrainingPeaks to Garmin zones" was in the target-query list with no content behind it.** Now the members page's second half: TrainingPeaks owns prescription and load, Garmin owns what you see on the wrist, and a retest means **two** updates, not one.
- Closing line rewritten: the draft ended *"As a Triaperformance athlete..."*, which only works for people already inside.

## Open

- **Translated Sept 3, 2026.** `library.json` moved the members guide from `soon` to `live` in EN and PT in the same pass, and **every `live` entry across all three languages was re-checked against `site/members/` on disk** — the rule that file added after `cyclistcore` and `strength` were both sold before they existed. All 33 entries have a page.
- **The article is not in the content engine.** It was hand-built because the content already existed and was good. *If it performs, it is the template for the next platform-problem article — and those are worth feeding through `/admin/ideas/new`.*
