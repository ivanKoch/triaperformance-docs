# Rodillas Sin Dolor — knee strength artifact

**Status: v1 SHIPPED in all three languages, August 13, 2026 **· verified: 2026-08-14**** — `/members/rodillas/`, `/members/en/knees/`, `/members/pt/joelhos/`. **Home doc for this tool and for the strength engine it introduced.**

**Last updated:** September 8, 2026 — *hold timer and time-to-completion, from athlete feedback. See §Athlete feedback below.*

## What it is

Two questions — where (home / gym) × foam roller (yes / no) — build one of **4 routines**. Warm-up and mobility are shared by all four; only the strength block and the foam-rolling block change. Source: Iván's `knee pain artifact.md`, not committed (this doc is the home; a second Markdown copy is drift waiting to happen).

**The premise, which is the reason the tool exists:** runner's knee and IT band pain are almost never a knee problem. A weak glute medius lets the pelvis drop at each footfall, the knee collapses inward, and the patellar tendon and IT band pay for it. So the routine trains glute medius (pelvic stability), VMO (kneecap tracking) and posterior chain (offsetting quad dominance).

## The new engine: `strength-tool.js`

**The first artifact not built on the activation engine, deliberately.** That engine counts 40 seconds down and moves on — right for a mobility circuit, wrong for strength: *a countdown tells someone to keep going when the prescription is eight good reps.* Here the athlete finishes the set and taps; the only thing on a clock is the rest between sets.

- `reps` is a **display string** rendered verbatim (`"8-12 por pierna"`, `"45s"`), never parsed. The prescription is the coach's words, not a number the tool derives. ***Still true after September 8, 2026 — the hold timer added that day does not parse it either.*** *`hold` / `holdMax` / `holdSides` are separate fields, derived from the `reps` string once by `automation/` script logic and written into the data; the engine reads the fields and renders the string, and the two never meet at runtime.*
- `hold` (seconds), `holdMax` (the top of a range), `holdSides` (1 or 2) — **the prescription is a duration.** Adds a countdown the athlete starts. It does not start itself and it does not complete the set. Added September 8, 2026.
- `rest` in seconds, per exercise; absent means straight to the next set.
- Shares the 3-tab shell, the setup pattern and `members-activacion.css` (imported by `members-fuerza.css`, not copied — two dark themes become two slightly different dark themes).
- **Chrome is multilingual from day one** (`site/_data/strengthUi.json`, es/en/pt) even though only Spanish shipped. Written that way *because* the activation engine was Spanish-only and shipped EN and PT pages with Spanish buttons around translated content. Three objects now is cheaper than retrofitting an engine later.

***Bug found by walking a full routine end to end:*** `finish()` advances the index past the last exercise and then calls `updateUI()`, which had an `if (!e) return` guard at the top — so the done overlay never rendered. **The routine completed internally while the screen froze on the last set, with the button dead because the phase was already "done".** Fixed by rendering everything phase-dependent before the guard. *No check that stops short of the final set could have seen this, and the tool looks perfect for 28 of 29 sets.*

## Content decisions

**Three additions to Iván's source doc, chosen by him:**

1. **Isometric wall sit, 3 × 45s** — placed first in both strength blocks. The one exercise here that helps an athlete who hurts *today* rather than in six weeks; isometric knee-extension holds have a well-documented analgesic effect. Its cue says so explicitly: if the knee is sore, do this first and the rest of the routine will hurt less.
2. **Single-leg balance, 30s per side** — in the warm-up. Cue ties it to the mechanism: don't let the free-side hip drop, because that drop is exactly what happens to the pelvis at every footfall.
3. **Gym adductor work** — Copenhagen planks covered adductors at home with no gym equivalent. Cable/machine adduction is now the pair to the cable abduction.

**Two more were offered and NOT taken. The omission is a decision, not an oversight — do not re-add without asking:**

- Eccentric calf / soleus work in the strength block (the source doc treats calves as a foam-rolling target only).
- Knee-flexion hamstring work — the doc says hamstrings balance quad dominance but prescribes only RDLs, which are hip-dominant. Nothing trains the hamstring as a knee flexor.

**Dosing, Iván's numbers:** twice a week, on easy endurance days, never the day before quality or a long session.

**Pain rule, added:** discomfort up to 3/10 during the exercises is acceptable and it must be the same or better the next day; past that, reduce range or load. Standard rehab loading guidance, and the thing that stops "no pain" being read as "stop at any sensation".

**Red-flag boundary, added and not in the source doc.** A tool called *Rodillas sin dolor* handed to someone whose knee hurts needs to say where it stops: swelling, locking, giving way, night pain, or pain that started after an impact or a twist means see a professional, not do this routine. It is the only warm-coloured element in the members area, on purpose — it is the one place a tool says "this might not be for you" and it must not read as another instruction card.

## Athlete feedback, September 8, 2026 — the two changes this tool got

*Reported by a real user of the artifact, relayed by Iván. Both were real; neither was a bug in the sense of something breaking.*

**1. The 45-second isometric had no timer.** The wall sit is *the* exercise on this page that helps an athlete who hurts today, and its whole value is the dose — and the tool printed "45s" and left the athlete to count it. 🔑 ***The engine's founding principle was right and was applied one step too widely:*** "a countdown tells someone to keep going when the prescription is eight good reps" is true of reps and false of a hold, and the original built one rule for both. **The fix keeps the principle intact:** the hold timer is started by the athlete, and finishing it does *not* complete the set — the athlete still taps "Serie hecha". *The clock informs the decision; it never takes it.*

**Ranges get both numbers, and this is the part not to collapse later.** `"20-30s por lado"` on the Copenhagen plank is `hold: 20, holdMax: 30`: the clock counts down from **30** and marks **20** with its own softer beep and a colour change. Stopping after the minimum counts the side; stopping before it re-arms the same side. ⚠️ *Picking one figure to simplify this would break the prescription in one of two directions — the floor stops people short of a dose they were asked for, the ceiling turns a permission into an obligation.* **Iván wrote a range; the tool now says a range.**

**2. Estimated time to completion**, on the home screen next to the set count. Timed work and rest are exact; a rep-based set is assumed at **40 seconds**, stated in the engine and prefixed `≈`.

🚨 ***An unlooked-for finding, and it belongs to Iván, not to the tool: the home + roller routine estimates at ≈52 minutes.*** *That is 29 sets across warm-up, strength and foam rolling, and the dosing above is* **twice a week on easy endurance days**. *Nothing about the estimate is wrong — the routine really is that long, and the figure just made it visible for the first time.* **Worth deciding whether that is the session he intends to prescribe** (the gym variants and the Achilles tool land at ≈45 min on the same basis). *Not changed here: the length is a coaching decision, not an engine one.*

## Open

- **Iván has not run it yet.** *(Still true September 8, 2026 — and now with a second thing to feel: whether the hold timer's beeps land where a hold actually ends.)* Twelve routines (4 × 3 languages) walked end to end in a browser, tapping through every set to the done screen; none verified by a human doing the reps. **This is the only thing standing between v1 and "finished".**
- **The two omitted exercises** (eccentric soleus, knee-flexion hamstring) — revisit only if Iván raises them.
- **The red-flag box ends with "Escríbeme y lo vemos"** / "Write to me and we'll sort it out" / "Me escreva e a gente vê". *That is a promise of a reply, in three languages, from a page that any subscriber can reach.* Fine at 2 subscribers; worth re-reading if that number moves.

## Translation note

EN and PT shipped the same day. **The three pages are structurally identical** — same library keys, same four routine lists, same build function; only strings differ. A change to the routine design goes into all three in one pass. UI chrome was already three-language (`strengthUi.json`), so this was page copy only, which is exactly what building the engine multilingual on day one bought.
