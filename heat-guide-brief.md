# Calor y rendimiento — guía + calculadora

**Status: PROTOTYPE APPROVED, NOT PORTED.** Both surfaces live as Claude artifacts, September 11, 2026. Nothing in `site/` yet. Next step is the port, per `artifact-publish-runbook.md`.

**Home doc for the heat initiative.** Owns the decisions, the calculator's model, and the data conflicts it surfaced. **Owns no tokens** (`brand-guidelines.md`), **no race weather** (`data/races/*.json` — see §3), **no prices**, **no open items** (`open-loops.md`).

## 1. What exists

| Surface | What it is |
|---|---|
| **Guía** (12 sections, ES) | The reference document. Hero carries Iván's own Ironman Argentina 2022 case: 35 °C, planned 3:30–3:45, ran **4:20** — a 16–24% decrement, above the guide's own mid-pack band and consistent with its claim that long-course is the widest margin. |
| **Calculadora** (ES) | WBGT from air temp + dew point (or RH), then penalty → pace → time. Seven races preloaded. |

Research base: a 13-section evidence brief (Sept 6) cross-checked against independent Gemini and Grok passes, plus a 25-item citation verification that caught six figures which must not be published as commonly stated. **The research brief is not in the repo** — it is 38 KB of literature review and its conclusions are all in the two surfaces above.

## 2. Decisions taken, September 11, 2026 (Iván)

**A. The calculator leads, the guide is its capture.** Not the other way round. *It satisfies the test set September 8 — an email box belongs on a tool only when an artifact continues the job the tool started. A calculator ends with "sal 14 s/km más lento"; the athlete's next question is "¿y qué más puedo hacer?", which is what the guide answers.* Same shape as zones calculator → zones guide.

**B. Race weather is owned by a data file, not by guide prose.** ⚠️ *The file is `data/races/*.json`, NOT `data/races.csv` as originally proposed — see §3.*

**C. EN and PT are written natively, not translated**, per `brand-guidelines.md` §10. Written from the same research, not sentence-by-sentence from the Spanish.

## 3. 🚨 Three conflicts found between the guide and `data/races/*.json`

**This is the reason decision B changed target file.** `data/races/*.json` already owns per-race weather, bilingual, with a `typical_weather` block — and it is better sourced than the guide's table for the three races it covers.

**(1) Ciudad de México — the guide was WRONG and is corrected.** It stated 15,0 °C air / 11,1 °C dew / WBGT 17,6. **That mixed a point-in-time temperature with a *daily-mean* dew point** — the exact error class the research brief warns about ("a snapshot quoted as a rate"). `mexico-marathon.json` has the verified race morning: **14,6 °C, 97% humidity, wet bulb 14,2 °C**, 31 August 2025. Guide and calculator corrected to 14,6 / 14,2 / **WBGT 18,6**.

**(2) Río WBGT — ~~NEEDS IVÁN~~ DECIDED September 11, 2026, Iván: the Galeão reading stands.** The guide publishes the observed SBGL reading for 22 June 2025 — **17,8 °C air / 17,5 °C dew / WBGT 21,9** — and that is the number the guide and the calculator preset carry. `rio-de-janeiro-marathon.json` declines to estimate (*"no lo estimamos"*) and **that abstention is still correct in its own context**: a race page answers "what will race morning be like", and one station reading from one year is a bad answer to that question. A guide table answers "how do these seven races rank against each other", and there one sourced reading beats a blank. **Two files, two jobs, same evidence, different call — not a contradiction to reconcile.** *Do not "fix" the race page to match this table.*

**(3) Río start time — ~~NEEDS IVÁN~~ the conflict I raised did not exist, and the real defect is a different one.** *I asked Iván to adjudicate "guide says 05:00, JSON says 05:30" and he ruled 05:00. Checked against the shipped files on September 11, 2026: **the guide states no Río start time anywhere.** `grep` for `05:00` across the guide, the partial and the JS returns nothing. I raised a conflict between a live file and a draft line that never shipped.* 🔑 **Lesson, and it is the general one: verify a conflict against the shipped file before spending someone's judgement on it.** *Two figures were worth his time; the third was worth a grep.*

**What the check did find.** `rio-de-janeiro-marathon.json` carries **2026 actuals, wave by wave** — PCD 5:25, elite 5:30, pelotón from 5:35 — which is better sourced than the 2025 regulation PDF I based the question on. And the guide's §12 table promises *"condiciones observadas en la hora de largada"* while printing **07:00** for Río. Río starts at 5:30 **in the dark, two hours before sunrise**. **So that row is a reading from ~90 minutes into the race, labelled as the gun.** It errs toward *over*stating the stress, and the row's job — "no es una carrera de calor" — survives either way, so the fix is a sentence in the table note, not a number nobody has measured. ⚠️ **Do not change 17,8 / 17,5 / 21,9 to a 05:30 value unless someone actually pulls a 05:30 SBGL observation.** A plausible number is worse than an honest caveat.

**Four of the seven races in the guide have no JSON file at all:** Cartagena, Barranquilla, San Andrés, Cozumel — which are the four that matter most to this market.

## 4. The calculator's model, stated once

- **WBGT** — Australian BoM: `0,567·Ta + 0,393·e + 3,94`, `e` from dew point. **No solar or wind term**, so it approximates shaded WBGT and is a **floor, not a central estimate**. Reproduces the guide's §12 table exactly for all seven races.
- **Penalty** — 0,3–0,4% per °C of WBGT above 15 °C (Mantzios 2022, 1.258 races / 7.867 athletes). Mid-pack ×2–3 (Ely 2007: 300th place 7,9% vs 25th place 2,6%).
- **Acclimation discount** — ×0,5 to ×0,7. **The softest of the three and labelled as such on the page.**
- **5 and 10 km return a refusal, not a number.** No published field equivalent exists below half marathon. The refusal panel carries the Falmouth finding instead (10× the heat-stroke rate of a marathon, because nobody slows down for a short race). *This is the most distinctive thing on the page and should survive the port.*

## 5. Standing decisions

- **Heat appears in exactly three places** and each is the hard end of a scale: the dew-point scale (turns at 24 °C, where the physiology turns), the alarm section's top rule, and the result chip on Iván's race. No buttons, no links.
- **The dew-point scale is the page's hardest-working element** — it is the brand's zone-bar component applied to a new physiological scale, with real proportional widths.
- **Photography:** one real shot, Iván racing, tight magazine crop. *Base colour `#a29a98` declared behind it per the no-flash rule.*
- **Scope:** every core-temperature threshold is published as *what the guidelines define*, never as *what you should measure*. The guide never offers a field differential-diagnosis flowchart, and never says "hot dry skin means heat stroke" — that teaching is from classic, not exertional, heat stroke and is actively wrong here.

## 5b. Register sweep — PASSED, September 11, 2026

`automation/register-sweep.py` run scoped to the three new Spanish surfaces: **0 lines would change.** Four words tripped the final-accent gate and **all four are correct as written** — `encontré`, `crucé`, `escribí` are Iván's own first-person preterites in the hero, and `Andrés` is the island. *The homograph gate is working exactly as designed: it reported rather than converted, and a human decided.*

⚠️ **They will be re-flagged on every future run.** The gate's allow-list is built from the *conversion* maps (PRESENT, IMPER, CLITIC, LEXICON, BARE), and a word that needs no conversion has no home in them. **Giving `gate_accented` its own allow-list is a real improvement to a shared script and should be its own deliberate edit, not a tail-end change made during a content session.** Logged as a small item rather than done badly.

**Closed September 11, 2026 — and the item filed here had the cause wrong.** `ALLOW` was a standalone set all along; the words were simply not in it. *The fix that mattered was a rule rather than a list: `-á` stays deny-by-default because that is where voseo lives, while a bare `-é`/`-í` is reported with its line as a probable first-person preterite. Repo-wide UNCLASSIFIED went 58 → 3.* **Full note: `open-loops-archive.md`, September 11.**

## 5c. The port, and the four rendering defects it produced — September 11, 2026

**Both surfaces are in `site/` and render clean at 390 / 768 / 1280.** `site/calculadora-de-ritmo-en-calor/`, `site/calor-y-rendimiento/`, `site/assets/css/heat-calculator.css`, `site/assets/js/heat-calc.js`, `site/_includes/partials/heat-calculator.njk`.

**All four defects were the same mistake wearing four hats: I reached for a name that already meant something else.** *Iván caught the first two from localhost screenshots; the other two surfaced in the check that followed.*

**(1) Carbon tokens on a light page — the one that made the pages unreadable.** Every panel, card, table and dose block used `background: var(--surface)` or `var(--surface2)` with `var(--ink)` text. 🔑 **`--surface`, `--surface2` and `--bg` are CARBON names** (`tokens.css`, `brand-guidelines.md` §3.2) — they paint `#171b21` and `#1f242c`. Near-black text on near-black panels, nine components, both pages. *I read `--surface` as "the page's card fill". It is not; on a light page the card fill is `--white` and the tinted fill is `--wash`, which is what §3.1 and §6's Card spec say.* ⚠️ **The tell that should have caught it in one second: the single router card that looked right was the one in `:hover`, because that state set `--wash` explicitly.**

**(2) `.btn-primary` is the inverse of what §6 calls a primary button.** The guide's one CTA rendered as blue text with padding and no button at all. `site.css` defines `.btn-primary` as **white fill / blue text** — correct inside the carbon hero, invisible on a white page. *This is a repo-wide defect, not mine, and it is now a finding in `design-refresh-brief.md` §L2 with the count.* Fixed here with a page-scoped `.hc-btn`, **taking our own name rather than out-specifying theirs** — the same call the file's header comment already made about `.card` and `.hero .label`.

**(3) A specificity fight over `display`.** `.hc-panel label` (0,1,1) beat `.hc-check` (0,1,0), so the checkbox rows rendered as blocks, the flex `gap` never applied and the label text sat on top of its own box. Fixed with `:not(.hc-check)` — **excluding is cheaper than escalating and does not start a ladder.**

**(4) The page scrolled sideways at 390px.** `.hc-tool`'s results column was `1fr`, which floors at `min-content`, and `.hc-tablewrap`'s table carries `min-width:440px` — so the track refused to shrink and dragged the grid past the viewport. Fixed with `minmax(0,1fr)` plus `min-width:0`. 🔑 **`overflow-x:auto` on a scroll container does nothing while an ancestor grid track is still sized to the content** — §9's "the page never scrolls sideways" needs the floor as well as the container.

*Verified by building to a scratch output and rendering both pages headless at three widths; zero overflow, zero carbon tokens remaining.* **The only elements still crossing the viewport edge are the site's own off-canvas nav drawer, which is pre-existing and by design.**

## 5d. Cross-linked with the race pages — September 11, 2026

**Race → calculator** on the six Spanish race pages where heat is a real variable: Berlin, Valencia, Miami, Río, Buenos Aires, CDMX. Inline prose at the end of the Conditions block, where the reader has just finished a temperature and a humidity — not a card, because a race page already carries three asks and a fourth boxed CTA splits attention on the coaching banner rather than adding a path. Two more races are flagged and silent (Lisboa, São Paulo Internacional): the flag lives on the race, the *rendering* depends on whether `raceUi` has a calculator URL in that language, so they light up the day the PT calculator ships with no second pass over the data.

**Calculator → race** under the preset chips: Miami, Río and CDMX, resolved from the race data by id rather than typed as URLs. **That is the direction that matters commercially** — it moves traffic from this asset into the plan funnel, where race → calculator moves a buyer sideways to a free tool.

**Bogotá is deliberately excluded** even though it is an obvious "hot country" candidate: its problem is dry air at 2.600 m, which is fluid loss, and §4 says this model is a shaded-WBGT floor with no altitude, solar or wind term. *Linking it there would answer a question that race is not asking and imply precision the model does not have.*

## 6. Not done

- **EN and PT, written natively** per decision C. Structure, CSS and JS are language-agnostic and done; what is missing is the copy and the `transKey` siblings. *`heat-calc.js` formats with a Spanish decimal comma and needs a per-language separator.*
- **The four missing race JSONs** — Cartagena, Barranquilla, San Andrés, Cozumel. The four that matter most to this market.
- **Structured numeric weather fields in `data/races/*.json`, so §12 renders instead of being typed.** *Until that exists the guide's table is a hand-typed copy of data another file owns, which is the drift this repo keeps writing notes about — and it is how the Ciudad de México row went wrong.*
- **Nothing is committed.** Iván's tree also holds unrelated work from the storefront and CoachMatch branches; these files must not be swept into one commit.
