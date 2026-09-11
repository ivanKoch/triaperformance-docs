# Race Page — Content Outline

**Rewritten September 5, 2026 (Iván).** *Updated September 11, 2026 — §Corrections the first six pages earned, added after two review rounds, then extended the same day with what the second six added and what the last seven added — the 42 km set closed at 19 races / 26 pages.* Home doc for what a race page contains and in what order. Data fields: `race-page-data-schema.md`. Voice and visual rules: `brand-guidelines.md`. Plan ladder: `race-landing-pages-longlist.md` §1.

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

## Corrections the first six pages earned

*Added September 11, 2026, after Valencia, Monterrey, Sevilla, Barcelona, Boston and Miami shipped and went through two review rounds. **Every rule below is a defect found on a built page, not a preference.** Read this before writing race #7 — it is cheaper than the review that produced it.*

**1. The entry state is stated beside the plan ladder, not only in block 4.** A page that sells a 12-week block to someone who cannot get a bib for eleven months is selling the wrong thing quietly. `registration_state` (`open` / `window` / `sold_out`) renders a one-line state next to the cards, and `registration_when` carries the prose. Valencia and Monterrey are `sold_out`, Boston and Miami are `window`, Sevilla and Barcelona are `open` — and the plans still show in full on all six, because the block is trained before the bib exists, not after.

**2. Course segments are disjoint, and named by place rather than by kilometre range alone.** Barcelona shipped with "km 18-27" in one sentence and a second segment overlapping it; a reader cannot tell whether that is two problems or one described twice. It became "Paral·lel, Poble-sec y Montjuïc por la base." **A kilometre range is a coordinate, not a name** — an athlete recognises a place on the course, and two named places cannot silently overlap the way two ranges can.

**3. Where a race is discussed in miles, print both units every time.** Boston: `milla 20 (km 32)`, `Millas 16-21 / km 26-34`. The Spanish-speaking athlete running Boston reads mile markers for one morning and kilometre splits for every other day of the block; choosing one unit makes the page wrong for one of those two readers. Applies to any US race — Chicago, New York, Miami.

**4. A race page never cites another race's numbers.** Miami's heat section originally compared itself to Sevilla's temperatures. Two costs, and the second is the expensive one: it creates a maintenance edge between two files that no rule owns, **and it is a literal shared string between two pages, which is precisely the signal the clone detector in `races.js` exists to catch.** Compare to a generic reference ("a typical European winter marathon") instead. The comparison survives; the coupling does not.

**5. A label never restates the sentence below it.** Boston's entry-state label carried the full sentence the body then repeated underneath. Labels are three or four words (`Inscripción cerrada`); the sentence lives once.

**6. The coach hook is per-race and mandatory.** `coach_hook` is one sentence, race-specific, in the carbon banner — *"treinta kilómetros de bajada que no se siente como esfuerzo mientras la corres, y cuatro subidas colocadas justo donde el daño ya está hecho."* A generic hook is worse than none: it is the one line on the page that has to sound like a coach who has watched this race, and a template sentence reused across six cities reads as a template sentence reused across six cities.

**7. A ladder rung that does not mean what it normally means gets a `plan_note`.** Boston's sub-90 km block is the beginner rung everywhere else and is not one here: nobody reaches Boston without a qualifying time, so that rung only makes sense for someone who already holds a bib and wants to finish. The note says so, next to the cards. **The ladder stays constant; the note explains what it means on this race.** Same rule wherever a qualifying standard, an altitude or a cut-off changes what a rung is for.

**8. Beyond 18 weeks out, the page says what to do now.** A start-by date alone, twenty-six weeks out, reads as "come back in eight weeks" — and the athlete who reads that leaves. The ample phase states the start-by date *and* what the eight weeks before it are for. The four phases are `undated` / `tight` (<12w) / `band` (12-18w) / `ample` (>18w), computed, never written per race.

**9. The hero does not restate block 1.** Sevilla's hero repeated the flatness the verdict block states with numbers one screen down; it became the 11 °C swing between gun and finish — a fact block 1 does not carry. The hero earns its place by saying something the rest of the page does not.

### What the second six added

*September 11, 2026, after Ciudad de México, Buenos Aires, Medellín, Nueva York, Berlín and Río — 19 pages across three languages. Four of these are template defects the first six never surfaced because nobody had authored the field that breaks.*

**10. Every prose field is markdown, and the template has to render it — this is now gated.** Six fields were printed raw: course profile, elevation note, weather, start time, registration window and model, qualifying, corral policy. They looked fine for six races because nobody had written `**bold**` in them. The moment a race needed emphasis in its weather line, the page showed its own asterisks. **The rule is now mechanical: a prose field renders through `raceProse`, a field that feeds a schema or FAQ answer through `plainProse`**, and `automation/race-page-check.js` fails the build on any `**…**` that reaches the HTML. *The general shape of this bug is worth the sentence: a field that is never exercised is not a field that works, it is a field nobody has tested.*

**11. A race that is days away gets its own phase, and the whole ladder.** `imminent` (under three weeks) was added beside `undated` / `tight` / `band` / `ample`. Without it, Buenos Aires — nine days out — would have rendered "Faltan 1 semanas: ya estás dentro de la ventana del bloque de 12", which is both ungrammatical and false. **And an imminent page shows both durations, not just the 12-week one**: the page has just told the reader these blocks are for next year, so cutting the ladder to the block that fits *this* year answers a question the page itself retired.

**12. The field note must not open by restating the year stamp.** The template already prints "Datos de la edición 2025." above it. Four notes then began "De la edición 2025…". The note's first sentence is the one piece of interpretation on the whole stats block — spend it on what the numbers mean, the way Valencia's does ("un 2:59:59 fue aproximadamente el puesto 5.450 de unos 30.500").

**13. The coach banner is not the hero in different words.** New York shipped a first draft where both sentences were about the Queensboro emptying onto First Avenue. They are the two sentences a reader actually remembers, they sit three screens apart, and they must carry two different ideas — the banner's job is *what a fixed plan cannot do*, not *what this race is*.

**14. `name` is the short market name, and the 60-character title clamp decides how short.** "Maratón de la Ciudad de México" does not fit with the year appended; the page is "Maratón de la CDMX" and the full name lives in `official_name`. The gate catches this, but it is cheaper to pick the short name when writing the file than to find out at build time.

### What the last seven added

*September 11, 2026, closing the 42 km set at 19 races and 26 pages (es 14 / en 5 / pt 7): Bogotá and Santiago in ES; Lisboa, Porto, Porto Alegre and the two São Paulos in PT. Three of these are the same class of defect as rule 10 — a feature nobody had exercised.*

**15. Authored prose is markdown, and that includes lists and tables.** `raceProse` rendered paragraphs and bold and nothing else, so a bullet list of cut-off gates came out as one run-on line with stray hyphens in it, and a table came out as a wall of pipes. Medellín and Berlin had been shipping that for a day. `raceProse` now renders three block shapes — bullet list, pipe table, paragraph — which is what the content was always written in. **São Paulo's six CET cut-off lines are a table because they are a table**; writing them as a sentence would have been a worse page to keep the renderer simple.

**16. `x-default` has to exist on pages with no Spanish sibling.** The hreflang block emitted it only when `alts.es` existed, so every Portuguese-only and English-only page on the whole site shipped without one — invisible until five PT-only races arrived at once. It now falls back es → en → pt. *This was never a race-page bug; race pages were just the first surface with enough single-language pages to expose it.*

**17. The Portuguese pages are Brazilian Portuguese, including the Portuguese races.** Lisboa and Porto were drafted in European Portuguese, which is more natural for their local audience and wrong for this site: the plans are Brazilian, the nav is Brazilian, `raceUi.json` says *você*. A page in one variant framed by furniture in the other is worse than either variant used consistently. **Mixed variants on one page are the defect; the choice between them is a judgement call and the site already made it.** (`brand-guidelines.md` §8 owns voice and does not yet carry this line for Portuguese the way it does for Spanish.)

**18. A race whose organiser publishes no entry window gets no entry-state block.** `registration_state` is not required, and Lisboa and Porto leave it empty rather than guessing between "open" and "closed". A missing block is honest; a wrong label next to the plan cards is a claim. *And `window` is the right value far more often than `sold_out` — `sold_out` means the places existed and went, `window` means the window is shut.*

### The fifth ladder phase — `late` *(Iván's call, September 11, 2026)*

The bands were split at the wrong end. `imminent` was added for races days away, and everything from three weeks to twelve kept the same sentence: *"ya estás dentro de la ventana del bloque de 12."* At eleven weeks that is true. **At four weeks — Lisboa, live — it is the page contradicting its own arithmetic in its own voice.**

**Five phases now:** `undated` · `imminent` (<3 weeks) · **`late` (3 to 8)** · `tight` (8 to the shortest block) · `band` · `ample`.

**The threshold is eight weeks and it is a coaching position, not a number someone picked.** Above it, a runner already training can compress the opening weeks of a twelve-week block and arrive at the specific work intact. Below it, compression stops being compression and becomes a different plan. `LATE_WEEKS` in `site/_data/races.js` is the single place it lives.

**What a `late` page does — and what it does NOT do.** It keeps the cards and changes the sentence: the block already started, you come in late by compressing the lightest early weeks and preserving the last ones, and starting from zero today is the thing that does not work. *It does not demote the ladder, hide it, or promote 1:1 above it.* The alternative — lead with coaching, label the cards "entras tarde" — was considered and not taken: it trades plan revenue for coaching leads in precisely the window where search demand for that race peaks, and the honest sentence already tells the reader what they need.

⚠️ **This is live on a page nobody flagged.** New York is seven weeks out, so the largest English page in the set now says the twelve-week block should already have started. That is correct and it is the point — but check it before assuming the change only touched the two Portuguese races.

*Two things fixed alongside it, both the same defect in miniature:* the plans intro claimed **"tres niveles y dos duraciones"** on every page including the ones that render one duration — the cards carry the duration in 22px, so the intro no longer claims it. And every price on the site is billed by TrainingPeaks in US dollars, which reads like a typo as "US$ 24.00" on a Portuguese page; there is now one line saying so, in all three languages rather than only Portuguese, because the ambiguity is identical in Bogotá and Santiago.

### Provenance, place names and the cluster *(September 11, 2026, from an external audit)*

**19. City and country are per-language, and no post-build check can defend this one.** They were plain strings, so an English page said *"Race guide · Nueva York"*, carried `alt="Nueva York, Estados Unidos"`, and put **`"addressCountry": "Estados Unidos"` inside its `SportsEvent` JSON-LD**. Six of the twelve non-Spanish pages were wrong. ⚠️ **The other six were correct only because "Portugal" and "Brasil" are the same word in both languages** — the bug was invisible on exactly the pages that would have caught it.

*The defence is the shape of the data, not an assertion about the output, and that is the general lesson:* a wrong-but-well-formed place name is indistinguishable from a right one once rendered, so `races.js` now **drops a race that publishes in more than one language without a per-language `city` and `country`**. There is no way to write the same check against the built HTML, and pretending otherwise would have been worse than no check.

**20. The page says who wrote it.** A byline under the hook, and `Article` JSON-LD carrying an `author`. `FAQPage` says what the page answers and `SportsEvent` says what the race is; neither says who stands behind it, which was the half of E-E-A-T these pages lacked. **The author is a reference, not a copy** — name, URL and `sameAs` only, resolving to the About page where the full `Person` with every credential lives. Copying `hasCredential` onto 26 pages would put one claim in 27 places, and `person-schema.njk`'s own rule is that structured data cannot be recalled once indexed.

**21. US races get US dates in English.** *April 19, 2027*, not *19 April 2027*, on Boston, New York and Miami — and day-first everywhere else, including Berlin and Valencia in English. Derived from `country.en`, which only became possible once the country knew what language it was in.

## The cluster: a hub and sibling links

Twenty-six guides with nothing linking to them is a topical cluster with no centre, and it was the strongest point in the audit. Two pieces:

**The hub**, one per language — `/planes/running/guias-de-carrera/`, `/en/plans/running/race-guides/`, `/pt/planos/running/guias-de-prova/`, `transKey: race-guides-hub`. **Generated from `races.byLanguage`, so a new race appears the moment its JSON file exists** and nobody edits the hub to add a city. Ordered by race day with the undated races last, because a reader here is choosing a race and "when is it" is the first filter they apply. Linked from all three running hubs.

**Sibling links**, two or three per race, at the bottom of the page — after the questions, before the sources, because a reader who did not choose this race is choosing another. **Editorial, not derived.** Pairing by rule (same country, same distance) produces junk neighbours; a human picking *the two races a reader is actually deciding between* does not. Ids only, resolved per language, and a sibling with no page in that language silently drops — which is what lets a Spanish-only race sit in the list of a race that also publishes in Portuguese.

### Taken on review and closed — do not re-open

- **Cap the ladder at three cards.** Rejected — **asked and refused three times now (Aug review, Sept 11 morning, Sept 11 evening).** The 3 × 2 matrix *is* the product structure, and the facet buttons exist to navigate it. A cap would hide inventory that is already built and already sells.
- **Hide the ladder on a race with no published date.** Rejected. It contradicts the standing decision in §Dates with the coaching argument behind it: nobody starts an eighteen-week block from zero on a start date, so a missing date is not a reason to hide the offer. Santiago shows the full ladder and says to count back from the window.
- **Align the Portuguese prices with the Spanish ones, or stop cross-linking the language siblings.** Rejected. Price is a purchasing-power lever (`triaperformance-pricing-and-positioning.md`) and hreflang exists to connect differently-priced markets, not identical ones.
- **Split Portuguese into PT-PT and PT-BR.** Rejected, and for the same reason as the Spanish one below: the catalogue, the navigation and `raceUi.json` are Brazilian, and a page in one variant inside furniture in the other is worse than either used consistently. *Revisit only if Portugal becomes a target market rather than a place some Brazilians fly to.*
- **Split Spanish into es-ES and es-419.** Rejected — it contradicts the one-Spanish standing rule in `brand-guidelines.md` §8 and would fork every ES surface on the site to serve six race pages.
- **Strip the figures out of body prose.** Rejected. The figures are the anti-clone differentiator; removing them is the fastest way to turn nineteen pages into a doorway set.
- **Map the volume band to a goal time on the card.** Rejected. "90-110 km/week ⇒ sub-3:15" is a coaching claim the inventory does not support and the methodology does not make. The card prints the number; the athlete and the coach do the mapping.

## Deliberately not here

No template syntax, no `.njk` structure, no field list. Fields are `race-page-data-schema.md`'s job and follow from the blocks above.
