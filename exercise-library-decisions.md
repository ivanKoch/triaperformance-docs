# Exercise library — decision ledger

**Home doc for the canonical members-area exercise library.** Owns the decisions
only. The dedup evidence is `members-exercise-dedup-review.md`; the extracted
inventory is `data/members_exercises.csv` and `data/members_exercises_unique.csv`;
the generator is `automation/extract-members-exercises.js`.

Nothing here is built yet. This file records what Iván has signed off, in order,
so a later session does not re-open a settled question.

---

## D0 — What this cost, and the rule it earns

*Written September 9, 2026, one day after the fact, because the failure is more
instructive than any of the decisions below it and would otherwise survive only
as "the day I lost an afternoon."*

### What actually happened

Nine artifacts were authored over roughly four weeks. Each one was written from
scratch: the author opened a blank page, wrote the routines the athlete would
see, and wrote the exercise names and cues inline as part of writing the routine.
That is the natural way to build the first one. It is also the natural way to
build the ninth, because nothing in the process ever asks whether the exercise
being written already exists somewhere else.

The problem surfaced on September 8 — not from an audit, not from a hygiene pass,
but because filming videos required a list of what to film. **There was no list.**
Producing one meant extracting the exercises out of nine pages of hand-written
markup, and the extraction is what showed the shape of it.

### The numbers, and the reframe they force

The instinct is to say "there were 700 exercises." That is the wrong sentence and
it produces the wrong fix.

| | |
|---|---|
| Exercise placements, Spanish | **253** |
| Same, in each of EN and PT | **253 each** |
| **Total name + cue copies in the repo** | **759** |
| **Canonical exercises underneath them** | **188** |
| Clips actually needed to film | **187** |
| Clusters where one exercise had 2+ names | **33** |
| Worst case | a **four-way** name split |

*Derived by `automation/extract-members-exercises.js` and
`automation/apply-exercise-merge-map.js` — re-run them rather than quoting these.*

**There were never 700 exercises. There were 188 exercises stored 759 times.**

That distinction is the whole finding. "700 exercises" describes a content
problem, and the fix for a content problem is a long afternoon of tidying.
"188 exercises stored 759 times" describes a **missing entity** — there was no
such thing as *an exercise* in this system, only text that happened to appear on
pages — and the fix for that is a schema, which is a different and larger job.

The visible symptom was the cost of a correction: editing one cue correctly meant
editing **up to 18 places across 15 files**. That is why `core/` came to call
cat-cow *"Gato-vaca"* while five other artifacts called it *"Gato-camello"*.
Nobody made a mistake. The structure made agreement expensive and disagreement
free.

### Why it went unnoticed for nine artifacts

**Because each one was cheap to build.** That is the uncomfortable half.

A missing entity model is normally caught by pain — the second time you build
something, the duplication hurts enough to make you stop and factor it out. Here
the second, third and ninth artifacts each cost an afternoon, so the question
that duplication is supposed to trigger never got triggered. The tooling removed
the friction that would have forced the design decision.

⚠️ ***The general form, and it is worth stating as a rule rather than a war
story: when building an instance gets cheap, the missing abstraction stops
announcing itself.*** *The old signal for "you need a schema here" was that
copying was laborious. That signal is gone. It has to be replaced with a
deliberate check, because nothing in the work itself will now supply it.*

### The second finding: it was discovered by accident

Nothing in this repo would have found this. The hygiene pass diffs
`library.json` against `site/members/`; the build guards check links and alt
text; `open-loops.md` tracks what was decided. **None of them can see that two
pages describe the same movement in different words**, because none of them
holds a concept of *the same movement*.

It surfaced only because filming needs a list, and needing a list is the first
task in fourteen months that required the entity to exist. Had videos never been
wanted, the drift would have compounded silently through artifact #10, #11 and
#12.

*This is the same family as the September 2 inventory finding — an inventory is
only a control if the thing it is meant to catch would appear in it — and it is
the sharper version of it: here the control could not exist at all, because the
thing it would check was not a thing the system represented.*

### What was actually fixed on September 8, and what was not

**Do not describe this as "an afternoon of standardising with the plumbing still
undone."** It undersells the first half and blurs the second.

**Closed, same day, all three languages:**

- **69 name renames** across 21 pages, three languages, three rounds. All 33
  clusters now read one name everywhere; regression check
  `automation/exercise-name-audit.js` reports 33 clusters, 0 divergent.
- **Every cue harmonised** — 253 placements × 3 languages, Iván's own text.
  Spanish first, then EN/PT the same evening.

**Still open, and this is the durable half (`open-loops.md` NEXT #15, parked
behind race pages):**

- **`site/_data/exercises.json` does not exist.** The words agree today; nothing
  *makes* them agree tomorrow. Same pattern and same precedent as
  `site/_data/library.json`, whose own header records the identical failure on
  the marketing side.
- **`strength-tool.js` has no `video` field.** `activation-tool.js` has one and
  renders it. So **55 of the 188 canonical exercises have nowhere to put a video**
  — aquiles, rodillas, hombro, core-ciclista, core-corredor. The filming problem
  that started all of this is still not solved for a third of the library.
- **`artifact-publish-runbook.md` still has no lookup step.** An author writing
  artifact #10 today writes its exercises from scratch, exactly as the first nine
  did.

🔑 ***That last one is the only fix that matters, because it is the only one that
prevents recurrence rather than repairing damage.*** *A canonical library that
nothing is obliged to consult is a suggestion, and a day of harmonisation buys
about six weeks before the next tool re-splits it.*

### The three rules this earns

1. **Before authoring artifact N+1, ask what entity it instantiates — and whether
   that entity has a home.** Not "has this been built before" (the wrong
   question, answered by memory) but "does the thing this page is made of exist
   as data anywhere" (the right one, answered by looking).

2. **The lookup must match on the movement, not the string.** An author writing
   *"Gato-vaca"*, *"Cat-cow"* or *"Gato camello"* has to be shown the existing
   `catcow` entry. `automation/cluster-exercise-duplicates.js` already does that
   matching against the corpus; the missing piece is running it against a
   *candidate*, and a runbook step that requires it.
   **Build it in the same branch as `exercises.json`, not after.**

3. **When a build gets cheap, add the design checkpoint the cost used to
   supply.** The friction that used to force factoring-out is gone and is not
   coming back. Whatever replaces it has to be explicit, scheduled, and part of
   the authoring process — not a virtue exercised when someone happens to notice.

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

**The name half of D2/D3 is applied to the live pages.** 69 renames in three
rounds, three languages; all 33 clusters now read one name everywhere. ⚠️ *Round 1
shipped incomplete and its checker reported a false PASS — see the harmonisation
doc; the audit now derives its clusters from the decisions rather than a list.* Record and the
three calls Iván made: `exercise-name-harmonisation.md`.

*Why this could ship while the rest is parked: names are display strings that
already existed in all three languages, so harmonising them needed no new copy
and no translation. **Cues cannot ship the same way** — the merged wording has to
be written in Spanish and then translated twice, which is the branch.*

⚠️ **The branch must NOT re-decide names.** *They are done and live. NEXT #15
inherits them.*

## ✅ SHIPPED September 8, 2026 — the Spanish cues

**Iván wrote all 33 harmonised cues himself** (handed back as a CSV against
`data/cue_harmonisation.csv`); applied to **86 placements across the nine Spanish
pages**. Signed text: `data/cue_harmonisation_signed.json`. Applier:
`automation/apply-harmonised-cues.js`.

### D6a — Gato-camello keeps TWO cues, not one plus a note.
*Iván's call, and a deliberate departure from D1.* The activation/core/mobility/
core group and the recovery version have **different standards, not different
context** — recovery asks for double-slow and for hunting stiff segments. **Two
entries, one video.** *Same shape as D2a: the movement is shared, the
prescription is not.*

### D6b — The bridge merge.
*His harmonised cue for `Puente a una pierna` unified it to knee-to-chest, which
made it **identical** to `Puente de glúteos a una pierna` — same setup, same
movement, two names across five placements.* **Merged into `Puente de glúteos a
una pierna`; the extended-leg version is not retained.**
⚠️ ***Worth keeping: the dedup pass was RIGHT to leave these apart in the morning
and the harmonisation is what made them converge.*** *Merging cues can create
duplicates that did not exist when the clusters were drawn — so the dedup check
has to run **after** a cue pass, not only before it.*

### D6c — Emphasis.
Iván's cues arrived as plain text; **77 of the 87 placements being rewritten
carried `<strong>` on their key clause.** Claude added the markup on the single
clause each cue hinges on — *his words untouched, only marked up* — because
otherwise the most-used exercises in the library would have gone flat next to the
~160 that were not rewritten. **One cue, `Balanceo lateral de pierna`, is left
unbolded**: it is two short sentences with no clause that outranks the other, and
inventing emphasis there would have been worse than leaving it plain.

⚠️ **SPANISH ONLY. EN and PT still carry the old, unharmonised cues.** *Accepted
state, not an oversight: no athlete reads two languages, so each language stays
internally coherent and the cost is maintenance, paid when NEXT #15 runs.*

## ✅ SHIPPED September 8, 2026 — the English and Portuguese cues

**Iván wrote all 33 EN and PT names and cues** (`data/cue_harmonisation_en_pt.json`);
applied to **86 placements per language, 172 cues, 89 name changes**, by
`automation/apply-en-pt-harmonisation.js`. **All three languages are now
harmonised.** *The debt opened this morning was closed the same day.*

### D7a — English adopts Title Case for exercise names.
*Iván's convention, applied across all 33.* `Cat-Cow`, `Dead Bug`, `Glute Bridge`.
**Casing is a per-language convention, so this does not conflict with the
mirror-the-Spanish rule (D-round 3), which governs word choice, not capitals.**

### D7b — Five Portuguese names in the CSV reversed decisions taken earlier the same day, and were NOT applied.
*His CSV was generated before those calls.* **Kept live:** `Gato-vaca` (not
Gato-camelo), `O melhor alongamento do mundo` (not the English title on a
Portuguese page), `Rolo:` / `sobre o rolo` (not "Foam roller:"), `Isquiotibiais
com toalha`, `Apoio em uma perna` (not the clinical *unipodal*). *Also kept
`Psoas com aperto de glúteo` over "com ativação" — the cue itself says* "o aperto
é o exercício", *so the name would have contradicted its own cue.*
⚠️ ***The general lesson: a CSV exported before a decision session will quietly
undo it.*** *Diff a returned file against what is live before applying it, never
against the file that was sent out.*

### D7c — Three corrections to the submitted text.
- **EN, calf roller:** "highly **nerved** tissue" → "highly **innervated** tissue".
- **PT, bird dog:** "não pode **tombear**" → "**tombar**" (not a word).
- **PT register:** three cues (Psoas, Couch stretch, Balanceo lateral) used *tu*
  imperatives where the other thirty use *você*. Normalised.
  🚩 ***Portuguese has no register check.*** *Spanish has `automation/register-sweep.py`
  and it exists because exactly this drifted. **A PT arm for that script is worth
  building before the next Portuguese content pass** — this was caught by reading,
  which does not scale.*

## ✅ SHIPPED September 8, 2026 — the remaining 166 cues, all three languages

**Iván wrote every one** (`data/cue_remaining_signed.csv`, applied by
`automation/apply-remaining-cues.js`). **The whole library — 253 placements ×
3 languages — now carries harmonised names and cues.** Final counts:
**188 canonical exercises, 187 clips** (136 showable today, 52 waiting on the
strength engine's video field).

### D8a — Four duplicates his ENGLISH naming exposed, all merged.
*`Paloma (pigeon)` = `Postura de la paloma`; `Isquios acostado` = `Isquios boca
arriba`; `Zancada baja con glúteo activo` = the harmonised `Psoas con apriete de
glúteo`; `Puente de glúteos con marcha` = the harmonised `Puente con marcha`.*
🔑 ***The Spanish names had hidden all four. Giving one exercise one English name
is what made them visible*** — an argument for the canonical library that no
amount of Spanish-side auditing would have produced.
*The last two took the already-harmonised text, not the newly written cue,
or the merge would have re-diverged on arrival.*

### D8b — Two more merged themselves, and one had to be blocked.
Once the cues were harmonised the automatic pass pulled in
**`Postura del niño sostenida` → `Postura del niño`** (correct: both are a static
hold, and "sostenida" only named what the parent *flow* is not) and
**`Bird dog isométrico` → `Bird dog`** (wrong, and suppressed: a whole-block hold
against a two-second reach is a different execution — the D2a ruling).
⚠️ ***A cue pass changes what the duplicate detector can see. Run the dedup check
AFTER writing cues, not only before.***

### D8c — Three content losses, caught by the test suite, restored from git.
**The returned cues had quietly dropped:** the link from the mobility close to the
breathing tool; the frog's *"solo en un día sin sesión"* rule that
`recovery-brief.md` owns; and **half the IT-band correction** — the surviving
sentence said the band "no se estira **a golpes**", losing *"lo que se afloja es
lo que tira de ella"*, which is the actual instruction to roll the TFL instead.
*All three restored verbatim from `git show HEAD:`, none rewritten.*
🚩 ***This is the strongest argument in the whole session for the test suite:***
*`tests/mobility-matrix.js` carries the comment "the IT band correction has to say
WHY, or the next pass restores the roller." The next pass came, and it did.*

### D8d — Seven test assertions widened, none deleted.
*Pinned to a superseded name or one author's verb: "winged dragon" → "Flying
Dragon", "postura do sapo" → "postura da rã"* (**a sapo is a toad; his word is
better**), *"stick" → "Dowel", "vertebra by vertebra" → "one vertebra at a time",
"does not" → "doesn't".* **Every one still guards its content; the alternation was
widened and the reason written next to it.**

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
