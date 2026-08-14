# Activation Matrix — the adaptive activation routine

**Status: v1 SHIPPED in Spanish, August 13, 2026** — `/members/activacion/`. The two fixed tools it replaced (`/members/activacion/` running and `/members/activacion-ciclismo/`) are deleted, on Iván's call. **The tightness axis is v2 and deliberately absent from v1.**

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
| Sport | cycling, running | 2 |
| Moment | just woke up, sat all day | 2 |
| Equipment | none, mini-band | 2 |
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
