# Race-Specific Landing Pages — Longlist, Schema, Tiering & Gathering Plan

~~**Status: planning complete, Tier 1 data gathered. Not blocking anything — trigger to build is the plan template (Storefront Phase 1) shipping.**~~

> ***Status corrected August 14, 2026 — the trigger fired eight days ago and this line never noticed.*** *Storefront Phase 1 shipped and the plan template went live **August 6, 2026** (`ai-infrastructure-documentation.md` §17, verified against the live site — 321 individual plan pages then, 328 now). `open-loops.md` NEXT #1 already lists race landing pages as* **the next big branch**. *So this doc's own header said "not blocking anything" while the thing it was waiting for had happened and the work had been promoted to next-in-queue.* ***Current status: UNBLOCKED, queued as NEXT #1, not started.*** *A "trigger to build" written into a doc header is a status claim that nothing re-reads on the day the trigger fires — see the structural proposal in the Aug 14 audit.*
**Written: July 30, 2026 · verified: 2026-08-14 — UNBLOCKED (NEXT #1), NOT STARTED (Iván).** Companion files: `data/races.csv` (Tier 1 dataset), `race-page-content-outline.md` (page structure), `training_plans_inventory.csv` (source of truth for plan matching).

Standing concept (locked): pages are **evergreen**. A page carries the race's year and data; the plans behind it never do. "Valencia Marathon 2027" is a data update to a page, not a new plan or a new page. No race-year-stamped plans get built again (see `open-loops-archive.md` for the decision, `growth-roadmap.md` §Training Plan Storefront for catalog priorities).

---

> ### 🚨 STANDING DECISION, September 5, 2026 — what a race page is for
>
> **"The SEO should come from the content and not from the plans we are selling there."** *(Iván.)* **This section's whole premise — qualify a (distance, language) pair by plan depth, then build pages there — is retired.** The ladder is complete at both distances in all three languages, so **inventory is not a gate and it never needs checking again before opening a race page.**
>
> **What replaces it:** a race earns a page when there is enough *distinctive, sourced, training-relevant* material about it to write something a runner would read — course shape and where people blow up, conditions with real numbers, cut-offs, what actually happens to the field, and the questions people genuinely ask. **Field size is a demand proxy, not the gate.** A 4,000-finisher race with a signature climb and a documented cut-off problem beats a 40,000-finisher race with nothing specific to say.
>
> **The plan join is now fixed and trivial** — 42 km: 3 difficulties × 12/18 weeks. 21 km: Beginner 16w, Intermediate 16w, Advanced 12w. *Research never touches it; the page sells against it once someone is already reading.* **`race-page-data-schema.md`'s `plan_duration_weeks_available` and `plan_matching_rule` columns are constants, not per-race research.**
>
> *Consequence for the research briefs: the discovery pass is done (Grok's 166 marathon rows). The live job is* **content dossiers per race** *— `Claude outputs/grok-trial-research-briefs.md` §1A for 42 km, §1B for 21 km.*

## 1. Inventory reality check — what actually qualifies

> 🚨 **CORRECTED September 5, 2026 — the table below is the July 30 state and is superseded. Re-derive from `data/training_plans_inventory.csv`; do not maintain a copy here.**
>
> **Marathon (42 km) is 46 rows today: ES 19 / EN 18 / PT 9** — not the 66 this section's table implies. **The July numbers were not wrong, they were stale**, and the drift is the instructive part: this table's own note said the race-year-stamped plans (Tokyo/Boston/London/Barcelona/Lima "2026") were "already being retired." **The retirement happened.** ES marathon went 34 → 19. Zero race- or year-stamped names remain in any 42 km row. Every row in the file is now `is_published=TRUE`, so the published/total distinction this section draws no longer has a second side.
>
> **STANDING DECISION, September 5, 2026 (Iván): the facet ladder is 3 difficulties × 2 durations on ONE intensity type. Not 24 variations.** *His words: "most coaches only have three difficulty levels and that's all — pretending to have twenty-four variations to cover every single use case is the wrong approach."* The 24-cell grid was an analytical frame, never a build target, and treating it as one made a complete catalogue look two-thirds empty.
>
> **The baseline is the ladder that exists in all three languages, and for the marathon it is already complete:**
>
> | 42 km ladder | ES | EN | PT |
> |---|---|---|---|
> | **HR / no gym — THE BASELINE** | **6/6** | **6/6** | **6/6** |
> | Pace / no gym | 6/6 *(3 cells doubled at 18w)* | 6/6 | 1/6 |
> | Pace / + gym | 3/6 | 6/6 | 0/6 |
> | HR / + gym | 0/6 | 0/6 | 2/6 |
>
> ***Nothing needs to be built for the marathon race pages to ship.*** *18 plans, six cells per language, 100% populated. The branch is gated on the page template, not on inventory — the opposite of what was assumed on September 5 before the file was read.* **The only real marathon gap is PT pace (5 plans), and it is an enhancement, not a blocker.**
>
> **The half marathon baseline — DECIDED September 5, 2026, by taking Portuguese as the floor and checking it upward.** *Race-prep halves after excluding the weight-loss plans filed at 21 km:* **ES 8 / EN 3 / PT 3.**
>
> | difficulty | duration | ES | EN | PT |
> |---|---|---|---|---|
> | Beginner | **16w** | 415231 | 437638 | 437632 |
> | Intermediate | **16w** | 439917 | 439920 | 439919 |
> | Advanced | **12w** | 415245 | 437635 | 437630 |
>
> *All pace-based, all no-gym.* **PT and EN are structurally identical — the same three cells, nothing more in either.** ES matches the floor exactly and adds a separate **14-week tier** (Beginner+gym, Intermediate ±gym, Advanced ±gym), which is a different product concept rather than a deeper ladder.
>
> ***The uneven durations are the design, not a gap.*** *Duration scales inversely with ability, and all three languages name it the same way: Base/Prep → Build → Peak; "Concluir a Prova" → "Foco em Resistência" → "Foco em Performance."* **A beginner gets 16 weeks and an advanced runner gets 12 because that is the coaching call, so the template must not treat the missing 12w-Beginner cell as a hole to fill.**
>
> **⚠️ The two distances have different baselines, and the template has to carry both:** *42 km is* **HR, 3 difficulties × both durations (6 cells)**; *21 km is* **pace, 3 difficulties × one duration each (3 cells)**. *This falls out of what happens to exist in Portuguese, which is arbitrary rather than principled.*
> 🔭 **The unifying move, if it is ever worth 5 plans: PT marathon pace (currently 1/6). That would make PACE the single baseline at both distances in all three languages** — and pace is the more accessible basis anyway, since it needs no strap.
>
> **Also flagged:** two Spanish and one English row at `21 km` are `[Objetivo 2026] Plan para bajar de peso` weight-loss plans. They inflate every half-marathon count taken from this file. *Open question for Iván: give weight-loss plans their own `distance` value rather than letting them sit at `21 km`.*


**Corrected July 30, 2026 (Iván's review).** The rule is: at least 3 matching plans in a (distance, language) pair to build pages there. It's a floor, not a target — once a pair clears it, every real race in that pair gets a page ("if there are 3 full Ironman plans in English, we move forward — we promote whatever Ironman we have; if that's 10 Ironman races, we build the 10 landing pages"). No additional per-race curation once the floor is cleared.

Race pages only make sense where the underlying (distance × language) combination has enough plan depth to fill a real facet ladder (Beginner/Intermediate/Advanced × duration × intensity type — see §1b). Because plans are **generic, not race-specific**, this qualification is done once per (distance, language) pair — every race in a qualifying pair is fair game; every race in a non-qualifying pair gets excluded regardless of how big the race is.

Pulled from `data/training_plans_inventory.csv` (~~381 rows~~ **328 rows as of Aug 12, 2026** — *count corrected Aug 14, 2026; 381 was the row count on July 30. Every row is now published, so the "two counts shown" distinction below no longer has a second side — published-only and total are the same set. Re-derive the tiering from the current CSV before building, not from the counts printed here.*). Two counts shown: published-only (`is_published=TRUE`), and total including plans flagged unpublished — because that flag has confirmed staleness in both directions (see the callout below the table).

| Distance | ES | EN | PT | Qualifies (≥3 plans)? |
|---|---|---|---|---|
| Marathon (42k) | 34 published (41 total) | 18 published (36 total) | 14 published (21 total) | **ES / EN / PT all yes** — deepest distance by far. The unpublished totals here are almost entirely legacy race-year-stamped plans (Tokyo/Boston/London/Barcelona/Lima "2026" editions) already being retired per the no-race-year-stamped-plans decision — **don't count those toward qualification, they're the exact pattern this initiative replaces.** |
| Half marathon (21k) | 10 | 4 | 3 | ES yes; EN marginal-yes; **PT exactly at the floor — build cautiously, 1-2 pages max** |
| 70.3 | 7 | 4 | 1 published (2 total) | ES yes; EN marginal-yes; **PT fails even counting the unpublished row — no PT 70.3 pages** |
| Full / Ironman (140.6) | 6 | **3 total (1 published, 2 flagged unpublished) — QUALIFIES** | 1 published (2 total) | ES yes; **EN now yes (corrected — see below); PT still fails** |

**Correction: EN full-distance Ironman now qualifies.** Original pass counted `is_published=TRUE` only and found 1 EN full-distance plan — wrong. The real EN full-distance ladder is 3 plans, matching Beginner/Intermediate/Advanced exactly as it should:

| plan_id | difficulty | weeks | is_published | name |
|---|---|---|---|---|
| 441721 | Beginner | 22 | **TRUE** | 22 Week Full Distance Prep (First Timer Focus) |
| 442088 | Intermediate | 22 | FALSE | 22 Week Full Distance Build (Polarized 80/20) |
| 439815 | Advanced | 24 | FALSE | 24 Week Full Distance Peak (Advanced Polarized) |

These three read as a deliberately complete Beginner/Intermediate/Advanced family (Prep → Build → Peak), not a partial or deprecated set — the `is_published=FALSE` flag on two of them looks like a stale-data bug, the same category of issue as the July 29 Lima plan_id mix-up, just the reverse direction (real plan flagged unpublished instead of a dead plan flagged published). **Action item for you: confirm 442088 and 439815 are actually live/sellable on TrainingPeaks, then flip `is_published` to `TRUE` in `training_plans_inventory.csv`** (same protocol as the Lima case in `open-loops.md`). Until that's confirmed, treat EN full-distance as qualified-but-verify, not fully clean.

**Same stale-flag pattern found in two more places, both PT, both still below the 3-plan floor even generously counted:** PT Triathlon/Half has a matching unpublished Beginner sibling (567304) to the published Intermediate plan (567744) — total 2, still fails. PT Triathlon/Full has an unpublished Beginner sibling (567305) to the published Advanced plan (439860) — total 2, still fails. Worth the same TrainingPeaks confirm-and-flip pass, but it doesn't change either exclusion.

This matches and sharpens `content-engine-brief.md`'s finding ("PT has nothing outside marathon, 5k, 10k/21k/FTP") — for race pages specifically, **PT is a marathon play, full stop**, with half marathon as a stretch, not 70.3 or full.

## 1b. Facets within a qualifying (distance, language) pair — not just difficulty

Corrected per Iván: the ladder inside a qualifying pair isn't only Beginner/Intermediate/Advanced. `training_plans_inventory.csv` carries three more real facets that the race page (and the storefront facet filters already planned in `growth-roadmap.md` Phase 1 — "features: strength/power/HR/pace") need to expose:

- **Intensity type** — `pace_based` / `hr_based` / `power_based` columns. An athlete should be able to choose zones by pace, heart rate, or power. Confirmed real in ES marathon: the 💓 heart-rate family (434678, 434681, 434684 + 18wk siblings), the ⏱️ pace family (476494-476525, 612551-612561), and at least one ⚡ power/Stryd plan (476791). **Data quality gap found:** plan 476791 is explicitly named "Maratón con Potencia ⚡ (Stryd)" but its `pace_based`/`hr_based`/`power_based` columns are all `FALSE` in the CSV — the intensity-type columns aren't fully reliable yet. This needs a cleanup pass before the facet filter (storefront or race page) can trust them blindly; flagging here rather than silently patching, since you may have more context on which plans are actually power-based than the CSV currently reflects.
- **Strength add-on** — `strength` boolean column. Some plans are "the same plan + gym work" (e.g. 612551 "Maratón Base (Carrera + Gym)" vs. 434678 the pure-running equivalent). This should be a checkbox facet, not folded into difficulty.

Net effect on the schema: `plan_matching_rule` (in `race-page-data-schema.md`) now joins on distance + language + weeks-countdown + difficulty + intensity_type + strength, not just the first three. Not every difficulty × intensity × strength cell is populated for every distance/language — the template needs to degrade gracefully (fall back to nearest available intensity type) rather than show a dead facet combination.

Plan matching itself is **not stored per race** — it's a live join at render time against `training_plans_inventory.csv`. This is what keeps the pages evergreen: as a race date approaches, the same page automatically surfaces shorter/closer-fit plans without anyone touching data. Full mechanism in `race-page-data-schema.md`.

---

## 2. Full candidate longlist by market

### ES — Spain + Latin America

**Marathon** (34 plans, no constraint): Valencia, Buenos Aires, Ciudad de México, Madrid, Barcelona, Santiago (Chile), Sevilla, Lima, Bogotá (full marathon distance, distinct from the half), Medellín, Rio de Janeiro (yes — an ES-branded Rio marathon plan already exists in the catalog, likely built for LatAm Spanish-speaking travelers).

**Half marathon** (10 plans): Bogotá, Medellín, Valencia (Spain), Madrid (Rock 'n' Roll Madrid), Buenos Aires, Santiago (Chile).

**70.3** (7 plans): Cartagena, Cozumel (if run as separate 70.3/full weekends — verify), Pucón (Chile), Puerto Varas (Chile). Spain-based 70.3s exist too (Marbella, Vitoria-Gasteiz history) — not verified this session.

**Full / Ironman** (6 plans): Cozumel, Pucón (Chile — Ironman Latin America Championship history, verify current full-vs-70.3 format), Vitoria-Gasteiz (Spain — confirmed full-distance, 2026 edition already ran 12 Jul), Barcelona/Calella, Tenerife, Los Cabos.

### EN — Majors + big US/UK races

**Marathon** (18 plans): Boston, NYC, Chicago, London, Berlin.

**Half marathon** (4 plans — marginal, build 1-2 only): Great North Run (UK, world's largest half marathon), NYC Half.

**70.3** (4 plans — marginal, build 1-2 only): Oceanside, St. George, UK options (Staffordshire, Weymouth).

**Full / Ironman** (3 plans — corrected, see §1, verify the 2 flagged-unpublished plans before publishing): **now qualifies.** Once verified, promote every real EN-market full-distance Ironman with a real following — Ironman Texas, Ironman Chattanooga, Ironman Wisconsin, Ironman Coeur d'Alene, Ironman Louisville, Ironman Ottawa (Iván's own example) are all reasonable candidates; no further curation needed per the "if we have 10, we build 10" rule once the floor is cleared. Added to Tier 2 below pending verification of the plan_id flags.

### PT — Brazil + Portugal

**Marathon** (14 plans): Rio de Janeiro, São Paulo, Porto Alegre, Florianópolis (Floripa), Lisboa (EDP Lisbon Marathon), Porto, Santiago (Chile — PT-branded plan already exists for LatAm Portuguese-speaking travelers), Brasília.

**Half marathon** (3 plans — exactly at the qualification floor): Lisboa (Meia Maratona Internacional de Lisboa — large, well-known field), Porto. Build at most 1-2 pages here and flag the thin inventory on each.

**70.3 / Full**: **excluded — PT has only 1 matching plan in each.** No PT triathlon race pages (Floripa 70.3 included) until inventory grows.

---

## 3. Tiering + search-window calendar

### Ranking basis
Search volume proxy (race size/prestige), inventory depth in that language, and timing — specifically, how close the race's **peak search window** (≈4-6 months before race day) is to right now (July 30, 2026).

**Important framing for this specific moment:** the plan template hasn't shipped yet, so *every* Tier 1 race below is already inside, or has already passed, its "ideal ship-by" date for the race's next confirmed edition. That's not a reason to deprioritize — it's the reason to prioritize the whole initiative once the template is unblocked. Once live, each page is evergreen and simply rolls forward to the following year's edition; the cost of "missing" this cycle's peak window is one year of search capture, not a wasted build.

### Tier 1 — gather fully now (12 races done July 30, 2026 + California International Marathon added same day as a 3-language test case = 13 rows in `data/races.csv`)
Selected for the strongest combination of race size, inventory depth, and — where a distance/language combo was otherwise thin (EN 70.3, ES half/70.3/full, PT marathon) — for covering the full distance × market matrix Iván asked for, not just marathon. Full data in `data/races.csv`.

| Race | Market | Distance | Next edition | Months out (from Jul 30 2026) | Build-order rationale |
|---|---|---|---|---|---|
| Mexico City Marathon | ES | 42k | 2026-08-30 | ~1 | Soonest race date; huge ES market (Mexico); altitude hook is unique content |
| Buenos Aires Marathon | ES | 42k | 2026-09-20 | ~1.7 | Largest Argentine marathon; dual BQ + AbbottWMM qualifying hook |
| Chicago Marathon | EN | 42k | 2026-10-11 | ~2.4 | World Marathon Major; flattest/fastest US major, strong PB-content angle |
| NYC Marathon | EN | 42k | 2026-11-01 | ~3 | Largest EN marathon by field size (50k+); 50th anniversary edition in 2026 |
| Ironman Cozumel (full) | ES | 140.6 | 2026-11-22 | ~3.7 | Only full-distance race with enough inventory (ES); IRONMAN LatAm Championship |
| Ironman 70.3 Cartagena | ES | 70.3 | 2026-11-29 | ~4 | Explicitly named as a target; strongest heat/humidity content hook in the set |
| Valencia Marathon | ES | 42k | 2026-12-06 | ~4.2 | Flagship ES/European PB course; #3 fastest marathon in the world |
| Ironman 70.3 Oceanside | EN | 70.3 | 2027-03-28 (est.) | ~8 | Only viable EN 70.3 anchor at current inventory depth (4 plans) |
| São Paulo Marathon | PT | 42k | 2027-04 (est.) | ~8.5 | Brazil's oldest marathon; hilly-course angle differentiates it from Rio |
| Boston Marathon | EN | 42k | 2027-04-19 | ~8.6 | Highest evergreen content value in English regardless of date — BQ search volume is massive and year-round |
| Rio de Janeiro Marathon | PT | 42k | 2027-06 (est.) | ~10 | Best-known Brazilian marathon internationally; strongest PT marketing hook (coastal scenery) |
| Bogotá Half Marathon | ES | 21k | 2027-07 (est.) | ~12 | One of the largest half marathons in the world (42k+ runners); World Athletics Platinum Label |
| **California International Marathon (CIM)** | **EN, ES, PT — same race, 3 language pages** | 42k | 2026-12-06 | ~4.2 | **Experiment/test case, added at Iván's request July 30, 2026** — not selected by the standard ranking criteria, selected to test-build the full 3-language template pattern (transKey/hreflang, per-language plan join, per-language content) end to end on one real race before committing to the rest of the batch. "Fastest road to Boston" BQ-chase positioning is a strong EN hook; the ES/PT versions are a technical proof of the pattern more than a claim of real ES/PT search demand for a Sacramento regional race — see `data/races.csv` confidence_flags on this row. |

### Tier 2 — qualified, not deep-researched (build next once Tier 1 pages are live)
Madrid Marathon, Barcelona Marathon, Santiago Marathon (Chile), Lima Marathon, Medellín Marathon, Ironman 70.3 Pucón, Ironman 70.3 Puerto Varas, Berlin Marathon, London Marathon, Porto Alegre Marathon, Lisboa Marathon, Valencia Half Marathon (Spain), Madrid Half Marathon. **EN full-distance Ironman, newly unlocked (verify the plan_id flags in §1 first):** Ironman Texas, Ironman Chattanooga, Ironman Wisconsin, Ironman Coeur d'Alene, Ironman Louisville, Ironman Ottawa.

### Tier 3 — longlist only, lower priority or thinner signal
Sevilla Marathon (ES), Bogotá Marathon — full distance, distinct from the half (ES), Quito Marathon (ES, unverified size), Montevideo Marathon (ES, unverified size), Ironman Vitoria-Gasteiz — full (ES, 2026 edition already passed, next ~Jul 2027), Great North Run (EN half), NYC Half (EN half), Lisboa Half Marathon (PT, at the 3-plan floor), Porto Half Marathon (PT, at the 3-plan floor).

**Explicitly excluded, don't build:** any PT 70.3 or full-distance race page including Floripa 70.3 (2 matching plans at most, even counting unpublished — see §1). Revisit if/when inventory in those cells grows past 3 plans. EN full-distance is no longer on this exclusion list (corrected above).

---

## 4. What's still an estimate, not a fact

Flagged per-race in `data/races.csv`'s `confidence_flags` column, but worth restating: several Tier 1 "next edition" dates are **estimates** because the 2026 edition of that race already happened before this research session (Bogotá Half, Oceanside 70.3, Rio Marathon, São Paulo Marathon) and the 2027 date hadn't been officially published as of July 30, 2026. Re-verify these four specifically before they go live on a page — don't publish an estimated date as if it were confirmed.
