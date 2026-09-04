# Core de Corredor — runner core artifact

**Status: v1 SHIPPED in all three languages, September 4, 2026** — `/members/core-corredor/`, `/members/en/runner-core/`, `/members/pt/core-do-corredor/`. *ES first, EN and PT the same day, at Iván's request.* Fifth artifact on the strength engine (`strength-tool.js`; engine home doc: `knee-strength-brief.md`).

## What it is

One question — 3 or 4 rounds — then warm-up → circuit × N → cool-down. Bodyweight throughout. Source: Iván's `Running core.md`, not committed; this file is the home.

**Premise:** a cyclist's pelvis is anchored to a saddle; a runner's lands on one leg at a time. Every footfall asks the core to absorb the impact, stop the free-side hip dropping (frontal plane) and resist the torsion the arm swing generates (transverse plane). So the circuit is *anti* work like the cyclist's — but it ends standing on one leg, because that is the position running actually happens in.

| Circuit | Plane / role |
|---|---|
| Dead bug con presión isométrica | Anti-extension |
| Plancha lateral con rodilla al pecho | Anti-lateral-flexion (glute medius) |
| Plancha alta con alcance al frente | Anti-rotation |
| Puente a una pierna isométrico | Posterior chain |
| Zancada inversa con rotación | Rotation · bipedal integration |
| Peso muerto a una pierna | Single-leg support |

## Standalone, not merged with the cyclist routine — Iván's call, Sept 4, 2026

**Activation and mobility are one artifact with a sport switch; core is two artifacts.** *The reason is that the switch would have almost nothing to switch:* the two routines share a premise ("the core prevents movement, it does not create it") and diverge on nearly every exercise, because the cyclist's demand is a pelvis held still against two pedals and the runner's is a pelvis held level over one foot. A sport axis on one page would have produced two disjoint lists behind a button. **Do not merge them later without re-opening this.**

## Rounds are phases — no engine change

Same pattern as `core-ciclista`, same reason: `strength-tool.js` walks phases in order and prints the phase name, so each round renders as its own phase ("Vuelta 2 de 3"). Rest rides on the exercises — 15s between exercises inside a round, 75s on the last one, which is the rest between rounds. See `ai-infrastructure-documentation.md` §34.

## Changes from the source doc

**Two, both Iván's picks:**

1. **Thread the needle added** to the warm-up. The circuit is entirely anti-rotation, but the thorax still has to be *able* to rotate against the arm swing — if it can't, the lumbar spine rotates in its place. Same call, same reasoning, as the cyclist routine.
2. **Paracaidista (prone superman + W) → peso muerto a una pierna, unloaded.** *The reasoning is worth keeping:* the superman holds simultaneous lumbar and hip extension, which is the anterior-tilt fault exercise 1 exists to prevent — the same structural objection as hollow → long-lever plank on the cyclist page, where the exercise rehearses the position the routine is meant to stop. The replacement closes the circuit standing, on one leg, training posterior chain, balance and anti-rotation at once; it is the closest thing to running mechanics in the list.

⚠️ **The swap has a cost and it was accepted knowingly: upper-back and scapular endurance is now trained nowhere in this routine.** The source doc's rationale for the paracaidista — *stay tall, keep the airway open, don't slump when the lactate accumulates* — is real and is not covered by anything that replaced it. A second option was on the table (prone W with the legs on the floor, which keeps the scapular work and drops the lumbar extension) and was not taken. **If this gap gets filled, fill it with that, not with a full superman.**

**Added, not in the source:** the technique rule in the dosing box — failure here is not fatigue, it is the pelvis beginning to move; when that happens the set ends, reps remaining or not. Carried over from the cyclist routine because it is the same failure mode.

**An answer to the question the source doc ends on.** It asks whether to use this as pre-activation before track work. **No** — it is fatiguing enough to dirty the technique in the session that follows, and `/members/activacion/` already owns pre-workout. **Dosing: twice a week, on easy running days or after an easy run, never before a quality session.**

**Deliberately not included, because another tool owns it — pointers, not copies:**

- Calf, foot and ankle work. That is the runner's actual spring, and it is `/members/aquiles/`.
- Loaded glute-medius and knee-tracking work (wall sits, Copenhagen, step-downs) — `/members/rodillas/`.
- A loaded suitcase carry, which is the best anti-lateral-flexion transfer a runner can do, ruled out by the bodyweight-only call rather than on merit. *Worth revisiting if bodyweight-only is ever relaxed.*

## Translation note

**EN and PT shipped the same day as ES**, which is the first time a strength-engine tool has not spent time in an ES-only state. *The three pages are structurally identical* — same 12 library keys, same `WARMUP`/`CIRCUIT`/`COOL` lists, same rest values (15s inside a round, 75s on the last exercise), same build function; only strings differ, and that parity was checked by script rather than by eye. **A change to the routine design goes into all three in one pass.** UI chrome was already three-language in `site/_data/strengthUi.json`.

## Open

- **Nobody has run it.** Six variants (2 round-counts × 3 languages) built and compiling; none walked end to end in a browser and none done by a person. Same standing gap as every other tool.
- **It is longer than the cyclist routine — ~30 min at 3 rounds vs ~25.** The rep counts came from the source doc and were not trimmed. If it feels long on a floor, the first numbers to move are the side plank and the lunge, not the number of exercises.
- **The upper-back gap above.** Iván's call; do not re-add without asking.
