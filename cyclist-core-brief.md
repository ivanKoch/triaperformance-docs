# Core de Ciclista — cyclist core artifact

**Status: v1 SHIPPED in all three languages, August 18, 2026** — `/members/core-ciclista/`, `/members/en/cyclist-core/`, `/members/pt/core-do-ciclista/`. Third artifact on the strength engine (`strength-tool.js`; engine home doc: `knee-strength-brief.md`).

## What it is

One question — 3 or 4 rounds — then warm-up → circuit × N → cool-down. Bodyweight throughout, on Iván's call. Source: his `Deep core for cyclists.md`, not committed; this file is the home.

**Premise:** a cyclist's core does not create movement, it prevents it. Every watt lost to a rocking pelvis or a rotating trunk never reaches the pedal. So the whole circuit is *anti* work — anti-rotation, anti-extension, anti-lateral-flexion.

| Circuit | Plane |
|---|---|
| Dead bug | Anti-extension |
| Bear plank shoulder taps | Anti-rotation |
| Side plank + leg raise | Anti-lateral-flexion |
| Single-leg glute bridge | Posterior chain |
| Plank cross-body reach | Anti-rotation |
| Long-lever plank | Anti-extension |

## Rounds are phases — no engine change

`strength-tool.js` walks phases in order and prints the phase name in the header, so each round is rendered as its own phase ("Vuelta 2 de 3" / "Round 2 of 3" / "Volta 2 de 3"). ***Teaching the engine a separate "rounds" concept would have been a second idea doing the job of one it already had.*** Rest rides on the exercises: 15s between exercises inside a round (the engine rests after an exercise's last set), 75s on the last exercise of each round.

## Changes from the source doc

**Three Iván picked:**

1. **Thoracic rotation added** (thread the needle, warm-up). Cat-cow only brushes it, and thoracic extension and rotation are what a cyclist actually loses after hours on the bars.
2. **Plank shoulder taps → bear plank shoulder taps.** Knees hovering under the hips puts the anti-rotation demand at roughly the hip angle held on the bike, instead of at full hip extension.
3. **Hollow body hold → long-lever plank.** *The reasoning is worth keeping:* hollow is loaded trunk flexion with active hip flexors — the exact posture a cyclist already lives in. Their problem is usually short hip flexors and a thorax stuck in flexion, and hollow rehearses both. The long-lever plank delivers the same anti-extension isometric without training the fault.

**One forced by the bodyweight-only call:** the plank pull-through needed a weight to drag, so it became a **cross-body plank reach**. The cue deliberately names what it preserves — lat-against-opposite-glute tension, i.e. pulling the bar while pushing the far pedal — because that rationale was the strongest thing in the source doc and shouldn't be lost with the kettlebell.

**Offered and NOT taken: a 360° / 90-90 breathing and bracing entry.** *That is the deep-core connection work, and without it this is a cycling-specific core routine rather than a deep-core one — the name does slightly more work than the content.* Iván's decision, Aug 18, 2026. **Do not re-add without asking.**

**Added, not in the source:** a technique rule in the dosing box. Failure in these exercises is not fatigue, it is the hip beginning to move; when that happens the set ends, reps remaining or not. A rep with the pelvis rocking trains the opposite of the point.

**Dosing:** twice a week, easy endurance days or after a ride, never before a quality session.

## Open

- **Nobody has run it.** Six variants (2 round-counts × 3 languages) walked end to end in a browser to the done screen; none verified by a person doing the work. Same standing gap as every other tool.
- **The 15-second transitions are untested on a floor.** Six exercises at 15s is tight, and it is the first number to move if it feels rushed. One line in the data.
