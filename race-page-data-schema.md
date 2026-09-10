# Race Page — Data Schema

**Rewritten September 10, 2026.** Backs `data/races/<race_id>.json` — **one JSON file per race, not a CSV row.**

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

- `registration_window` — **always filled**, prose. "Lottery opens late January." "Loyalty window the week after race day, general ballot mid-December."
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

## Not in this schema, deliberately

- **No plan fields of any kind** — no `plan_id`, no `plan_duration_weeks_available`, no `plan_matching_rule`. The ladder is a constant. Storing plan IDs per race would recreate the race-year-stamped-plan problem this initiative was built to kill.
- **No hero-image field** — the filename is `race_id` by convention.
- **No price** — prices live on plan rows.
- **No testimonial** — sourced from `social-proof-and-reviews.md`'s quote bank at render time.
- **No kit collection, expo hours, bag drop, shirt swaps or transport to the start.** These fail the outline's test and they are the fastest-decaying facts about any race, so carrying them would break the evergreen rule on every page at once.

## Open

**The two São Paulo races need distinct ids.** `sp-city-marathon` (Iguana, July, Pacaembu → Jockey) and the Yescom Maratona Internacional (April, Ibirapuera) are different events in the same city, dossiered separately in batches 1 and 4. One hero image currently exists under `sao-paulo-marathon`; the second race needs its own id and its own photo before either page ships.
