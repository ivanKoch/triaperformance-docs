# Exercise library — decision ledger

**Home doc for the canonical members-area exercise library.** Owns the decisions
only. The dedup evidence is `members-exercise-dedup-review.md`; the extracted
inventory is `data/members_exercises.csv` and `data/members_exercises_unique.csv`;
the generator is `automation/extract-members-exercises.js`.

Nothing here is built yet. This file records what Iván has signed off, in order,
so a later session does not re-open a settled question.

---

## D1 — Cue model. **DECIDED September 8, 2026: merge, keep notes.**

One canonical `cue` per exercise carrying the **movement description**, plus an
optional one-line `note` per placement carrying the **context sentence**.

*Evidence that shaped it:* the six Gato-camello / Gato-vaca cues are the same
movement description six times; the only real difference is a trailing sentence
of intent — *"acabas de levantarte"*, *"post-entreno esto es para soltar"*,
*"esto es literalmente pedalear"* — and in four of six that sentence is a
coaching decision, not drift.

**What this rules out, and why it was rejected rather than overlooked:**

- ~~Drop the context sentences~~ — they are what makes a routine read as coached
  rather than generic. Rejected on the same evidence that produced the rule.
- ~~`movement:` key only, change no copy~~ — genuinely cheaper and it would have
  solved the video problem alone, but it leaves 756 name+cue copies in place and
  every new tool adds ~75 more. Fails the "once, not forever" test.

**The measured saving, stated honestly:** on the Gato-camello cluster, ~450 words
across three languages becomes ~219. **Halved, not eliminated** — the notes
survive and still need translating. *The value is not word count: it is that the
movement description, which is the half a video has to match, can no longer
disagree with itself.*

⚠️ **Standing rule this creates:** a page may override dose (`sets`, `reps`,
`rest`, `secs`) and may add a `note`. **It may not override `cue`.** If a
placement needs different words for the movement itself, it is a different
exercise with its own id — not a local override. *That rule is the whole reason
the library holds; an override field would rebuild the drift in a week.*

---

## D2 — The 26 merge clusters
**CLOSED September 8, 2026. All 26 clusters decided: 21 merged with no coaching
decision needed, 5 resolved below.** Drafts: `exercise-library-batch1-draft.md`
(the nine 3+ clusters) and `exercise-library-batch2-draft.md` (the seventeen
2-copy clusters).

⚠️ **The drafting lesson from batch 2, worth more than any single merge:** the
thoracic roller extension's two copies carried *different* safety cues — "los
glúteos quedan apoyados" and "nunca por debajo de las últimas costillas". Same
error, two mechanisms, and the tempting edit was to keep the shorter cue.
**Both were kept.** *In every remaining merge, the risk is not losing a nice
sentence — it is silently dropping a guardrail that only one copy happened to
carry.*

### D2a — Bird dog. **DECIDED: keep separate.**
Two entries, `birddog` (two-second hold) and `birddog-dynamic` (continuous
alternation), **sharing one video**. *core-corredor's cue says "alterna sin
pausas largas" and its stated purpose is the cross-gait pattern of the stride —
merging it into the isometric would have changed the prescription silently.*
⚠️ **This is the precedent for the whole library: same movement + different
prescription = two entries, one video.** The video is keyed to the movement, the
entry to the prescription. Do not collapse a pair like this to reduce the count.

### D2b — Leg swings. **DECIDED: split into the two that already exist.**
recuperación's combined "Balanceo de piernas" becomes two placements, `swingFB` +
`swingLat` — both already in the library from activación and rodillas. *Its
45-second block becomes two blocks; that is a real change to that routine's
timing and is intended.*

### D2d — Psoas. **DECIDED: movilidad joins the squeeze cluster.**
movilidad's *"Psoas de rodillas con apriete"* files under `hipflexSqueeze` with
core-ciclista and core-corredor. **Activación's plain `hipflex` stays its own
entry** — it is the regression half of a base/progression pair activación carries
on purpose. *The automated pass had matched the progression to its own
regression; a cue-similarity score cannot see that one is the harder version of
the other.*

### D2e — Couch stretch. **DECIDED: one entry, prop in the note.**
Canonical cue describes the **wall** version (available anywhere). core's hotel
routine carries a note substituting the bed. **One video.** *Same movement, same
prescription — only the thing the foot rests on changes, which is what `tag` and
`note` exist for. Dose stays per-page, as it does everywhere.*

### D2c — Hold times. **DECIDED: majority wins.**
`bridge` → **2s** (activación's one-second squeeze becomes two, 3 of 4 pages).
`birddog` → **2s** (recuperación's three seconds becomes two).
*Rationale: the outlier was written loosely rather than prescribed. Where a
placement genuinely needs a different hold, it goes in that placement's note —
never as a second version of the cue.*

## D3 — The 73 weak (tier C) pairs. **CLOSED September 8, 2026.**

**61 of 73 were noise** — family resemblance between a base movement and its own
progression (*Puente de glúteos* vs *…a una pierna*, *Dead bug* vs *Dead bug
isométrico*). **A progression is not a duplicate.** 8 merged as pure naming
drift; 2 were kept separate on Claude's call (`Y-T-W` vs `I-Y-T`, `Barridos
90-90` vs `Cadera 90/90` — different movements from the same position); 2 went to
Iván. Detail: `exercise-library-batch3-draft.md`.

### D3a — Calf rolling. **DECIDED: one entry, the Achilles restriction becomes the cue for everyone.**
*"Nunca pases el rodillo por el tendón"* now applies in movilidad and rodillas as
well as aquiles. **The safest cue became the default rather than being kept as
the narrow exception** — Iván's reasoning is that nobody should be rolling an
Achilles tendon, so the restriction was never aquiles-specific in the first place.

### D3b — Single-leg balance. **DECIDED: one entry, eyes-closed as recuperación's note.**
rodillas' cue already framed eyes-closed as the progression; recuperación's note
makes it mandatory for that placement.

---

## ⚑ The rule these three decisions produce — apply it to every future merge

**Split when the MOVEMENT differs. Merge when only difficulty, context or safety
differs.**

- `birddog` / `birddog-dynamic` **split** (D2a) — hold versus continuous
  alternation is a different execution.
- `balance` **merged** (D3b) — eyes open and eyes closed are the same movement at
  two difficulties.
- `rollCalf` **merged** (D3a) — a safety restriction does not create a second
  exercise; it upgrades the one that exists.

*This looked inconsistent while the three were being decided one at a time, and
it is not: the test is the movement, never the wording, the dose or the audience.*

## ✅ SHIPPED September 8, 2026 — names, ahead of the branch

**The name half of D2/D3 is applied to the live pages.** 54 renames, 21 files,
three languages; every cluster now reads one name everywhere. Record and the
three calls Iván made: `exercise-name-harmonisation.md`.

*Why this could ship while the rest is parked: names are display strings that
already existed in all three languages, so harmonising them needed no new copy
and no translation. **Cues cannot ship the same way** — the merged wording has to
be written in Spanish and then translated twice, which is the branch.*

⚠️ **The branch must NOT re-decide names.** *They are done and live. NEXT #15
inherits them.*

## D4 — Canonical id + name per exercise
*Not started, and correctly so — it is generated output, not a decision. It falls
out of applying the merge map, and Iván skims the result rather than authoring it.
**Do not do this before the branch opens:** an id list written now would be a
second source of truth sitting next to the drafts for weeks.*

## D5 — WIP. **DECIDED September 8, 2026: race pages first, library after.**

**Race landing pages (`open-loops.md` NEXT #1) keep the slot. This is queued as
NEXT #15, trigger: the race-pages branch closes.** *(#15 and not #12 — 12/13/14 were
allocated September 4 and #12 is a closed item already sitting in the archive.)*

*The case for going first was made and not taken: it gates the video work, the
video complaint came from paying subscribers twice in one day, and every new tool
adds ~75 more copies to migrate later. The case against won — race pages grow the
top of the funnel and this grows nothing on its own.*

✅ **What survives the parking, and it is most of the value: the decisions do not
expire.** *Filming can start against the ~190 canonical exercises today;
`data/members_exercises_unique.csv` ranks them by reuse.*

⚠️ **One thing genuinely blocks on the branch:** `strength-tool.js` has **no
`video` field and no render branch** — `activation-tool.js` has both. So **89 of
the 252 rows have nowhere to put a video** until this runs: aquiles, rodillas,
hombro, core-ciclista, core-corredor. *If filming starts before the branch, film
the activation-engine exercises first — those four artifacts can show a video the
day it exists.*

---

## The count, derived September 8, 2026

**Reproduce with `node automation/apply-exercise-merge-map.js .`** — the map
encodes D1–D3 and asserts the five decisions that a similarity score gets wrong.
*No figure about this library is to be quoted from memory; re-run the script.*

| | |
|---|---|
| placements (artifact × exercise, ES) | 247 |
| **canonical exercises** | **194** |
| **clips to film** | **193** *(bird dog's two entries share one)* |
| — showable today (activation engine) | 139 |
| — blocked, strength engine has no `video` field | 55 |
| exercises appearing in 2+ artifacts | 33, covering 86 placements |

**One clip serves all three languages** — silent loops carry no narration, so 192
clips cover all **759** placements (253 ES rows × 3).

🚨 **This number moved within one day, which is the point of the script.** *It read
193 canonical / 192 clips at midday; a later session added an exercise and it is
now 194 / 193.* **Do not quote this table — run the script.**

⚠️ **And the first run of the script reported one canonical too few.** *The
automatic pass had re-merged the psoas pair D2d separates, and union-find cannot
be undone after the fact — the override has to suppress the edge before the pass
runs, not correct it afterwards.* **The five assertions now in the script exist
because of that**, and they are the reason this number can be trusted: *a count
nobody can check is not evidence.*

⚠️ **A second defect, found the same day and worse:** the extractor wrote its
intermediate JSON to a **session scratch directory**, so the pipeline only ran
inside the session that created it — a future session would have got a crash, or
worse, a stale file. *Fixed: the intermediate is `data/members_exercises.json`,
in the repo, regenerated by the extractor.* **Run order is
`extract-members-exercises.js` then `apply-exercise-merge-map.js`, both with the
repo root as `argv[2]`.**
