# Race-Specific Landing Pages — Longlist, Schema, Tiering & Gathering Plan

**Status: planning complete, Tier 1 data gathered. Not blocking anything — trigger to build is the plan template (Storefront Phase 1) shipping.**
**Written: July 30, 2026.** Companion files: `data/races.csv` (Tier 1 dataset), `race-page-content-outline.md` (page structure), `training_plans_inventory.csv` (source of truth for plan matching).

Standing concept (locked): pages are **evergreen**. A page carries the race's year and data; the plans behind it never do. "Valencia Marathon 2027" is a data update to a page, not a new plan or a new page. No race-year-stamped plans get built again (see `open-loops-archive.md` for the decision, `growth-roadmap.md` §Training Plan Storefront for catalog priorities).

---

## 1. Inventory reality check — what actually qualifies

**Corrected July 30, 2026 (Iván's review).** The rule is: at least 3 matching plans in a (distance, language) pair to build pages there. It's a floor, not a target — once a pair clears it, every real race in that pair gets a page ("if there are 3 full Ironman plans in English, we move forward — we promote whatever Ironman we have; if that's 10 Ironman races, we build the 10 landing pages"). No additional per-race curation once the floor is cleared.

Race pages only make sense where the underlying (distance × language) combination has enough plan depth to fill a real facet ladder (Beginner/Intermediate/Advanced × duration × intensity type — see §1b). Because plans are **generic, not race-specific**, this qualification is done once per (distance, language) pair — every race in a qualifying pair is fair game; every race in a non-qualifying pair gets excluded regardless of how big the race is.

Pulled from `data/training_plans_inventory.csv` (381 rows). Two counts shown: published-only (`is_published=TRUE`), and total including plans flagged unpublished — because that flag has confirmed staleness in both directions (see the callout below the table).

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
