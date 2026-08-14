# Aquiles Sin Dolor — Achilles tendinopathy artifact

**Status: v1 SHIPPED in Spanish, August 13, 2026** — `/members/aquiles/`. Second artifact on the strength engine (`strength-tool.js`; that engine's home doc is `knee-strength-brief.md`).

**Last updated:** August 13, 2026.

## What it is

**Four questions → one of 8 routines, plus one gated block.**

| Axis | Options |
|---|---|
| Where it hurts | mid-portion / insertional |
| Where you train | home (Alfredson) / gym (HSR) |
| Foam roller | yes / no |
| Strength already pain-free | no / yes → adds the jump block |

Source: Iván's Achilles doc, not committed — this file is the home.

## The insertional axis is the whole point of this tool

***This is the one place a source doc could have made an athlete worse, and it is why this is not a copy of the knee tool.***

Achilles tendinopathy is two conditions. **Mid-portion** sits 2–6 cm above the heel; heel drops off a step are exactly right. **Insertional** sits at the calcaneal attachment — and there, **dorsiflexion past neutral compresses the tendon against the bone**. A heel drop off a step does that at the bottom of every rep, and the straight-leg wall stretch does it for two minutes a side. The source doc prescribed both, undifferentiated: an athlete with insertional pain would have done ~45 compressive reps per session and concluded rehab doesn't work for them.

**What insertional gets instead, enforced in the data rather than in a footnote:**

- Isometrics on **flat ground**, not the step edge.
- Eccentric heel drops on **flat ground, stopping when the heel reaches the floor**.
- Gym machines with **range capped at the platform line** — no heel dropping below.
- **No end-range calf stretch at all.** The two wall stretches are replaced by non-end-range ankle mobility, with a cue that says explicitly why the stretch everyone expects is absent.

*The setup question is phrased so an athlete can actually answer it: press with two fingers and find where it jumps.* **There is a `layout-check`-style assertion for this** — the verification run fails if an insertional routine contains any step work or any wall stretch, and if a mid-portion routine loses them. That assertion matters more than any layout check on the page.

## Other decisions

**Frequency — Iván chose "both, with a note".** Home is framed as the classic eccentric protocol (daily, ideally twice daily, ~12 weeks); gym as heavy slow resistance (3×/week, ~12 weeks). The setup hint says plainly that the trials tie them and HSR is abandoned less often. The dosing text is per-place, not global.

**The jump block is gated, and placed BEFORE the heavy work.** Energy-storage work belongs on fresh legs; doing plyometrics at the end of a 30-set session is how a tendon that was ready gets re-irritated on the last set. The gate defaults to "not yet" and its hint says where reinjury actually happens — going from heavy calf raises straight back to intervals.

**Three additions Iván chose:** tibialis anterior raises, short-foot/arch work, and hip work (side-lying abduction + single-leg bridge). All in every routine.

**The traffic-light rules** from the source doc are the tool's warning box: 1–3/10 during, stop above 4 or if gait changes, and the **next-morning test** as the real arbiter. The "cheat shift" observation is in there too — as fatigue arrives the athlete quietly loads the good leg to get up.

**Red flags, added.** A sudden snap with inability to push off or rise onto the toes is a same-day emergency, not tendinopathy — that is first, above everything. Then the clearance gate the source doc already believed in, plus swelling/heat/redness and recent fluoroquinolone antibiotics, which are a known tendon-rupture risk factor and are rarely mentioned anywhere an athlete would see them.

## Open

- **Not translated.** EN and PT next, page copy only — the engine chrome is already three-language.
- **Nobody has run it.** 16 combinations verified structurally and clinically, 4 walked end to end to the done screen. None verified by a person doing the work.
- **Length.** The longest routine is 40 sets (gym, insertional, with jumps). *That is a lot for a rehab session done three times a week, and it is the first thing to check on a real run-through.* Same open question as the knee tool.
- **"Can I keep running?"** is the question every athlete with Achilles pain asks first, and the tool is silent on it. Usually the answer is yes with the same traffic-light rules applied to the run. Worth a line, needs Iván's call.
