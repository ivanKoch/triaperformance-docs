# Rodillas Sin Dolor — knee strength artifact

**Status: v1 SHIPPED in Spanish, August 13, 2026** — `/members/rodillas/`. **Home doc for this tool and for the strength engine it introduced.**

**Last updated:** August 13, 2026.

## What it is

Two questions — where (home / gym) × foam roller (yes / no) — build one of **4 routines**. Warm-up and mobility are shared by all four; only the strength block and the foam-rolling block change. Source: Iván's `knee pain artifact.md`, not committed (this doc is the home; a second Markdown copy is drift waiting to happen).

**The premise, which is the reason the tool exists:** runner's knee and IT band pain are almost never a knee problem. A weak glute medius lets the pelvis drop at each footfall, the knee collapses inward, and the patellar tendon and IT band pay for it. So the routine trains glute medius (pelvic stability), VMO (kneecap tracking) and posterior chain (offsetting quad dominance).

## The new engine: `strength-tool.js`

**The first artifact not built on the activation engine, deliberately.** That engine counts 40 seconds down and moves on — right for a mobility circuit, wrong for strength: *a countdown tells someone to keep going when the prescription is eight good reps.* Here the athlete finishes the set and taps; the only thing on a clock is the rest between sets.

- `reps` is a **display string** rendered verbatim (`"8-12 por pierna"`, `"45s"`), never parsed. The prescription is the coach's words, not a number the tool derives.
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

## Open

- **Not translated.** EN and PT next, same sequence as the activation matrix. The engine chrome is already done; only the page copy needs writing.
- **Iván has not run it yet.** Four routines verified end to end in a browser; none verified by a human doing the reps.
