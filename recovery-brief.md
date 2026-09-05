# Recovery Brief — the recovery-day matrix

**Home doc for `/members/recuperacion/`.** Owns the design, the dosing, the six decisions taken before building and the clinical reversals. Owns no figures.

**Status: v1 SHIPPED in all three languages.** Spanish September 4, 2026; **English and Portuguese September 5, 2026** — `/members/recuperacion/`, `/members/en/recovery/`, `/members/pt/recuperacao/`. All three `library.json` blocks, all three members homes and all three All-Access pages carry it.

✅ ***Iván ran all three tools on a phone on September 5 and confirmed them.*** *That gate, open since the mobility tool shipped, is closed.*

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

## 5. English and Portuguese (September 5, 2026)

`/members/en/recovery/` and `/members/pt/recuperacao/`, derived by **`automation/recovery-i18n.py`**.

**One mechanical improvement over `mobility-i18n.py`, and it is the reusable part.** That script matched Spanish source strings literally. This page has **50 name/cue pairs**, several of them long — 50 chances to mistype a source key, and a mistyped key is a mapping that silently never fires. So names and cues are translated **by position**, and the script asserts that the name it finds at position *i* is the name it expects at position *i*. ***A drift in the Spanish page is now a hard failure naming the exact position, rather than a no-op.*** Everything else is still literal substitution with a completeness sweep.

### 🚨 The guards caught a real defect, and it is the instructive kind

The first run failed with **five mappings that never matched**. One was a stray entry copied from the mobility script for text that does not exist on this page. **The other four had a single cause: I had mapped `" o "` and `" u "` as generic connectors** for the pain hand-off and applied them globally — which also rewrote *"bastón **o** un escalón"*, *"Bastón **o** palo"*, *"un día fácil **o** de descanso"* and *"gimnasio **o** para uno"*.

***One shortcut, four corrupted strings, and every one of them was in copy a reader would see.*** The pain hand-off is now four complete literals carrying their own URLs and link text, which cannot do this. **The lesson is not "be careful with regexes" — it is that a substitution key shorter than a phrase will find matches you did not intend, and the completeness sweep is what turns that from a silent corruption into a failed run.**

A second run then caught the three Spanish JS section comments, which now get replaced whole and **before** the copy pass — otherwise a generic key like `" minutos"` reaches inside one and half-rewrites it. It had already produced *"doce minutes"*.

### Verification

**824 data checks** (up from 651) and **153 rendered checks** (up from 51). The additions are cross-language: the three id tables byte-identical; every routine's shape identical; a **pinned fingerprint** of the Spanish structure (`d30ef88e06a3`); each page routing only to its own language, with no Spanish tool URL surviving; and ***the clinical assertions run separately in each language*** — no dislocates, no Jefferson curls, the stick cap intact, the roll-down still segmental, the balance still capped with its safety note, the step variant still deferring to the Achilles protocol, and **decision 4 surviving in both places it appears** (subtitle and finish screen).

**And the overlap rebalance is re-measured per language**, against *that language's* activation matrix — because the names are translated, so the Spanish measurement proves nothing about the English page. All three stay at 13–25%.

## 6. Open

Tracked in `open-loops.md`.

- ⚠️ **The members tool pages are still voseo while the sales surface and `library.json` moved to tuteo.** Not introduced here — this page follows its siblings — but a subscriber reads *"Elige de qué vienes"* on the members home and *"Elegí de qué venís"* one click later. **One scripted pass over the tool pages, and the register is Iván's to confirm.**
