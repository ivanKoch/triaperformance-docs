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

**(2) Río WBGT — NEEDS IVÁN.** The guide gives an observed SBGL (Galeão) reading for 22 June 2025: 17,8 °C / 17,5 °C dew / WBGT 21,9. `rio-de-janeiro-marathon.json` says explicitly: *"No encontramos un registro de estación de la mañana de carrera de 2025 ni de 2026, y no lo estimamos."* **Both positions are defensible** — Galeão is ~20 km from a beachfront course, which is a legitimate reason to reject it. **One of the two has to give.** Do not silently overwrite a deliberate editorial abstention.

**(3) Río start time — NEEDS IVÁN.** Guide says waves from **05:00** (2025 regulation PDF). Race JSON says **05:30**. One is wrong.

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

## 6. Not done

- Port to `site/` (ES), then EN and PT written natively.
- `automation/register-sweep.py` has **not** run on this copy — it cannot until the Spanish lives in the repo.
- The four missing race JSONs.
- Structured numeric weather fields in `data/races/*.json` so §12 renders instead of being typed.
