# Activation Matrix — the adaptive activation routine

---

## v1.1 — SWIMMING added as a third sport (September 3, 2026)

**Live in all three languages** — `/members/activacion/`, `/members/en/activation/`, `/members/pt/ativacao/`. Each builds **14 routines**, not 8: run and bike keep two equipment options each, swimming has three, so the grid is 4 + 4 + 6. `library.json` and all three members-home cards name the three sports.

*ES shipped first and EN/PT followed the same day, once Iván had checked the Spanish page.* **The EN and PT edits were applied by one script for both languages**, so the *structural* transformation is provably identical and only the copy differs — which is also what makes the run/bike regression snapshots meaningful. Every replacement asserted its anchor before firing.

### ⚠️ A Nunjucks comment rendered on the live page

Two explanatory comments written **inside `{% raw %}`** shipped as visible text on the Spanish page, and Iván saw them before any check did. Inside a raw block a Nunjucks comment is not a comment — **it is literal text**.

Nothing caught it: the build succeeded, every routine assertion passed, and the 390px sweep was clean, because the leak is perfectly valid markup that simply says the wrong thing to a human. **`automation/build-sanity.js` now walks every built HTML page and fails on any surviving template delimiter** — and it was tested by injecting the exact bug and confirming it fires. *A site-wide sweep at the time found these two and nothing else.*

**The rule, written at the top of all three pages:** every note about these pages goes in the front-matter comment block, which is outside the raw block. Or use an HTML comment.

### Why it lives here and not on its own page

Iván left the call to me. It goes in the matrix, but the usual argument for merging does **not** apply and the doc should say so plainly: **the exercise overlap with run and bike is almost nil.** The run/bike library is hip and leg; swimming is thoracic, scapular and core. Two exercises rhyme (cat-cow, child's pose) and even those got swim-specific cues, so nothing is literally shared.

**The merge is justified by product coherence, not code reuse.** The library carried two activation entries once — the fixed running and cycling tools — and consolidating them into one adaptive tool was a deliberate Aug 13 decision. A standalone `/members/activacion-natacion/` re-creates exactly the thing that decision removed, in a business whose core market does all three sports. *Do not let a future pass "simplify" this by splitting it back out; the reason is written at the top of the page too.*

### Two structural changes it forced

1. **The equipment question is now sport-aware** — the question itself, not just the answer. A mini-band is right for run and bike and is the wrong *object* for swimming, where the useful kit is a long band and a stick. `EQUIP[sport]` holds label, hint and options, and the third question re-renders when the sport changes. **It also resets the answer**: `swim|…|stick` exists and `run|…|stick` does not, so a stale answer carried across a sport switch would have thrown. That reset is asserted in the verification.
2. **Phase names moved out of `build()` and into each routine.** They were hardcoded `Suelo / De rodillas / De pie`, which was true of all eight routines until swimming arrived. Swimming goes **standing → floor → standing**: you warm up on your feet (in a cold pool hall that matters more than a tidy progression), do the floor block, and the *last* thing before the water is the stroke gesture. The engine has always read phase names from the data, so this cost nothing.

### ⚠️ Stick dislocates are deliberately absent

The source doc called them *"insustituible para abrir la cápsula anterior."* **For swimmers that is usually backwards.** Competitive swimmers are typically **lax** at the anterior capsule, not stiff; what they lack is internal rotation and stability — which is exactly what `/members/hombro/` is built around, shipped the same day. Prescribing end-range external rotation and extension on a long lever, to the population most likely to be impinged, is **the same class of error as the sleeper stretch**.

What ships instead is a **capped pass-through** (`stickPass`) whose cue carries the cap in the text, so it cannot be performed as a dislocate by someone who skips the preamble: *stop where the ribs flare, the lower back arches, or the shoulders rise.* **Do not restore dislocates.**

### 🚧 Guardrail: this must not become stroke teaching

`methodology.md` is explicit that Iván does not teach swimming. The catch simulation sits right on that line. Its cue primes the *feel of pressure* and then defers: *"la técnica se trabaja en el agua."* **A verification assertion checks that deferral is present in every swim routine** — because the natural way to improve this cue is to add technique detail, and that is precisely what must not happen.

### Content changes to Iván's source, all four chosen by him

| Change | Why |
|---|---|
| **Warm-up moved first** | The source opened on the floor in quadruped; arm circles and the squat — the only two things that raise temperature — were third and fifth. Backwards for a 6am pool deck. |
| **Ankle plantarflexion added** | The source only mentions it in passing inside the squat. This is a triathlon business: swimmers who also run have the stiffest ankles in the pool, and a stiff ankle brakes rather than propels. |
| **Neck rotation added** | Breathing rotation is as much a neck movement as a trunk one. A stiff neck after a desk day is why athletes lift the head instead of rotating — and lifting the head sinks the hips. `sit` routines only. |
| **Link out to the shoulder tool** | An aside on the setup screen, shown for swimming only, sending a shoulder that already hurts to `/members/hombro/` rather than activating into pain. |

**Two things were cut from the source on volume grounds:** the 3-round plank became a single 40s streamline hold (three rounds plus rest was a third of a 5–7 minute activation on one exercise — that is training, not activation), and rep counts became times, because this engine is timed and the whole matrix is. *"8–10 per side" renders as 30s per side, which is the same work.*

### Duration — and one thing worth knowing

Target was 8–10 minutes, Iván's call, against the source's 5–7 and the run/bike siblings' 16–19.

| routine | min | | routine | min |
|---|---|---|---|---|
| `swim\|wake\|none` | 6.8 | | `swim\|sit\|none` | 8.9 |
| `swim\|wake\|band` | 8.7 | | `swim\|sit\|band` | **10.8** |
| `swim\|wake\|stick` | 8.8 | | `swim\|sit\|stick` | **10.8** |

**The first build had the two `sit` routines at 12.4 minutes, and the cause was structural rather than arithmetic:** `sit` was *adding* `neckRot` and `childSwim` on top of the complete `wake` routine. That is not how `run|sit` works either — that one **swaps** `floss` for `kneeChest`. Fixed by swapping too: `sit` drops `swimSquat` and gains the neck and lat work, on the content reasoning that **after eight hours at a desk you are not cold, you are folded shut** — temperature is the `wake` problem, opening is the `sit` problem. `threadNeedle` and `childSwim` also dropped from 40s to 30s per side, which is closer to the source's own 8–10 slow reps than 40s was.

***The two longest still land at 10.8, not 10.*** Left there and reported rather than trimmed further: contorting the content to hit a round number I proposed is worse than saying what it actually is. **Worth Iván's eye when he runs it.**

### Verification

**151 checks** (`swim-activation.js`), including:

- **A regression snapshot.** All eight run/bike routines were captured *before* the change — every exercise name, mode, duration, tag and cue, plus titles, contexts and done-text — and compared after. **Byte-identical.** This is the check that matters most: the change touched the shared `build()` and the shared routine table, and the eight routines Iván already approved must not have moved a character.
- All 14 routines build; no duplicated exercise within a routine; every exercise carries a cue.
- **Clinical:** no dislocates in any wording, in any branch; the stick exercise is capped *and says so*; the three stated objectives (thoracic, scapular, streamline core) each appear; ankle work everywhere; neck work in `sit`.
- **Equipment honesty:** no routine may require kit the athlete said they lack — `none` branches contain no band or stick tag, `band` branches contain no stick tag. And the context pill never says "minibanda" for a swimmer.
- **The sport switch:** three options for swimming and two otherwise, the question text changes, the aside appears and hides, and **a stale `stick` answer is reset when switching back to running** rather than producing a routine key that does not exist.
- A full timed walk to the done overlay on `swim|sit|stick`, and 390px layout on both the 3-option sport group and the 3-option swim equipment group.

---

**Status: v1 SHIPPED in Spanish (EN + PT same day), August 13, 2026 **· verified: 2026-08-14**** — `/members/activacion/`. The two fixed tools it replaced (`/members/activacion/` running and `/members/activacion-ciclismo/`) are deleted, on Iván's call. **The tightness axis is v2 and deliberately absent from v1.**

**Sequence Iván set:** v1 Spanish → translate to EN and PT → happy across all three → *then* v2 adds tightness. ***EN and PT shipped the same day*** — `/members/en/activation/` and `/members/pt/ativacao/`. **Next step is Iván actually running one, in each language, on a phone**, before v2 starts. *Do not add the tightness axis to Spanish only; that reintroduces exactly the drift the i18n branch exists to stop.*

## How v1 is built

**Three pages, one structure.** The exercise library, the 8 routine lists and the build function are identical in `members/activacion/`, `members/en/activation/` and `members/pt/ativacao/` — only the strings differ. *When v2 adds tightness, it adds the same lookup to all three in one pass; adding it to Spanish first is the drift this whole sequence exists to avoid.* UI chrome (tabs, buttons, rest labels) is **not** in these pages — it lives in `site/_data/activationUi.json`.

One `L` library object (one definition per exercise, one cue) and eight `R` routines that are lists of ids. **The engine is untouched:** the page renders its own three-question setup, builds `window.ACTIVATION_DATA` from the answers, then injects `activation-tool.js`, which by that point sees an ordinary activation tool. `partials/activation-tool.njk` gained one flag, `matrixMode`, that suppresses its own boot script for this page only.

**Two content decisions taken during the build, both needing Iván's confirmation:**

1. **"Figure 4 right priority" and "hold 90 seconds right side" were neutralised.** Those are Iván's own asymmetry — his right-side neural tension — written when this was a routine for himself. Published to every athlete they would prescribe one person's imbalance to everyone. The cue now reads *"empezá por el lado que sentís más rígido."* **If a right-side bias is meant generally, say so and it goes back.**
2. **The routines run 16–19 minutes**, not the ~10 of the tools they replaced — 13–14 exercises, most unilateral, at 40–45s per side plus 15s rest. Roughly five of those minutes are rest. *Levers if that is too long: cut `restSeconds`, drop rest between the floor holds, or trim exercises.* Left at Iván's numbers rather than quietly shortened his prescription.

---

## Original status note (superseded)

**Was: designed, not built.** Iván wrote this; it has never been published, and until August 13, 2026 it existed **only as a file uploaded into a chat conversation** — not in this repo, not on the site, not in the project knowledge. It was found again only because he remembered designing it and asked where it went. *That is the reason this file exists: a routine that lives in an upload folder is one closed conversation away from gone.*

**Last updated:** August 13, 2026.

---

## What it is

A single activation tool that builds the routine from what the athlete answers, instead of shipping one fixed circuit:

| Axis | Options | Count |
|---|---|---|
| Sport | cycling, running, ~~and that is all~~ **swimming** *(added Sept 3, 2026 — see v1.1 at the top)* | ~~2~~ **3** |
| Moment | just woke up, sat all day | 2 |
| Equipment | none, mini-band — ***sport-dependent since v1.1:*** *swimming offers none / long band / band + stick* | 2 *(3 for swim)* |
| Tightness | none, or one of 10 named areas | 11 |

That is **8 base routines** (2 × 2 × 2), each with an optional add-on drawn from a **10 × 2 tightness table** — the tightness fix differs by sport, so lower back is the same movement for both while hamstrings, glutes and ankles are not.

**The assembly rule, and it is the whole design:** the tightness exercise is appended to the **end of the floor phase**, before standing. It fits the floor → knees → standing progression naturally and treats the restriction before load is applied. One rule, applied to every combination — which is what makes 88 nominal variants buildable as 8 lists plus a lookup table rather than 88 hand-written routines.

## How it relates to what is already live

`/members/activacion/` (running) and `/members/activacion-ciclismo/` (cycling) are **not** this. They are fixed 8-exercise circuits on template v2, with a per-exercise "replace" button offering a variant — including mini-band variants. **The band axis is therefore already half-solved at the exercise level; the moment and tightness axes are not represented at all.**

Two live decisions were parked when this was last discussed and are still open:

1. **Whether this replaces the two existing tools or sits beside them.** Replacing them means one URL and one card instead of two, and an athlete who just wants to start has to answer three questions first. Sitting beside them means the library carries three activation entries that overlap heavily.
2. **Whether the tightness axis ships in v1 at all.** The 8 base routines are the bulk of the value and are a straight data file on template v2. The tightness table needs a second prompt, a lookup, and an insertion point in the engine — it is most of the build for the smaller half of the benefit.

*Neither is a technical question. Both are Iván's.*

## Content

*Below is Iván's original text, preserved exactly as written. Do not restructure it into the engine's data format here — when this gets built, the data file becomes the source and this section becomes the record of where it came from.*

---

ACTIVATION - NO BAND 

CYCLING — Just woke up (floor → knees → standing)

Floor: Neural flossing both legs · Figure 4 right priority · Glute bridge slow holds · Dead bug · Cat-cow

Knees: Child's pose with lateral reach · Kneeling hip flexor stretch both sides

Standing: Hip circles standing · Leg swings front-back · Lateral leg raises · Calf raises slow

CYCLING — Sitting all day (floor → knees → standing)

Floor: Supine knee to chest both · Figure 4 right priority · Glute bridge slow holds · Supine spinal twist both sides

Knees: Cat-cow · Child's pose lateral reach · Kneeling hip flexor squeeze

Standing: Hip circles standing · Leg swings front-back · Squat to stand · Calf raises slow

RUNNING — Just woke up (floor → knees → standing)

Floor: Neural flossing both legs · Figure 4 right priority · Glute bridge slow holds · Dead bug · Supine hamstring stretch with strap or towel

Knees: Cat-cow · Kneeling hip flexor stretch · World's greatest stretch (half-kneeling)

Standing: Leg swings front-back · Leg swings lateral · A-skip slow · High knee march · Ankle circles and calf raise

RUNNING — Sitting all day (floor → knees → standing)

Floor: Supine knee to chest · Figure 4 right priority · Glute bridge slow holds · Supine spinal twist both sides · Dead bug

Knees: Cat-cow · Kneeling hip flexor squeeze · World's greatest stretch

Standing: Leg swings front-back · Leg swings lateral · High knee march · A-skip · Squat to stand · Calf raises slow


-----------

ACTIVATION - WITH MINI BAND - 

same structure, just noting where a mini-band upgrades the exercise.

CYCLING — Just woke up (mini-band available)

Floor: Neural flossing both legs · Figure 4 right priority · Glute bridge — band above knees · Dead bug — band above knees · Cat-cow

Knees: Child's pose with lateral reach · Kneeling hip flexor stretch both sides

Standing: Hip circles standing · Leg swings front-back · Lateral leg raises — band at ankles · Calf raises slow

CYCLING — Sitting all day (mini-band available)

Floor: Supine knee to chest both · Figure 4 right priority · Glute bridge — band above knees · Supine spinal twist both sides

Knees: Cat-cow · Child's pose lateral reach · Kneeling hip flexor squeeze

Standing: Hip circles standing · Leg swings front-back · Squat to stand — band above knees · Calf raises slow

RUNNING — Just woke up (mini-band available)

Floor: Neural flossing both legs · Figure 4 right priority · Glute bridge — band above knees · Dead bug — band above knees · Supine hamstring stretch with towel

Knees: Cat-cow · Kneeling hip flexor stretch · World's greatest stretch

Standing: Leg swings front-back · Leg swings lateral · A-skip slow · High knee march · Ankle circles and calf raise — band at ankles for resistance on raise

RUNNING — Sitting all day (mini-band available)

Floor: Supine knee to chest · Figure 4 right priority · Glute bridge — band above knees · Supine spinal twist both sides · Dead bug — band above knees

Knees: Cat-cow · Kneeling hip flexor squeeze · World's greatest stretch

Standing: Leg swings front-back · Leg swings lateral · High knee march — band at ankles · A-skip · Squat to stand — band above knees · Calf raises slow


-----------


Tight lower back: Cycling = Supine knee rocks side to side (lying, both knees to chest, rock gently left and right 30 seconds) ; Running = same

Tight upper back / thoracic: Cycling = Seated thoracic rotation with hands behind head, 8 reps each side with 2 second hold ; Running = Thread the needle (on hands and knees, thread one arm under the body and rotate, 30 seconds each side)

Tight neck: Cycling = Slow neck rolls with chin drop — forward, right, back, left, 5 circles each direction, never forced ; Running = same

Tight hip flexors: Cycling = Kneeling hip flexor stretch with glute squeeze, 60 seconds each side — squeeze the back glute hard, this is the key cue ; Running = same, hold longer (90 seconds each side)

Tight soleus / calf: Cycling = Bent-knee wall stretch — foot flat against wall, knee bent and pushed toward wall, hold 45 seconds each side. Targets soleus specifically, not gastrocnemius ; Running = same, add 10 slow bent-knee calf raises off a step after the stretch

Tight hamstrings: Cycling = Supine hamstring stretch with towel — lying on back, loop towel around foot, leg straight toward ceiling, hold 60 seconds each side ; Running = same but hold 90 seconds right side, as your neural tension makes this especially important before running loads the hamstring

Tight glutes / piriformis: Cycling = Seated figure 4 — sitting on chair edge, cross right ankle over left knee, hinge slightly forward, hold 60 seconds. Can be done on the bike before clipping in ; Running = Full supine figure 4 on floor, 90 seconds right side

Tight adductors / inner thigh: Cycling = Seated butterfly — sitting on floor, soles together, gentle forward hinge, hold 60 seconds ; Running = Half kneeling lateral lunge — kneeling on left knee, right leg out to the side, shift hips toward right foot, hold 30 seconds each side

Tight IT band / outer hip: Cycling = Supine crossover stretch — lying on back, bring right knee across body to the left, arms wide, look right, hold 45 seconds each side ; Running = same, but standing version against a wall also works — cross right leg behind left, lean away

Tight ankles: Cycling = Ankle circles 10 each direction each foot, then heel-to-toe rocks 10 reps — less critical for cycling but worth doing if you feel restriction ; Running = Ankle circles then bent-knee wall stretch then 10 slow eccentric calf raises off a step — all three in sequence, mandatory before running if ankles are genuinely restricted

The rule for all of these: add the relevant exercise at the end of the floor phase before transitioning to standing. It fits the position sequence naturally and addresses the tightness before load is applied. 🎯
