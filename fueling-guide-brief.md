# Fueling Guide — home doc

**Initiative:** the athlete-facing fuelling guide, ES/EN/PT.
**Opened and v1 shipped:** September 11, 2026.
**Owns:** the scope decision, what was cut and why, where every number comes from, and the v2 list.
**Owns no numbers.** Every figure in the guide is a copy of `methodology.md` §8 or of a cited external source. When §8 moves, the guide moves with it in the same session.
**Deliverables:** three members pages, three PDFs, and the markdown they are both generated from.

## 0. How this guide is built — read before editing anything

**The markdown is the single authoring surface. Everything else is generated.**

```
fueling-guide/kit-de-combustible-{es,en,pt}.md        ← EDIT HERE, and only here
        │
        └── automation/fueling-guide-content.js        parses all three into one AST
                    ├── automation/build-fueling-guide-pages.js  → site/members/{combustible,en/fueling,pt/combustivel}/index.njk
                    ├── automation/build-fueling-guide-pdf.js    → site/assets/guias/{kit-de-combustible,the-fuel-kit,kit-de-combustivel}.pdf
                    └── ...  --magnet                            → site/assets/guias/{alimentar-tus-sesiones-largas,fuel-your-long-sessions,alimentar-seus-treinos-longos}.pdf
```

⚠️ **Never hand-edit a generated page or rebuild a PDF from anything else.** Both generated pages carry a DO-NOT-EDIT banner. A hand edit survives until the next build and until then the page, its two siblings and the PDF disagree — which is the exact failure this design exists to prevent, one layer up from the "one home per figure" rule: **one home per sentence.**

**The parser is deliberately strict and throws rather than degrading.** It refuses to build if the three languages stop being structurally identical — different section counts, or a table that gained a row or column in one language only. That check has already earned its place: the three files must stay in lockstep, and a silently dropped table is the defect that ships.

**Running it:** `node automation/build-fueling-guide-pages.js` (no arguments, writes all three) and `node automation/build-fueling-guide-pdf.js [es|en|pt]`. The PDF builder needs playwright + chromium, same as the two zone-guide builders.

*Figures: every fuelling number is a copy of `methodology.md` §8. Move it there first, then in the markdown, then rebuild. Never the reverse.*

---

## 1. What happened

The predecessor document — *Kit de Herramientas Nutricionales*, ~40 pages ES — was reviewed twice independently (Claude and Grok, September 6, 2026). Both concluded it was unpublishable as written. The merged audit produced **43 findings**, 26 of them found by both reviewers.

**The decisive finding came from neither review, because neither had the repo.** `methodology.md` §8 opens with:

> **Scope line: training + race fueling only.** Never day-to-day diet, never weight loss (→ nutricionista). Any medical condition interacting with fueling (GI disease, hypertension) → nutritionist/doctor.

And §11: *"No weight-loss coaching → nutritionist. Nutrition scope strictly = training/race fueling + carb load."*

The guide breached a boundary Iván had already written down. This was never a writing problem. **The rebuild is a return to spec, not a retreat from ambition.**

⚠️ **The lesson worth keeping:** the scope line existed, was correct, and was not consulted while the guide was written. A rule in `methodology.md` that no authoring session reads is a rule that does not exist. Any future athlete-facing content that touches fuelling reads §8 first.

## 2. The second finding: §8 was better than the guide on eight numbers

Verified by reading both, September 6:

| Item | `methodology.md` §8 | Old guide | Kept |
|---|---|---|---|
| In-session CHO | start 60 g/h, gut-train to 90 (bike 100–120) | "base 30–60 g/h" | §8 |
| Race bike | up to 120 g/h | 60–90 g/h | §8 |
| Race run | up to 60 g/h, gels ~every 20' | 30–60 g/h, gel every 30–45' | §8 |
| Sodium | ~200 mg/40' (~300 mg/h), more in heat | no mg/h figure anywhere | §8 |
| Caffeine | 200 mg pre + 200 mg T1, built up from 100 mg in training | 3–6 mg/kg, 420 mg worked example | §8 |
| Carb load | ≤10 g/kg, **first-timers start at 5 g/kg** | 8–10 g/kg flat | §8 |
| Pre-session | 1 g/kg per hour until start | menu examples, no g/kg | §8 |
| GI troubleshooting | has a decision tree | absent | §8 |

The old guide was a downgrade of the documented method in eight places. It also dropped §8's two progressive-dosing ideas (caffeine from 100 mg; carb load from 5 g/kg for first-timers), which are the parts that make the protocol safe for a stranger.

## 3. Scope decision — option (a), the narrow version

Two options were put to Iván on September 6:

- **(a)** COACHING content plus reframes. Publishable under his own name immediately.
- **(b)** (a) plus the out-of-scope material, signed off by a registered dietitian.

**Chosen: (a).** Three reasons, in order of weight:

1. `methodology.md` §8 already drew the line. Option (b) would have asked a third party to underwrite a boundary Iván set himself and then crossed.
2. **The out-of-scope material already has a home, and it is not this document.** `open-loops.md` LATER carries the weight-loss nutrition guide, authored by Iván and signed off by his sister (nutritionist, Universidad de Buenos Aires), *"because weight-loss nutrition advice edges toward medical territory and should not go out under a coach's name alone."* Same sentence, different document. There was never an (a)-vs-(b) choice — one initiative had been contaminated with another initiative's content.
3. The cut material is the commodity half. Everyone publishes calories, weight and supplements; almost nobody publishes a working gut-training block and a per-modality fuelling ladder in Spanish for age-groupers.

## 4. What was cut, and it does not come back

- Body composition, "peso de carrera", every calorie-deficit instruction
- Ferritin monitoring instruction and the 18/8 mg RDA framing *(iron stays as a named risk with a referral — that is education, not monitoring)*
- Salt-capsule dosing and scheduling
- The caffeine mg/kg table and its 420 mg worked example
- The 100% liquid race options (the 150–200 g "super-bidón") — **v2, gated on a rehearsal rule and a concentration ceiling**
- Vegetarian/vegan dietary adequacy; vitamin D, calcium, omega-3
- RED-S **management**

**What was added instead:** a scope box on page 1, a named exclusion list, and RED-S **recognition with referral** — which is not a dietitian's job but a coach's duty, and is the one part of that subject that belongs here.

## 5. The seven reframes — dietetics rewritten as coaching

Each kept the content and changed the unit it is measured in.

| Was | Is now |
|---|---|
| "Comer para lo que vas a hacer" as a fat-loss method | Fuel for the work required — carbohydrate tracks the session, not the calendar |
| "Recorta LEJOS del entrenamiento" (where to cut calories) | Protect the fuelling window — never reduce fuel around a key session |
| Protein 1.4–2.0 / 2.0–2.2 g/kg/day as a diet target | ~0.3 g/kg **per session**, triggered by a training stimulus |
| Sodium 460–1,150 mg/L as a shopping rule | Rehearse your race drink; ~300 mg/h working figure from §8 |
| Caffeine mg/kg protocol | A race tactic built up in training from 100 mg — progressive overload applied to a stimulus |
| Post-exercise 3:1 / 4:1 ratio | Next-session readiness in absolute grams, triggered by the schedule |
| Female "metabolic differences" lecture | Fuelling across the cycle, hydration for smaller athletes, iron as risk + referral, menstrual change as a stop-and-refer trigger |

## 6. External numbers and their sources

Only three figures in the guide are not from `methodology.md` §8:

- **Daily carbohydrate bands** (3–5 / 5–7 / 7–10 g/kg/day; loading 8–12) — [SEÑ 2025 consensus](https://www.mdpi.com/2072-6643/17/24/3862)
- **Glucose:fructose 1:0.8** above 60 g/h — [GSSI contemporary perspectives](https://www.gssiweb.org/sports-science-exchange/article/dietary-carbohydrate-and-the-endurance-athlete-contemporary-perspectives)
- **Post-session 1.0–1.2 g/kg/h when the next session is inside 8 h** — ISSN nutrient timing

⚠️ **A disagreement the audit surfaced, recorded because it will come back.** Grok argued the ceiling has moved to 90–120 g/h; Claude argued 90. Both are defensible and the literature is split: the [SEÑ 2025 consensus](https://www.mdpi.com/2072-6643/17/24/3862) says ">2.5 h: intake can reach 90–120 g/h", while [GSSI](https://www.gssiweb.org/sports-science-exchange/article/dietary-carbohydrate-and-the-endurance-athlete-contemporary-perspectives) declines to revise above 90. **Grok's own first citation contradicted Grok** — [Cao et al., *Nutrients* 2025](https://www.mdpi.com/2072-6643/17/5/918) says 60–90 g/h for events >150 min and warns that beyond 90 may add nothing. *The guide sidesteps the argument by using §8's answer, which is better than either: split the number by modality (bike to 120, run to 60) and gate it on gut training. Neither reviewer thought to do that.*

**Standing rule:** if a future session wants to move a fuelling number in the guide, it moves it in `methodology.md` §8 first, and the guide copies it.

## 7. Register and language

- Tuteo + neutral Latin American vocabulary, `brand-guidelines.md` §8. Swept with `automation/register-sweep.py`.
- ES written first and natively; EN and PT written natively, not translated. Same structure, same numbers, three separate drafts.
- No zone percentages appear in the guide. If a future version adds an intensity table it comes from `data/zones.csv` and nowhere else.

## 8. Shipped, and what is left

✅ **Online September 11, 2026, all three languages:** `/members/combustible/`, `/members/en/fueling/`, `/members/pt/combustivel/` (~49 KB each, 16 sections, 12 tables), plus three 24-page PDFs in `site/assets/guias/`. Linked from the three downloads pages and carried onto every All-Access sales page by `library.json`.

*Two layout defects were found by reading the rendered PDF rather than the code, and both were fixed in the parser so pages and PDFs inherited the fix at once: the signature block lost its line break (`**Iván**\nFounder & Head Coach` printed as one line — the parser was joining paragraph lines with a space, and all three multi-line blocks in the guide are deliberate soft breaks), and the PDF cover lede pulled the medical disclaimer instead of the promise, because it took the scope section's first paragraph.* **Neither was visible in the HTML or in any assertion. Render the artifact and look at it.**

✅ **The lead magnet shipped the same day** — `alimentar-tus-sesiones-largas.pdf` / `fuel-your-long-sessions.pdf` / `alimentar-seus-treinos-longos.pdf`, 8–9 pages, traded for an email on the three public nutrition articles through `/api/tool-lead`.

**It is a section allowlist through the same builder, exactly as predicted — `MAGNET_SECTIONS = [2, 3, 4, 10]` and a `--magnet` flag, no fourth document and no copy typed twice.** The allowlist is by *guide section number*, so it is language-independent and the build fails loudly if the guide is ever renumbered underneath it. Magnet mode also swaps the cover lede, drops the contents page (four items did not earn a sheet) and ends on a CTA instead of the sources.

⚠️ **What the magnet deliberately leaves out, and it is not an oversight: §6 hydration and sodium, §7 carb loading, §8 caffeine.** *Each carries a safety tail — hyponatraemia symptoms, a loading protocol, contraindications — that needs the room the full guide gives it.* **A magnet reaching strangers should not carry a dose it cannot also carry the warning for.** *The scope box ships with it uncut, for the same reason.* The four sections that remain — pre-session, the per-hour ladder, the gut block, and what to do when the stomach shuts down — are the load-bearing four both reviews named, minus the race templates, which are the reason to open the full guide.

**Left, and not queued:**

1. The 100% liquid race option, with a rehearsal gate and a grams-per-100 ml ceiling.
2. The old *Kit de Herramientas Nutricionales* is superseded and unpublished. It is not in this repo and should not be re-imported.
