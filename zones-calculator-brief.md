# Zones Calculator — design brief

**Status:** **v1 BUILT in Spanish, August 10, 2026** — public tool live on four URLs, members copy live, 35 tests passing. Not yet translated; not yet wired to a real capture endpoint. Opened the same day.
**Home doc for this initiative.** Decisions, structure and open questions live here and nowhere else. Build record goes to `ai-infrastructure-documentation.md` when there is one; the open-item line lives in `open-loops.md`.

**Why it exists:** it is the definition of done for the members-area i18n branch, the only tools-library item with a live promise attached (three published articles say a calculator turns your test result into your seven zones), and — as of the decisions below — the site's first public tool.

---

## 1. Decisions locked (Iván, August 10, 2026)

| # | Decision | Consequence |
|---|---|---|
| 1 | **`data/zones.csv` is the source of truth for zone percentages.** The three published articles are wrong and get corrected. | Three article edits. See §5. |
| 2 | **Public tool, gated depth.** *(Refined by decision 5 — the split is not depth but the absence of the funnel plus saved history. See §4.)* | Contradicts what three articles currently promise. See §5. |
| 3 | **Hub + three sport pages, one tool.** Per-sport URLs load the same tool with the sport pre-selected. | Three ranking surfaces, one build, one translation pass. |
| 4 | ~~**The 30' test is the house protocol**, bike and run.~~ **Superseded by decision 12** — the athlete picks from 30' / 20' / 2×8'. `methodology.md` §3 is **not** stale after all. | Nothing to rewrite; §3 gains the 30' bike-power option. |

Earlier standing decision, unchanged: **one tool, not two.** Threshold and zones are a single flow because that is the athlete's actual sequence — test, get a number, get zones from the number.

---

## 2. The zone model — `data/zones.csv`

**Six tables, not one.** This was the single biggest correction to come out of the design pass; an earlier assumption that one percentage set covered every metric was wrong in every direction. Zone 2's floor alone ranges from 70% (bike FTP) to 84% (swim CV).

| Sport | Metrics | Table count |
|---|---|---|
| Running | LTHR, threshold pace, rFTP (running power) | 3 |
| Cycling | LTHR, FTP | 2 |
| Swimming | Critical velocity | 1 |

Seven zones in every table, in order: **1, 2, X, 3, Y, 4, 5.** X sits in the upper half of Z2 (marathon pace, separated because it adds fatigue without proportional benefit); Y sits at the bottom of Z4. Both are house conventions, not standard. Explained in `methodology.md` §4 — and, until it is retired, on `/members/zonas/`.

Every zone has a **floor and a ceiling** — including Z1, which the published articles show as an open-ended "< 80%". **Decision 9: render the bands exactly as the CSV gives them**, no open ends.

**The running and cycling LTHR tables are byte-identical** (72/81/90/95/100/102/105/120). **Decision 10: deliberate** — one shared HR table, modelled as one.

### The implementation detail that decides whether this tool is correct

**Pace percentages apply to velocity, not to pace.** The published article already says this and it is the failure mode to design against: applying 88% to a 4:30 min/km pace directly yields a *slower* number where a faster one belongs, and the whole zone table comes out inverted. Convert pace → velocity, apply the percentage, convert velocity → pace. Same for swim CV.

This deserves a unit test with a known-good fixture, not a visual check — inverted zones look plausible at a glance.

---

## 3. Proposed architecture (not yet agreed)

**`data/zones.csv` feeds both the calculator and the article tables at build time.** Eleventy already reads CSVs in `_data/`; wiring the article's zone table to the same file means the two *cannot* diverge again. This is the fix for the problem in §5 rather than a one-time correction — a second hand-typed copy of these numbers is how we got here.

**One tool, four URLs.** Sport-specific pages carry their own `<title>`, H1 and intro copy, and load the shared tool with the sport pre-selected. Query intent differs enough per sport ("calculadora CSS natación" vs "calculadora zonas FTP ciclismo") that one page can only win one of them.

**Flow, per Iván's description:**

1. *Which sport?*
2. Short description of the test for that sport, and what numbers they will need before starting.
3. Inputs — **separate minute and second fields**, never a single free-text "4:32". This is the most common data-entry failure in tools of this kind and the reason the current dead form on `/members/zonas/` uses text placeholders like "ej: 4:30".
4. Their threshold number, stated plainly and labelled.
5. Their zone table(s).
6. How to load it into TrainingPeaks — including, for swimming, that entering the pace and selecting the 80/20 swimming preset produces the same values.

**Show every metric the athlete actually has, not one "best" one.** The house priority order (bike: power > HR; run: power > pace > HR; swim: pace > RPE) is guidance about which number to *trust* when they disagree, not about which to display. A cyclist with a power meter should see both power and HR zones, with the priority stated.

---

## 3b. Decisions locked in the second design pass (Iván, August 10, 2026)

| # | Decision |
|---|---|
| 5 | **Three surfaces.** Public indexable tool (4 URLs) · email capture *below* the free result · members copy with no capture at all, plus saved values. Detail in §4. |
| 6 | **The lead magnet is "workouts to improve each zone,"** not a PDF and not the zones themselves. The ask lands after the value and is personalised by what they just entered — we know their sport and their threshold at the moment we ask. |
| 7 | ~~**`/members/zonas/` and `/members/tests/` are both retired.**~~ **Reversed Aug 10, 2026 (decision 16): retire nothing yet.** Build the calculator first, then look at what actually overlaps. Sound call — the overlap is a guess until the tool exists. |
| 8 | **The "Empezá acá" onboarding section comes off the members home**, all three languages — it exists to point at the two pages being retired. |
| 9 | **Bounded bands, exactly as the CSV gives them.** No open-ended "below X / above Y". Floor and ceiling are rendered as-is. |
| 10 | **One shared LTHR table** across running and cycling — confirmed deliberate, not a copy-paste artifact. |
| 11 | **Running power is in v1.** Call it **"running power meter"**, never Stryd: these are 80/20 seven-zone power zones, and Stryd ships a different five-zone system. Naming it Stryd would imply the numbers match theirs. |
| 12 | **The athlete picks their protocol.** Bike and run: 30' → LTHR **and** FTP · 20' → LTHR and FTP · 2×8' → FTP only, stated plainly as a limitation of that test. Multiple valid protocols reaching the same place is fine and does not need reconciling across docs. |
| 13 | **Swim CSS = `(t400 − t200) / 2`, in seconds per 100m.** Verified equivalent to the standard `200 / (t400 − t200)` m/s form — an exact identity, not an approximation. Output shown as `m:ss /100m`. |

## 3c. Decisions locked in the third design pass (Iván, August 10, 2026)

| # | Decision |
|---|---|
| 14 | **Cycling 20' test: LTHR = average HR of the final 15 minutes.** Not the whole 20. |
| 15 | **Running has exactly one protocol: the 30' test.** No 20' run option — it was offered in the second pass and is now withdrawn. Cycling keeps all three (30' / 20' / 2×8'). |
| 16 | **Retire nothing yet.** `/members/zonas/` and `/members/tests/` stay until the calculator exists and the real overlap is visible, rather than guessed at now. *(Reverses decision 7. The "Empezá acá" removal in decision 8 still stands — it was executed Aug 10 and its two dead onboarding steps are gone; the library cards still link to both pages.)* |
| 17 | **Saved values are parked.** No `localStorage`, no Postgres, no history in v1. Revisit later. |
| 18 | **All metrics shown, always.** A cyclist with a power meter sees both FTP and HR zones. |
| 19 | **The lead magnet is built after the calculator.** Placeholder link in v1; Iván writes the content. Zone 1's piece is about describing the recovery session; Z3 and Z4 "deserve their respect" and are quick to write. |
| 20 | **After the email, show plans that improve the number they just calculated.** Cycling and swimming resolve from the catalogue by rule (see §4b). Running needs hand-picked IDs — placeholder until supplied. |
| 21 | **Test-hygiene rules are parked as a page problem** and become a content project instead: **three blog articles on testing best practices**, one per sport. Public, indexable, and they feed the calculator rather than sitting behind the gate. |

---

*Decision 4 is superseded by 12: the 30' test is no longer "the house protocol replacing the others" — it is one of three the athlete chooses from, and `methodology.md` §3 does **not** need rewriting. It gains the 30'-bike-power option; it loses nothing.*

---

## 4. The three surfaces

### Surface 1 — public, indexable

```
/calculadora-de-zonas/            hub, sport picker
/calculadora-de-zonas/natacion/   same tool, swim pre-selected
/calculadora-de-zonas/ciclismo/   same tool, bike pre-selected
/calculadora-de-zonas/running/    same tool, run pre-selected
```

One tool, four URLs, each with its own `<title>`, H1 and intro copy. "Calculadora CSS natación" and "calculadora zonas FTP ciclismo" are different searches with different intent; one page wins one head term, four can win four. All indexable, in `sitemap.xml`, `transKey` set so hreflang wires up when EN/PT land.

**Fully functional, results free, no wall.** That is what makes it rank and what stops it reading as a trap.

*Note, August 13, 2026 — Iván, seeing this live for the first time: "It looks like at `/calculadora-de-zonas/` I can calculate my swimming zones without reaching `/calculadora-de-zonas/natacion/`. Is that by design? Isn't that duplicated?"*

**Yes, by design, and the four pages are functionally identical** — the sport picker renders on all of them; `zcSport` only pre-selects, it never restricts, so a visitor who lands on the swim page can switch to bike without leaving. That is deliberate (a pre-selected page still works as a hub) and it is what makes them true duplicates in function. They differ only in `<title>`, H1, intro and the sport-specific prose below the tool, which is the whole point of the split above: four head terms, four pages.

**The thing that is actually wrong is the navigation, not the URL structure.** All four sit in the `Recursos` dropdown, which puts an SEO structure in front of a member as if it were a product structure — and invites exactly the question Iván asked. Search landing pages do not need to be navigation items; they need to be indexable and internally linked, which they already are (the articles and the hub link to them). **Proposed: `Recursos` lists "Calculadora de Zonas" only**, and the hub links onward to the three sport pages in its prose. One entry in `nav.json`, no page deleted, no canonical change, nothing lost for SEO. *Iván's call — not changed unilaterally, since it is a visible product decision rather than a bug.*

### Surface 2 — the lead magnet, below the result

The zones are on screen first. Underneath: the offer of the workouts that actually move each zone — how to build Z2 that is more than slow miles, the marathon-pace session that earns Zone X rather than drifting into it, what a real Z4 set looks like against what most people do.

**Why this is stronger than a PDF download:** the ask arrives after the value, and we already know their sport and their threshold at the moment we ask. A generic lead magnet buys an email address and nothing else; this one buys an email address attached to a sport, a current fitness level, and the knowledge that this person tests properly. That is the exact input the parked **AI plan picker** needs (`growth-roadmap.md` §Storefront, Phase 2).

It also fills a live hole: `open-loops.md` records that there is **no public page anywhere on the site that captures an email**, so cold traffic from GBP posts, Instagram and TrainingPeaks listings currently has nowhere to land that starts a sequence. The backend for this is largely specified already — see `plan-lead-pipeline-runbook.md`, whose Caddy route is deployed.

### 4b. What the post-email plan block shows (decision 20)

**Selected by rule, not by a hardcoded list.** The inventory's `distance` column doubles as a goal facet, so the block can query `is_published = TRUE AND sport = <selected> AND language = <page language> AND distance IN ('FTP','VO2Max','Speed')`. That stays correct as the catalogue changes, and it renders through the existing `planCard` shortcode — which **fails the build** on an unpublished or dead plan ID rather than shipping a broken link to a buyer.

| Sport | Facet | Spanish stock today |
|---|---|---|
| Cycling | `FTP`, `VO2Max` | 415081 / 415087 / 415118 (8/12/16wk) + nine level-graded 9-week blocks (566xxx) |
| Swimming | `Speed` | 392377, 392378, 408604 |
| Running | — | **none — see below** |

**Running has no equivalent facet.** Running plans are organised by race distance, so there is no "improve your threshold" set to select from. This confirms Iván's read that running would need hand-picking. Placeholder until the IDs arrive; do not substitute a race-distance plan and call it a threshold plan.

### Surface 3 — members, gated, `noindex`

The same calculator with **no email capture and no pitch**, plus saved values and re-test history.

**Be clear-eyed about the delta.** Members are not buying extra features here — they are buying the same tool without the funnel, plus history. That is thinner than "gated depth" implied in the first design pass, and it is accepted deliberately: All-Access sells on 303 plans, unlimited changes and TrainingPeaks Premium. The tools are a reason to stay, not the reason to join. Recorded explicitly so it is not rediscovered later as an unexplained weakness.

### On saving values — smaller than it looks, but a category change

The hard part already exists: a per-subscriber token in Postgres and a Flask service that validates it. Threshold history is one table keyed by `twenty_person_id` and two endpoints on `auth_service`, which was already rebuilt and repo-linked on Aug 10.

The real cost is not size, it is **category**: the members area is 100% static HTML behind Caddy today. Adding save turns it into an application with an API surface — worth doing, worth doing deliberately, and not something to slip in unnoticed. A zero-backend v1 exists (`localStorage`) which survives a return visit but not a device change; for a value re-tested every 2–3 months over years, that limitation is real. See Q9.

---

## 5. Work this triggers, beyond the tool itself

- [ ] **Rewrite the zone table in the three published articles.** `site/blog/entrenar-el-umbral-sin-tiras-de-lactato.njk` + EN/PT siblings currently print one table (Z1 <80 / Z2 80–88 / X 88–93 / Z3 93–98 / Y 98–102 / Z4 102–106 / Z5 >106) applied to both velocity and LTHR. `data/zones.csv` disagrees on every row and splits it six ways. **Generate the table from `data/zones.csv` at build time** rather than hand-correcting it — a second hand-typed copy is exactly how the two diverged.
- [ ] **Rewrite the same articles' CTA blocks.** They promise the calculator is behind the login. It is about to be public.
- [ ] **Retire `/members/zonas/` and `/members/tests/`** (decision 7). Inbound links to clean up: `site/members/index.njk` lines 25, 32, 75, 81 (two onboarding steps + two library cards), and `site/members/carga/index.njk`. Nothing outside `/members/` links to them.
- [ ] **Remove the "Empezá acá" onboarding section** from the members home in all three languages (decision 8) — it exists only to point at the two retired pages.
- [ ] **Rescue the test-hygiene rules before deleting `/members/tests/`.** That page carries the rules that make a test *valid* — early morning, rested, fed, flat uninterrupted route, chest strap mandatory, stopping invalidates the test, salvage off the last clean 10'. A calculator that accepts a number from a badly executed test produces confidently wrong zones. See Q14.
- [x] ~~**`/members/zonas/` is serving a note-to-self as live copy.**~~ **Removed August 10, 2026.** The calculator box contained, visible to paying members: *"Todavía falta cargar los porcentajes exactos… mandame esos porcentajes y lo dejamos funcionando en una sola pasada."* Three dead input fields sat above it. **Second instance in one day** of a note addressed to Iván rendering as production copy — the All-Access welcome email was the first, found the same morning. Unlike that one, **this had been delivered.**
- [ ] **`methodology.md` §3** gains the 30' bike test as a power protocol (FTP = 100% of the 30' average). Nothing is removed — decision 12 keeps 1×20' and 2×8'.
- [ ] **`methodology.md` §4** should point at `data/zones.csv` rather than gain a fourth copy of the numbers.
- [ ] **Write the "workouts to improve each zone" sequence** (decision 6). This is a content project in its own right, not a side-effect of the build. See Q11.
- [ ] **Wire the email capture.** `plan-lead-pipeline-runbook.md` already specifies a lead backend and its Caddy route is deployed; reuse rather than build a second one.

---

## 6. Open questions — these block the build

**Q8 — LTHR from the 20' test.** For the 30' protocol, LTHR is the average HR of the final 20 minutes. For a 20' test, is LTHR the average HR of the whole 20 minutes, or scaled down (the common convention is ×95%)? Same question for the **run** 20' test and threshold pace: 20' average as-is, or scaled? Blocks the protocol math for both sports.

**Q9 — Saved values: `localStorage` or Postgres?** `localStorage` is zero backend and survives a return visit but not a device change. Postgres is one table plus two endpoints on `auth_service`, and turns the members area from static HTML into an application. Given the value is re-tested every 2–3 months over years, the browser-only version fails at exactly the moment it matters.

**Q10 — Where does the members copy live?** `/members/zonas/` is being retired as a *guide*; its URL could be reused for the tool, or the tool could take a new path. Reusing keeps any bookmark working; a new path makes the retirement unambiguous.

**Q11 — Scope of the lead-magnet content.** Seven zones × three sports is 21 workout prescriptions, which is a real writing project. A curated subset — the three or four zones athletes actually get wrong (Z2, X, Y, Z4) — is more realistic and arguably better copy. Also: one email, or a sequence? And does it differ by the sport they selected, which we know?

**Q12 — Does the public tool show all metrics, or only what they have?** A cyclist with a power meter has both FTP and LTHR zones. Showing both is more useful and matches the "trust order, not display order" principle; showing only the primary is simpler and less intimidating on a public page aimed at cold traffic.

**Q13 — What happens on the public page after the email is submitted?** Nothing visible, a thank-you, or something that keeps them on the page? This is the moment with the most attention it will ever have, and it is currently unspecified.

**Q14 — Where do the test-hygiene rules live once `/members/tests/` is gone?** Options: inline in the calculator's protocol step (public, which is where the person actually about to test is standing); folded into the members copy only; or a new public page. Dropping them is the one option that makes the tool worse.

---

## 7. Sequencing

Spanish first, tested, then EN and PT in one pass — Iván's call, August 10, 2026. Note the consequence: the EN and PT members libraries stay empty until that second pass, and the branch's definition of done is all three languages, so the branch does not close on the Spanish version alone.

---

## 8. What was built (August 10, 2026)

| File | What it is |
|---|---|
| `data/zones.csv` | The six zone tables. **The only home for a zone percentage.** |
| `site/_data/zones.js` | Loads that CSV and the protocol definitions. Fails the build on a malformed table — missing zone, zero-width band, non-numeric percentage. |
| `site/_data/zonesUi.json` | Every string, keyed by language. Spanish only for now; the partial falls back to `es`, so an EN page renders Spanish rather than blank. |
| `site/assets/js/zones-calc.js` | Pure maths, no DOM. Loads as `window.ZonesCalc` in the browser and as a module under Node, so **the arithmetic that ships is the arithmetic that was tested**. |
| `site/assets/js/zones-ui.js` | The controller. Reads inputs, calls the above, renders. Recomputes nothing. |
| `site/_includes/partials/zones-calculator.njk` | The whole tool as one includable component, used by all five pages. |
| `site/assets/css/zones-calculator.css` | Theme-agnostic via CSS variables; `.zc--dark` flips it for the members copy rather than forking the sheet. |
| `site/calculadora-de-zonas/{,natacion,ciclismo,running}/` | The four public pages. Indexable, in `sitemap.xml`, each with its own title/H1/intro plus ~400 words of genuine supporting copy. |
| `site/members/calculadora-de-zonas/` | The members copy: dark, no capture, otherwise identical. |
| `tests/zones-calc.test.js` · `tests/zones-ui.test.js` | 23 + 12 assertions. `npm test`. |
| `.eleventy.js` → `zonePlans` filter | Selects the post-capture plans **by rule** — sport + language + goal facet — never a hardcoded ID list. |

### The test suites, and why there are two

`zones-calc.test.js` proves the arithmetic. `zones-ui.test.js` runs jsdom against the **built** `_site/` HTML and proves the wiring — that a visitor's clicks actually reach that arithmetic and render it. They fail differently: correct maths behind a step that never reveals itself is a blank page, and it passes every maths test.

**The assertion that matters most** appears in both: a Z2 pace band must be *slower* than threshold. A pace table computed by multiplying instead of dividing renders numbers that are still paces, still ascending, still bracketing a believable range — and are entirely wrong. It cannot be caught by looking. It is now caught by `npm test`.

`jsdom` was added as the only devDependency beyond Eleventy. It has no layout engine, so `scrollIntoView` is stubbed in the test loader — a jsdom gap, not a browser one.

### Deliberate omissions, so they are not mistaken for oversights

- **`/api/zone-workouts` does not exist.** The capture posts to it and the UI shows an error on failure. It does **not** fake a thank-you — a confirmation for an email nobody received is the same class of bug as a placeholder note shipping as copy, which this project has now hit twice in one day. Wire it to the lead backend (`plan-lead-pipeline-runbook.md`) before launch.
- **Running's post-capture plan block is empty**, by rule, because running plans are faceted by race distance and there is no threshold-goal set. It renders an honest empty state rather than a marathon plan relabelled.
- **No saved values** (decision 17). Not even `localStorage` — see §4.
- **No nav entry.** The four public pages are not linked from the site nav; internal links currently come only from the members library card. Worth deciding where they belong, since an unlinked page ranks worse and is harder to find.

