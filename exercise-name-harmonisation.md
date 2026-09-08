# Name harmonisation — the 15 clusters, three languages

> ✅ **APPLIED September 8, 2026, in THREE rounds — 69 renames across all three
> languages.** Final state verified by `automation/exercise-name-audit.js`:
> **33 clusters checked, 0 divergent, PASS.** Tests green.
>
> 🚨 **Round 1 shipped incomplete and its check reported a false PASS.** *The
> audit's cluster list was hand-written from **Spanish** divergences, so it was
> structurally blind to clusters where Spanish agreed and a translation did not —
> `Glute bridge`/`Glute bridges`, `Bridge march`/`Bridge with a march`,
> `Ponte unilateral`/`Ponte numa perna`. It reported 15 clusters clean while
> **8 were still split**.* **The fix was not more careful listing: the audit now
> derives its clusters from `data/exercise_clusters.json`, written by
> `apply-exercise-merge-map.js` from the decisions themselves.** *A checker handed
> its own list can only ever confirm what its author remembered — the same defect
> as `check-plan-links.py` filtering on the flag it was meant to verify.*
> ⚠️ **Iván still has to commit, push and deploy** — nothing here is live until he does.

**Scope: display names only.** No cue text, no ids, no engine change — that is the
migration branch (`open-loops.md` NEXT #15). This is the part that can ship
without it, and it is the part an athlete actually notices: today someone who
opens two artifacts sees two names for one exercise.

Measured by `automation/exercise-name-audit.js`:

| | clusters showing 2+ names | edits if the proposal below is taken |
|---|---|---|
| Spanish | 15 of 15 | 19 |
| English | 11 of 15 | 15 |
| Portuguese | 13 of 15 | 18 |
| | | **52** |

⚠️ **The three languages drifted independently.** *`pt/mobilidade` says
"Gato-vaca" where `es/movilidad` says "Gato-camello"; `wall-angel` and
`cross-body` are already consistent in EN and PT and split only in ES.* **So this
is not a translation of the Spanish decisions — each language needs its own name
chosen.**

---

## Proposed canonical names

**✓** = the majority spelling already, no judgement needed. **→** = a tie or a
four-way split, resolved by the reason given.

| # | cluster | Spanish | English | Portuguese |
|---|---|---|---|---|
| 1 | cat-cow | **Gato-camello** ✓ 5-1 | **Cat-cow** ✓ | **Gato-camelo** → 🚩 *3-3 tie* |
| 2 | world's greatest | **El mejor estiramiento del mundo** ✓ 2-1 | **World's greatest stretch** ✓ | **O melhor alongamento do mundo** ✓ 2-1 |
| 3 | leg swing, front | **Balanceo de pierna (frontal)** ✓ 2-1 | **Leg swings (front to back)** ✓ 2-1 | **Balanço de perna (frente e trás)** ✓ 2-1 |
| 4 | figure 4 | **Figura 4 boca arriba** → *no majority; matches EN and PT, which both say "supine"* | **Supine figure 4** ✓ 2-1-1 | **Figura 4 deitado** ✓ 2-1-1 |
| 5 | open book | **Libro abierto** ✓ 2-1 | **Open book** ✓ 2-1 | **Livro aberto** ✓ 2-1 |
| 6 | wall angel | **Ángeles en la pared** → *1-1; PT already says "na parede"* | **Wall angels** ✓ | **Anjos na parede** ✓ |
| 7 | cross-body | **Estiramiento cruzado de hombro** → *1-1; EN and PT both already say "stretch"* | **Cross-body shoulder stretch** ✓ | **Alongamento cruzado de ombro** ✓ |
| 8 | roll: quads | **Rodillo: cuádriceps** → 🚩 *convention* | **Roll: quads** → 🚩 | **Rolo: quadríceps** → 🚩 |
| 9 | ball: pec minor | **Pelota: pectoral menor** → 🚩 *convention* | **Ball: pec minor** → 🚩 | **Bolinha: peitoral menor** → 🚩 |
| 10 | roll: calf | **Rodillo: vientre del gemelo** → 🚩 *convention + the D3a restriction makes "belly" right for everyone* | **Roll: calf belly** → 🚩 | **Rolo: barriga da panturrilha** → 🚩 |
| 11 | side plank + raise | **Plancha lateral con elevación de pierna** → *1-1; prose over the "+" symbol* | **Side plank with leg raise** → | **Prancha lateral com elevação de perna** → |
| 12 | ankle / kick | **Tobillos para la patada** → 🚩 *voice* | **Ankles for the kick** → 🚩 | **Tornozelos para a pernada** → 🚩 |
| 13 | single-leg balance | **Apoyo en una pierna** → *D3b: eyes-closed moved to recuperación's note* | **Single-leg stance** → | **Apoio em uma perna** → |
| 14 | psoas + squeeze | **Psoas con apriete de glúteo** ✓ 3-1 | **Hip flexor stretch with glute squeeze** ✓ 2-1-1 | **Psoas com aperto de glúteo** ✓ 3-1 |
| 15 | couch stretch | **Couch stretch** → *D2e: the prop moved to the note, so the name carries no prop* | **Couch stretch** → | **Couch stretch** → |

## The three 🚩 that are Iván's, not mine

1. **PT cat-cow is a genuine 3-3 tie** — *Gato-camelo* (activación, core-ciclista,
   core-corredor) against *Gato-vaca* (core, movilidad, recuperación). Both are
   used in Brazilian Portuguese. *Gato-camelo* mirrors the Spanish; *Gato-vaca*
   mirrors the English. **No amount of counting settles it.**
2. **The roller/ball naming convention**, which decides clusters 8, 9 and 10 at
   once: `Rodillo: cuádriceps` (category first) or `Cuádriceps con rodillo`
   (movement first). *Both spellings exist today in every language.*
3. **Cluster 12 is a voice question, not a naming one** — *Tobillos para la
   patada* is plain coaching language; *Flexión plantar activa* is anatomical.
   `brand-guidelines.md` §8 points at the first, but this is a swimming cue and
   the audience may know the clinical term.


---

## What shipped, and the one thing that was not just a rename

**Iván's three calls:** PT cat-cow → **Gato-vaca** *(so Portuguese matches English
rather than Spanish; the 3-3 tie had no arithmetic answer)*; roller and ball work
→ **category first** (`Rodillo: cuádriceps`), which settled clusters 8, 9 and 10 in
all three languages at once; and cluster 12 → **Tobillos para la patada**, keeping
`brand-guidelines.md` §8's plain-language voice over the clinical term.

🚨 **The rename created a defect, and fixing it meant touching cue text.**
Renaming rodillas and movilidad to *"Rodillo: vientre del gemelo"* / *"Roll: calf
belly"* / *"Rolo: barriga da panturrilha"* left those two pages **promising a
restriction their cues never explained** — only aquiles carried the reason.
*D3a had already decided that restriction is universal*, so the guard sentence was
**lifted from the aquiles page in each language and trimmed only of its two
Achilles-specific words** ("y ya irritado" / "and already irritated" / "e já
irritado"). **No new copy was authored and nothing was translated.** Six cues, three
languages.

***The lesson worth keeping: a name is not cosmetic when it makes a promise.***
*"Names only" was the right scope, and it still could not be held perfectly — one
rename reached into the cue because the name and the cue are one claim to the
athlete reading them.*

## Tooling this leaves behind

- `automation/exercise-name-audit.js` — **now a regression check, not a discovery
  tool.** Every cluster must report exactly 1 name per language. *Above 1 means a
  page drifted again: fix the page, do not relax the file.*
- `automation/exercise-renames.json` + `apply-exercise-renames.js` — the map and
  its applier, kept as the record of exactly what changed.


---

## The three rounds

| round | scope | renames |
|---|---|---|
| 1 | the 15 clusters with a **Spanish** divergence, all languages | 54 |
| 2 | three clusters missed entirely by round 1's hand-written list (`twist`, `childReach`, `thoracicRoller`) | 3 |
| 3 | eight clusters where **Spanish agreed and EN or PT did not** | 12 |
| | | **69** |

**Round 3's rule, Iván's call: the EN/PT name mirrors the Spanish canonical.**
*Chosen over "the activation matrix wins" and "best in each language" because it
is mechanical and matches how the content is actually produced — authored in
Spanish, translated after.* Gives `Glute bridge` (ES is singular), `Stick
pass-through` and `Passada de bastão` (ES says *bastón*), `Isquiotibiais com
toalha` (ES says *Isquios*), `Ponte numa perna`, `Bridge with a march`.

⚠️ **A second fragility surfaced and is not fixed, only documented:** renaming
broke `apply-exercise-merge-map.js`, whose keys are `(artifact, normalised name,
type)`. Every key had to be rewritten through the rename map. **Names are not a
stable key**, and that is precisely the argument for the branch, whose point is a
global id per exercise. *Until then, a rename and the merge map must be updated in
the same pass.*

✅ `apply-exercise-renames.js` is now **idempotent** — re-running it reports
"already applied" instead of failing, because this map is a permanent record.
