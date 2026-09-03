# Swimmer's Shoulder — home doc

*Created September 3, 2026. Home doc for `/members/hombro/`, `/members/en/shoulder/` and `/members/pt/ombro/` — **all three languages shipped the same day.** Owns the routine design, the four changes made to Iván's source, the dosing, the red-flag boundary, and what was deliberately left out.*

**Owns nothing numeric outside itself.** Prices → `triaperformance-pricing-and-positioning.md`. Zone percentages → `data/zones.csv`. Customer-facing library wording → `site/_data/library.json`. Open items → `open-loops.md`.

---

## 1. What it is

Third artifact on the **strength engine** (`site/assets/js/strength-tool.js` — sets × reps, athlete taps "set done", the only clock is the rest between sets), after `/members/rodillas/` and `/members/aquiles/`. **No engine changes were needed.** That is the point of having built the engine: the third routine on it cost a page and nothing else.

**Two questions → one of six routines.**

| axis | values |
|---|---|
| `place` | `home` (no band) · `band` (home, with band) · `gym` |
| `tools` | roller + ball: `yes` / `no` |

**Phases:** Liberación (only when `tools=yes`) → Movilidad y activación → Fuerza → Movilidad final.

**Sizes:** home/no 10 exercises / 22 sets · band/yes 13 / 25 · gym/yes 14 / 28.

**Structure, same as every other tool here:** one exercise `LIBRARY`, routines are lists of ids. Do not hand-write a second parallel routine — that is how six branches become six slightly different prescriptions.

**"Home without a band" is not padding.** This tool gets opened by someone whose shoulder hurts in a hotel room. Every exercise in that branch works with a doorframe and the floor: isometric ER against the frame, side-lying ER with a water bottle, a doorframe row, prone I-Y-T, push-up plus.

---

## 2. The mechanism, which the source got right

Endurance swimming overdevelops the **internal rotators** (lats, pecs) relative to the **external rotators and scapular stabilisers**. The shoulder rounds forward, the subacromial space narrows, and the supraspinatus or biceps tendon is pinched on every recovery. So the routine releases what pulls forward, restores upward rotation of the scapula, and builds *endurance* — not max strength — in the external rotators. High reps, low load, and that is deliberate.

The source also got two things right that most shoulder routines get wrong, and they should not be "simplified" away:

- **It does not roll the tendon.** It rolls the lat and releases pec minor — the tissues that cause the position — and leaves the painful structure alone.
- **It recognises that swimmers LOSE internal rotation.** Restoring IR matters as much as strengthening ER, because a stiff posterior capsule tips the scapula forward during the stroke.

---

## 3. ⚠️ The sleeper stretch is deliberately absent

**The source prescribed it: lie *on the painful shoulder*, 90° of abduction, and push the wrist toward the floor into end-range internal rotation, under bodyweight, for two minutes.**

That is the impingement position, loaded. It provokes the exact mechanism the rest of the routine exists to unload, and it has fallen out of favour for irritable shoulders for that reason.

**Replaced by the cross-body (horizontal adduction) stretch**, which reaches the same posterior capsule and the same internal-rotation deficit without compressing the joint into the position that pinches. The cue carries the part that makes it work: *depress the scapula and don't let it travel forward* — otherwise the stretch is the shoulder blade sliding, not the capsule lengthening.

**Do not re-add it.** This is the same class of finding as the insertional branch on the Achilles tool: the source doc told a symptomatic athlete to do the provocative thing, and it looks completely normal on the page. `automation/` has no check for this; the verification script asserts on it instead (§7).

---

## 4. Three additions, chosen by Iván

**1. Isometric external rotation opens every strength block.** ~30s per side at ~50% effort against a doorframe, nothing moving. Analgesic, and it lets the rest of the session be done with mechanics instead of guarding — the same role the wall sit plays on the knee tool. It is first in the block on purpose; behind two other exercises it is decoration.

**2. Serratus anterior.** *This was the anatomical gap.* The source trained only the retractors — rhomboids, mid/lower trap — and rhomboids retract and **downwardly** rotate the scapula. It is **serratus that upwardly rotates it**, and upward rotation is what creates the overhead clearance this whole routine exists to protect. A routine that only cues "squeeze the blades together" can bias against the motion it needs. It appears twice, and in **every** branch: the forearm wall slide in the prep block, and the **push-up plus in every strength block, gym included** — bodyweight, so there is no reachable routine without it.

**3. Thoracic extension and rotation.** A stiff thoracic spine caps shoulder elevation no matter how strong the cuff gets, and a swimmer who also sits at a desk has one. Open book in every routine; roller extension additionally when `tools=yes` (the roller earns its way into the mobility block, not just the release one).

---

## 5. Dosing and the pain rules

**2× per week — Iván's call, consistent with the knee tool.** Same day as swimming is fine, after rather than before: a fatigued cuff breaks stroke technique on its own.

> *A note for a future pass, not a correction:* low-load high-rep cuff work is commonly dosed more frequently than this while a shoulder is actually symptomatic, and 2× may under-dose the acute phase. Left at 2× for consistency and memorability. Revisit only with real athlete feedback, not from the literature.

**The traffic light**, carried into the tool's `warning` box verbatim:

- **Green — keep going.** Dull ache or muscle fatigue behind the shoulder or between the blades. That is exactly where it should be felt.
- **Red — that set is over.** Sharp, pinching pain at the front or top of the joint, especially past 90°. That is the impingement, and *"in the shoulder, pushing through doesn't inflame — it tears."*
- **Watch the shoulders, not the arm.** When the cuff fatigues the upper trap takes over and the shoulder shrugs toward the ear. The moment the shrug appears, the set is finished — the remaining reps are being done by a different muscle.

---

## 6. The red-flag boundary

On the setup screen, in the warm-coloured `setup-warn` box — deliberately the only warm element in the members area, so it never reads as another instruction card.

**Stop and see a professional if:** the pain followed a fall or a hard yank · the arm cannot be lifted actively although someone else can lift it passively (that pattern suggests a cuff tear) · the pain wakes them at night · there is numbness or tingling below the elbow.

Same shape as the knee and Achilles boundaries: a short list of things that are *not* what this tool is for, ending in "write to me and we'll look at it."

---

## 7. Verification

**227 checks across the three languages, all passing** (`shoulder-i18n.js`; the ES-only first pass was 91). Layers, in the order that has actually caught bugs on this repo:

1. **All six routines build** — every branch reachable, exercise ids all resolve.
2. **A full state walk to the done overlay** (48 actions, gym/no-tools). This layer exists because `strength-tool.js` once froze on the last set: `finish()` advanced `idx` past the end and `updateUI()` bailed before rendering the overlay. Nothing that stops earlier can see it.
3. **390px layout** — no overflow inside `#setup` or `#toolWrap`, and the **three-option** `place` group specifically: equal heights, no clipped labels, each ≥80px. Two-option groups were proven; three were not.
4. **Links resolve** (not 301 — *a redirect is a working URL under a wrong promise*).
5. **Clinical assertions**, run against all six branches:
   - no sleeper stretch, in any branch, in any wording;
   - every branch contains external-rotation work (a branch without it trains the muscles that are already overdeveloped);
   - the isometric is **first** in the strength block;
   - every branch contains serratus work — **including gym**;
   - the cross-body stretch and thoracic work are present;
   - the release block appears **iff** `tools=yes`, and the context pill agrees with it;
   - the traffic light, the shrug watch and the dosing all survive into the rendered warning.

*Why clinical assertions get their own layer:* a misplaced card is ugly, a compressive rep prescribed to an irritable tendon is harm, **and both look identical in a screenshot.** Established on the Achilles tool; this is the second application.

**The translation pass added three layers of its own, and they are the ones worth reusing:**

6. **The clinical assertions run again, in each language.** Not a copy for completeness — ***a translation is exactly where a clinical decision silently reverts***, because the reviewer is reading for fluency, and "sleeper stretch" has a plausible-sounding rendering in both Spanish and Portuguese. The sleeper check, the serratus check, the isometric-is-first check and the external-rotation check all run three times.
7. **The routine SHAPE must be byte-identical across languages** — same six branches, same exercise counts, same set totals (`home/yes 13/25 · home/no 10/22 · band/yes 13/25 · band/no 10/22 · gym/yes 14/28 · gym/no 11/25`). This catches the failure that a per-language assertion cannot: a branch that quietly lost an exercise in translation still passes every check about what it *does* contain.
8. **Engine chrome language, both directions.** The right words must be present *and* the other two languages' words must be absent. This is the bug that shipped `Inicio / Rutina / Ejercicios` into `/members/en/core/` — and one string escaped grep there, so presence-only checking is not enough.

**Two failures on the translation run, both my expectations rather than the pages** — and worth recording because the correction is the same lesson twice: I *guessed* the tab labels (`Home/Workout`, `Início/Treino`) instead of reading `strengthUi.json`, where they are `Start/Routine` and `Início/Rotina`. A test built on a guess about a data file is a test of the guess. The foreign-leak lists were then rebuilt from the real values too, since they had the same defect and would have passed for the wrong reason.

**Two failures on the first run were both the test, and were confirmed as such rather than assumed:**

- The rest-timer probe assumed the first exercise had a rest. It is the open book — one set, no rest. Test now clicks until a rest actually starts.
- A `body *` overflow sweep flagged the off-canvas nav drawer at `[421,780]`. Verified identical on `/members/rodillas/` and `/members/aquiles/`, with `scrollWidth` staying at 390 on all three. Site chrome, not this page; sweep scoped to the page's own content.

**Unrelated finding, logged rather than fixed:** `/members/` itself reports `scrollWidth: 780` at a 390px viewport — a real sideways scroll on the members home, pre-existing and not caused by this work. Raised in `open-loops.md`.

---

## 8. Not built, and why

- ~~**EN and PT.** ES only for now, per the standing sequence.~~ ***Done September 3, 2026** — `/members/en/shoulder/` and `/members/pt/ombro/` are live, `library.json` moved to `live` in all three, and the `soon` entries were removed in all three. Verified on the rendered All-Access pages: each language sells it as live and none still lists it as coming.*
- **The dryland swimmer activation**, the second artifact Iván asked for in the same message. It belongs on the **activation** engine (timed), not this one. ***Open architectural question before it is built: it may be a third sport in the existing `/members/activacion/` matrix rather than a new page.*** The matrix already branches on sport × how-you-arrive × miniband, and a fourth standalone activation tool is how a matrix quietly becomes four hand-written routines again. Decide that before writing anything.
- **The symptom-vs-yardage tracker** the source doc trails off into mid-sentence. Not built, not scoped, not promised anywhere. It is a logging tool, not a routine, and it would belong with the test log in the zones calculator rather than here.
- **A shoulder article** to pair with the tool via `toolCta: shoulder`. The `key` is already in `library.json`, so the CTA partial will render the moment an article carries it. Nineteen agent-written articles still have no `toolCta` at all — tracked in `open-loops.md`, not here.
