# Race Page — Content Outline (one-pager, no code)

~~**Status: planning only.** Written July 30, 2026. Trigger to build: Storefront Phase 1 plan template ships (`open-loops.md`).~~ ***Corrected August 14, 2026: the trigger fired on August 6, 2026*** *when the plan template shipped and the storefront went live. Status is* **UNBLOCKED, queued as `open-loops.md` NEXT #1, not started** *— not "planning only." Same stale trigger as `race-landing-pages-longlist.md`; both sat eight days past their own condition. Written July 30, 2026.* Data source: `data/races.csv` + `training_plans_inventory.csv` join (see `race-page-data-schema.md`). Voice/visual rules: `brand-guidelines.md`.

## Site IA placement

The site already has a sport-subfolder pattern for intent hubs: `site/planes/running/`, `site/planes/triatlon/` (ES), mirrored at `site/en/plans/` and `site/pt/planos/`. Race pages slot in as children of the matching sport hub, not a new top-level section:

- ES: `/planes/running/[race-slug]/` (marathon, half marathon) · `/planes/triatlon/[race-slug]/` (70.3, full)
- EN: `/en/plans/running/[race-slug]/` · `/en/plans/triathlon/[race-slug]/`
- PT: `/pt/planos/corrida/[race-slug]/` · (no PT triathlon race pages per the inventory floor — see longlist)

This means a race page inherits the same hub → race → plan page click path the site already uses for intent hubs → individual plans, and picks up GA4/Clarity/canonical/sitemap for free via `layouts/base.njk` (per the standing new-page checklist). `noindex` stays off (default) — these are public, indexable acquisition pages, same category as the blog.

`transKey` front matter: set per race across its ES/EN/PT siblings where more than one exists (e.g. Rio has both an ES and PT audience) so hreflang and the language switcher wire up. A race that only qualifies in one language (e.g. Boston, EN-only) just doesn't get a `transKey` match — no hreflang block emits, which is correct.

## Page sections, in order

**1. Hero**
Race name + next edition date + one-line hook pulled straight from `course_hooks` (e.g. "The world's third-fastest marathon course" for Valencia, "Race at 2,240m altitude" for CDMX). One primary CTA below the fold pointer, not in the hero itself, per brand-guidelines' one-CTA-per-section rule.

**2. Course guide**
The actual differentiator. Renders `course_profile`, `elevation_gain_m`, and `course_hooks` from the race row as short, specific paragraphs — not generic "here's what to expect" filler. This is the section that has to survive a skim from someone who's run the race before and would spot a generic AI page instantly. Includes `typical_weather` and any qualifying context (`qualifying_relevance`) as a short callout, not a full section of its own.

**3. How to train for it**
This is where `methodology.md` earns its keep — training-zone framework, periodization logic, and fueling guidance adapted to the specific demands the course guide just raised (altitude pacing for CDMX, heat/hydration for Cartagena, hill-specific work for São Paulo, downhill-quad prep for Boston). Not a rehash of the course section; it answers "so what do I actually do differently because of that."

**4. Plan recommendations, laddered by level**
Live join per `plan_matching_rule` in the schema: Beginner / Intermediate / Advanced, filtered to durations that actually fit the countdown to `next_edition_date`. Same laddered-offer pattern already standard on plan pages: plan (one-time) → plan + testing-and-zones consultation (+$50, top 20 sellers only — offer owned by `growth-roadmap.md` §Storefront decision 3; *updated Aug 11, 2026, this read "20-min onboarding call … top sellers only"*) → All-Access ($39.99/mo, pitched to marathon/tri/multi-goal athletes specifically — this is exactly the athlete profile All-Access targets).

**5. All-Access module**
Same promo block used on every plan page (per `growth-roadmap.md` §Training Plan Storefront, standing decision 6) — no new copy to write, reuse the existing module.

**6. Email capture**
Before any TrainingPeaks redirect, per the non-negotiable Phase 1 rule. "Get this race's training plan by email" framing reads more natural on a race page than the generic plan-page copy — worth a race-specific capture headline, not a big lift.

**7. FAQ**
Built from `registration_notes`, `qualifying_relevance`, and the race-specific target queries in `target_queries_*` — these are literally the questions the page is trying to rank for, so the FAQ should answer them close to verbatim ("How do I qualify for Boston?", "How hot does it get at Ironman 70.3 Cartagena?", "Is the Mexico City Marathon hard because of altitude?"). Product/FAQ schema markup is the same Rich-Results-Test-validated pattern already planned for plan pages.

## Linking to plan pages

Every plan recommendation in section 4 links to that plan's existing page (`/planes/p/[plan_id]/` etc.) — not a new plan URL, per the evergreen rule (the race page is the new surface, the plan page is unchanged). Race pages should also get a reciprocal mention: a plan page for a marathon plan can surface "training for a specific race?" links to the 1-3 race pages in its language that are currently live, once more than a couple exist. Not required for the first batch, worth adding once Tier 1 pages ship.

## What this outline deliberately leaves out
No code, no template syntax, no `.njk` structure — that's the build session's job once the plan template exists. This is the section list and data dependencies only.
