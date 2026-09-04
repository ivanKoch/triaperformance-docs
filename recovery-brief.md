# Recovery Brief — the recovery-day matrix

**Home doc for `/members/recuperacion/`.** Owns the design, the dosing, the six decisions taken before building and the clinical reversals. Owns no figures.

**Status: v1 SHIPPED in Spanish, September 4, 2026.** EN and PT are not built and are deliberately not claimed anywhere — `library.json` carries the entry in `es` only.

**Source:** Iván's *"Sistema Maestro de Movilidad"*, section **B** of each sport (Día Cualquiera / Recuperación Activa). Section A is `/members/movilidad/`, owned by `mobility-brief.md`. **The two tools are siblings and the differences between them are deliberate — §5 lists the ones a future pass is most likely to "harmonise" away.**

---

## 1. What it is

Two questions → one of 15 routines. Sport (correr, bici, nadar, triatlón, todo el cuerpo) × duration (30, 45, 60). Fourth tool on the activation engine, unchanged, via the same `matrixMode` pattern.

**Three named blocks, and the tiers grow the blocks rather than appending new ones.** That is the structural difference from `/members/movilidad/`, and it is decision 4 made visible: there the tiers were the story, here the **blocks** are, because the athlete has to be able to see that a third of this session is activation work.

| Block | What it is |
|---|---|
| **Movilidad** | CARs, flows, controlled range |
| **Activación** | strength and control work — named honestly, not hidden inside a mobility routine |
| **Posturas largas** | passive holds, PNF, the close |

30 = BASE, 45 = BASE + EXT, 60 = BASE + EXT + DEEP, merged per block. Three tables per sport, not fifteen written routines.

---

## 2. The six decisions, all Iván's

**1. The 30-minute cores were rebalanced.** Section B's cores were **six of nine exercises the library already had**, in every sport, spread across `/members/core/` and `/members/activacion/`. Section A worked because posterior chain, anterior hip and shoulder decompression are different jobs; section B converged on general mobility flow — which the activation matrix already does in twelve minutes.

***So the cores now lead with what only this tool can do:*** slow CARs, flows, long passive holds, PNF and balance. The shared movements are connective tissue, not the opening.

**This is measured, not asserted** — see §4. A future pass that "simplifies" the cores back toward the activation matrix fails a check rather than passing review.

**2. No shoulder dislocates.** Third attempt: the source has them in the cyclist, swimmer **and** triathlete routines. `activation-matrix.md` says in bold *"Do not restore dislocates"* — competitive swimmers are typically **lax** at the anterior capsule, not stiff, and end-range external rotation plus extension on a long lever is the same class of error as the sleeper stretch. **One shared library means the cyclist version cannot be uncapped either.** What ships is `wallAngel` (mat and wall) with a **capped stick pass-through as its variant**, whose cue carries the cap: *stop where the ribs flare, the lower back arches, or the shoulders rise.*

**3. Mat and wall base, everything else as variants** — identical to `/members/movilidad/`, and now also a consistency argument: an athlete who learned the **Cambiar ejercicio** button there looks for it here. Band, roller, stick and step are all preserved as variants. **Two casualties:** the kettlebell **halo** (no mat-only equivalent, and its goal is already covered) and the **step** for eccentric calf raises, which became floor eccentrics with the step as a variant.

**4. The strength and activation content stays, and the blocks say so.** Roughly a third of section B is clamshells, bird-dogs, side planks, banded walks, dead bugs, bear crawls, scapular push-ups and Y-T-W-L. That is activation and strength work, not mobility. It is what makes a recovery day worth doing, so it stays — but the block is **named `Activación`**, and the copy says plainly, on the setup screen, in every subtitle and on the finish screen: ***this is an easy session, not a rest day.*** `methodology.md` §7 has real placement rules. A check asserts the activation block is **15–45% of every routine**, so the claim stays true.

**5. No Jefferson curls.** Unloaded helps, but it is segmental spinal flexion under a long lever, unsupervised, for a population with a lot of low-back history — the highest-risk item in section B after dislocates. Replaced by `rollDown`, a **supine segmental roll-down**: same job, bodyweight, lying down, and consistent with the roll-ups the source already had.

**6. It is called Recuperación Activa**, which is what the source calls it. Not "movilidad" — see decision 4.

**Also trimmed:** eyes-closed single-leg balance was **2 minutes** in the source. People fall. 40s per side, with a cue telling them to have a wall or chair in reach.

---

## 3. ⚠️ Two places this tool deliberately disagrees with `/members/movilidad/`

**Do not "harmonise" these. The disagreement is the point.**

- **Frog pose and winged dragon are HERE and were cut from the post-workout tool.** Long passive Yin holds belong on fresh tissue, not on tissue that was eccentrically loaded an hour ago. Both tools are right. The frog cue says so in the text — *"solo en un día sin sesión"* — and a check asserts that sentence survives.
- **The 60-minute tier here is real content** — sun salutations, Yin, thoracic CARs. Section A's 60 tier was largely lying still, which is why that tool's third tier adds coverage rather than range.

---

## 4. Verification

**651 data checks** (`tests/recovery-matrix.js`) and **51 rendered checks** (`tests/recovery-layout.js`), both against the built page.

### The rebalance is measured

The interesting one. §7 of the data tests reads the **activation matrix's own library out of its built page** and counts the overlap:

| sport | 30-min core shared with activation | |
|---|---|---|
| correr | 2/15 | 13% |
| bici | 2/14 | 14% |
| nadar | 4/16 | 25% |
| triatlón | 2/15 | 13% |
| todo el cuerpo | 3/15 | 20% |

**Against ~67% in the source doc.** The check fails above 34%, and a second check asserts **the first three exercises of the mobility block are always ones this tool alone has** — because decision 1 is about what the athlete sees first, not just about totals. *That check caught `bici` opening on thread-the-needle and forced a reorder.*

### Durations

| sport | 30 | 45 | 60 |
|---|---|---|---|
| correr | 30.7 | 45.2 | 60.5 |
| bici | 29.7 | 44.8 | 59.7 |
| nadar | 29.2 | 45.3 | 61.3 |
| triatlón | 30.5 | 45.0 | 60.0 |
| todo el cuerpo | 30.7 | 46.3 | 61.4 |

Tighter than the post-workout tool's, because the longer holds absorb rounding. *The swim core first built at **24.7** — the thinnest of the five, and thin in the same place the post-workout tool had to be corrected: no legs. `deepSquatHold` and `carsHip` moved into the core.*

### Also asserted

All 15 build; unknown sport and unknown duration throw (10 and 20 minutes belong to `/members/movilidad/` and must not silently produce a routine); no duplicated exercise; every exercise has a real cue and an explicit hold; **the three blocks in order, none empty**; additive containment **per block**; mat-and-wall-only across all 15; all five variant tags preserved; the clinical reversals of §2; the two deliberate disagreements of §3; the step-eccentric variant deferring to the Achilles protocol's dosing; and the pain hand-off ending at a doctor for every sport.

Rendered: 390/768/1440, no sideways scroll, the five sport buttons wrapping 3 + 2 with real tap targets, the load warning, the routing to the other two tools, the sport-aware pain aside, and a full walk to the done overlay on `tri|60`.

---

## 5. Open

Tracked in `open-loops.md`.

- **EN and PT are not built**, and nothing claims they are.
- ⚠️ **The members tool pages are still voseo while the sales surface and `library.json` moved to tuteo.** Not introduced here — this page follows its two siblings — but it means a subscriber reads *"Elige de qué vienes"* on the members home and *"Elegí de qué venís"* one click later. **The fix is one scripted pass over the tool pages, not a per-page decision, and it is Iván's call.**
- ⚠️ **Iván has still not run any of these three tools on a phone.**
