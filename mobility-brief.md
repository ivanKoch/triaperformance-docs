# Mobility Brief — the post-exercise mobility matrix

**Home doc for `/members/movilidad/`.** Owns the design, the dosing, the five decisions taken before building and the three clinical reversals. Owns no prices, no figures and no open items — open items live in `open-loops.md` and point back here.

**Status: v1 SHIPPED in Spanish, September 3, 2026.** EN and PT are not built and are deliberately not claimed anywhere — `library.json` carries the entry in `es` only, per that file's own rule.

**Source:** Iván's *"Triaperformance: Sistema Maestro de Movilidad — 30 Variantes"*, section **A** of each sport (post-exercise). Section **B** (recovery day) is a **separate artifact** and is not built. See §7.

---

## 1. What it is

Two questions → one of 15 routines.

| Axis | Options | Count |
|---|---|---|
| Sport | correr, bici, nadar, triatlón, todo el cuerpo | 5 |
| Duration | 10, 20, 30 minutes | 3 |

Built on the **activation engine** (`/assets/js/activation-tool.js`), unchanged, via the same `matrixMode` pattern as `/members/activacion/`: the page renders its own setup screen, builds `window.ACTIVATION_DATA` from the answers, then injects the engine, which by that point sees an ordinary timed routine.

**Fifteen routines are three lists per sport, not fifteen written routines.** `BASE` is the 10-minute session; 20 is `BASE + EXT`; 30 is `BASE + EXT + DEEP`. That is the source doc's own additive design (Núcleo → Extensión → Inmersión), and it is what stops the tiers drifting into three separate routines that share a name. *A test asserts the containment directly: 20 must contain all of 10, and 30 all of 20.*

The **closing block is appended by tier, not stored in the tables** — `wallLegs` at 20, `wallLegs + breathClose` at 30 — because it has to be last. A routine that lies down for two minutes and then stands up for more mobility is sequenced wrong.

---

## 2. The five decisions, all Iván's, all reversals of the source

**1. Durations are 10/20/30, not the source's 30/45/60.** Nobody does an hour of stretching after a session, and 30 minutes is longer than several sessions in his own plans. The evidence is in this repo: the activation matrix runs 16–19 minutes and was flagged as long, and the swim version was targeted at 8–10. The 30/45/60 ladder is not wrong — **it is the recovery-day ladder**, and it goes on that tool, where the session *is* the training. ***Do not restore the source numbers here.***

**2. The base routines are mat-only, plus a wall, which the copy declares.** The source opened three of five sports on a foam roller and also required a lacrosse ball, a doorframe, a yoga block and a chair — while the promise was "you only need a mat". An athlete with a mat hit an impossible instruction **in the first exercise**. Roller and ball work is preserved as `variants`, which the engine already swaps in and whose button hides itself on exercises that have none. **No third axis, and the promise is true.** *A test asserts that no exercise in any of the 15 routines carries a tag other than "Sin equipo" or "Pared".*

**3. Intensity, not depth, separates this tool from the recovery-day one.** Post-session is 45–60s holds at submaximal range on tissue that was just loaded. The source's 60-minute tiers put passive frog and winged dragon — Yin — on freshly damaged tissue. So the third tier here adds **coverage and a real downshift, not range**.

**4. Triatlón is the brick; "todo el cuerpo" is sport-neutral.** Otherwise the two produce near-identical lists and one of them should not exist. `tri` = quads and calves from the run + hip flexors from the bike + lats from the swim. `all` = no sport assumed, and it also serves a gym day or a long day at a desk.

**5. "Agnostic" became "Todo el cuerpo".** The word means nothing to an athlete.

---

## 3. ⚠️ Three clinical reversals

All three look completely normal on the page, which is why each is asserted by a test rather than trusted to review. Same reasoning as the sleeper-stretch assertions on the shoulder tool.

**a. The sleeper stretch is absent** (source 3.A #4, swimmers). **This repo had already rejected it twice, in writing.** `swimmer-shoulder-brief.md` §3 calls it *"the impingement position, loaded"* and says do not re-add it; the activation matrix cites it as the reference class for the dislocates decision. Shipping it here would have reversed a documented clinical call in a neighbouring tool in the same library, three weeks later.

**Replaced by `crossBody`**, the cross-body horizontal adduction stretch — same posterior capsule, same internal-rotation deficit, no compression into the position that pinches. Its cue carries the part that makes it work: *depress the scapula and do not let the shoulder travel forward*. **A test asserts that cue is present, not just that the exercise is.**

**b. The doorframe pec stretch is absent** (source 3.A #2 and 4.A #5). End-range glenohumeral extension on a fatigued cuff, in the population whose anterior capsule is typically lax rather than stiff — the same family of error as the sleeper. It also needed a doorframe. **Replaced by `pecFloorProne`**, which is floor-based and self-limiting, and whose cue caps it at the chest: *if you feel it inside the joint, lower the arm.*

**c. Ustrasana / camel is absent** (source 2.A, 45 min). Loaded end-range lumbar extension with the neck back, on a fatigued athlete post-ride. It is the one item in the source where a real injury is plausible, and the same routine already reaches thoracic extension and hip-flexor length three other ways.

**Reworded rather than removed: the IT band.** The source says *"foam roller enfocado **agresivamente** en banda IT"*. The IT band is not contractile and does not lengthen; the targets are TFL and vastus lateralis. And "aggressively" contradicts the source's own never-past-7/10 instruction. `itCross` carries the correct target and **says why in the cue** — *"la cintilla iliotibial no se estira ni se ablanda a golpes: lo que se afloja es lo que tira de ella"* — because a correction without its reason gets undone by the next pass. A test asserts that sentence survives.

**Swimming got legs.** The source's post-swim routine is eight upper-body items and zero legs, in a triathlon business, after an hour of kicking, the day before a run. Ankle plantarflexion is in the 10-minute core and plantar-fascia work in the 20 — the source had the foot work only in the 60-minute tier. Asserted.

**Box breathing is linked, not rebuilt.** The source's 60-minute tiers spend 5–8 minutes on box breathing and savasana. `/members/respiracion/` already owns box breathing, so `breathClose` runs a simple 4-in / 6-out downshift and **links out**. Same one-home argument that put swimming inside the activation tool rather than on its own page.

**Every sport hands off for pain.** The setup screen's aside is sport-aware: run → rodillas + aquiles, bike → rodillas, swim → hombro, tri and all → all three. Every one ends at a doctor rather than at another routine, which is `methodology.md` §11 respected in the product. Asserted for all five sports.

---

## 4. Duration — what it actually is

Computed with the engine's own `estMinutes()` formula (`work + (blocks − 1) × rest`, uni counting as two blocks), at `restSeconds: 10` rather than the engine's default of 15.

| sport | 10 min | 20 min | 30 min |
|---|---|---|---|
| correr | 10.2 | 21.5 | 31.1 |
| bici | 9.7 | 18.9 | 30.6 |
| nadar | 8.9 | 18.9 | 30.3 |
| triatlón | 10.2 | 20.6 | 31.6 |
| todo el cuerpo | 10.2 | 20.3 | 31.1 |

**The 30-minute tier runs 30.3–31.6, not 30.** Reported rather than trimmed further, same as the activation matrix's 10.8: contorting content to hit a round number is worse than saying what it is. The 20-minute tier spans 18.9–21.5, which is the honest consequence of five sports having different numbers of unilateral exercises.

**Worth Iván's eye:** the swim 10-minute routine is 8.9. It is the lightest core because two of its six items are 30s (triceps, neck). Left short rather than padded.

---

## 5. Three findings from the build, each caught by a check that did not exist before

**1. `flex: 1 1` does not wrap.** The five sport buttons rendered **61–72px wide on one row** at 390px. The wrap rule was present and read correctly; a flex item with `flex-shrink: 1` compresses rather than wrapping. Fixed to `flex: 1 0`. **Only a rendered width discriminates this** — the CSS file, the built HTML and every data test were all clean.

**2. The done screen said "Activación completa" on a mobility page.** The chrome comes from `site/_data/activationUi.json`, which is keyed by **language** and has no concept of which tool is asking. Three strings needed correcting and **each lands differently**, which is the part worth remembering:

- `kicker` — the engine already takes a per-routine override (`D.kicker`), set in `build()`.
- `startRoutine` — the engine reads it through `t()` at render time, so patching `window.ACTIVATION_UI` before the engine boots is enough.
- `doneTitle` — **is not an engine string at all.** The partial bakes it into the markup at build time. A `window.ACTIVATION_UI` override for it **silently does nothing**, which is exactly what happened. `partials/activation-tool.njk` now gives that div an `id`, the same way `doneSub` and `crumbLabel` already have one. Additive: nothing else sets it, so every existing page renders unchanged.

⚠️ ***When this page is translated, those three strings travel with it.*** They are the only interface text this tool owns, and they are exactly what a translation pass reads straight past.

**3. Not a bug, recorded so it is not re-investigated:** a local `npx @11ty/eleventy` does **not** refresh a changed file under `site/assets/` into `_site/` — the passthrough copy skips it. The `?v=` fingerprint is computed from the **source** file and was correct throughout. It does not affect production: `deploy-website.sh` builds into a fresh `mktemp -d`, so every deploy is a clean build. *Locally, build to a temp dir when you change an asset.*

---

## 6. Verification

**386 data checks** (`tests/mobility-matrix.js`) and **45 rendered checks** (`tests/mobility-layout.js`). The data tests run against the **built** page, not the source, so they also prove the `{% raw %}` block survived.

Data side: all 15 routines build; unknown sport and unknown duration both throw (45 minutes belongs to the recovery-day tool and must not silently produce a routine); no duplicated exercise inside a routine; every exercise carries a real cue and an explicit hold; the additive containment of 10 ⊂ 20 ⊂ 30; the closing block is last and only where it belongs; every routine lands in its duration band; the clinical assertions in §3; and equipment honesty across all 15.

Rendered side, at 390 / 768 / 1440: no sideways scroll, five readable sport buttons wrapping 3 + 2 at phone width with real tap targets, the sport-aware pain aside, and **a full walk to the done overlay on `tri|30`** — 18 exercises — checking the start button and the finish screen do not say "activación".

**Playwright is not in `package.json`** and is not installed on Iván's laptop — same situation as `automation/layout-check.js`. The rendered checks were run in a cloud container with the built page staged across; `MOB_ROOT` points the script at any directory holding the built page plus its two stylesheets and the engine.

---

## 7. The recovery-day tool — scope, and the argument that was lost

Section **B** of the source doc (Día Cualquiera / Recuperación Activa) is **a separate artifact, by Iván's call, September 3, 2026.** It is dynamic and active where this one is static and passive, it runs 30/45/60, and it is a planned session rather than an appendix to one.

***The recommendation was one page with a context question, and it was not taken.*** Recorded with its reasoning so the question is not re-opened from scratch, and so the cost is visible if it ever shows up:

- **For one page:** the library carried two activation entries once and consolidating them was a deliberate Aug 13 decision, with `activation-matrix.md` saying in writing *"do not let a future pass split this back out."* And the mechanic already exists — a context question that changes the duration options is exactly the sport-aware equipment pattern shipped in v1.1.
- **Against, and this is what decided it:** four questions before an athlete can start is real friction (`activation-matrix.md` already flags three as a cost), and a recovery-day routine is a different job, not a longer version of this one.

**The cost to watch:** two library cards whose descriptions differ by about one word, in three languages each, and a drift pair. **If the two cards ever have to be told apart in a sentence, that is the signal the merge argument was right.**

---

## 8. Open

Tracked in `open-loops.md`, not here.

- **EN and PT are not built.** `library.json` claims the tool in `es` only, and the EN/PT members homes and All-Access pages say nothing about it — the failure mode that hit `cyclistcore` (Aug 24) and `strength` (Sep 2) is avoided by construction, not by luck.
- **The recovery-day artifact** (source section B).
- **Iván has not run it on a phone yet.** Same gate as the activation matrix: he runs one, in Spanish, before translation starts.
