# Artifact → Members-Area Publish Runbook

**Last updated: August 14, 2026** (status audit — both artifact tables corrected; see the note above "Published artifacts"). *Previously "August 1, 2026", established with the first artifact through the pipeline: Activación de Running, `/members/activacion/`.*

The process for taking an interactive training artifact (Claude-built HTML tool — timer, calculator, tracker) from prototype to a live, gated, branded page in the members area. Exists so every artifact lands consistent with the site instead of repeating the kettlebell outlier (bespoke inline nav, own design language, mostly-unique CSS — flagged in `nav.json`'s `_membersNote`, ~~still unfixed~~ **resolved Aug 13, 2026 by deletion**: Iván retired `/members/kettlebell/` rather than porting it. *Corrected Aug 14, 2026 — the page this cautionary example points at no longer exists. The example stays because the lesson does.*).

## Phase 1 — Prototype

1. Claude builds a **single self-contained HTML file** (inline CSS + JS), already using the **dark artifact theme** from `brand-guidelines.md` §7.1 and Spanish voseo copy. Prototyping directly in brand style means Phase 2 is a port, not a redesign.
2. Iván opens it locally, uses it for real training, sends corrections (exercises, timings, behavior, copy).
3. Iterate until approved. Nothing touches the site repo before approval — except brand-guidelines.md, which gets extended first if the artifact introduces a design decision not yet covered (per that doc's own rule).

## Template: the 3-tab activation/routine tool (v2, August 1, 2026)

Timer-based routine tools don't start from scratch — there's a shared template, adapted from Iván's Claude-artifact prototypes (3 tabs: Inicio / Rutina / Ejercicios; ring timer; rest overlay; coaching-cue box; next-up preview; phone vibration) and re-skinned to brand (§7.1 tokens, Helvetica, single blue accent — no per-phase color rainbow, no serif, no emojis, voseo).

Three shared pieces, one data file per tool:

- `site/_includes/partials/activation-tool.njk` — the markup skeleton.
- `site/assets/js/activation-tool.js` — the engine. Reads `window.ACTIVATION_DATA`. Handles tabs, work/rest cycle, unilateral = full duration per side, prev/skip/pause, variant swap ("Cambiar ejercicio"), position-change callouts between phases, beeps + vibration, done stats, repeat, and the estimated time to completion on the home screen.
  ***Since September 8, 2026 every block opens PAUSED with its cue on screen*** *(`ai-infrastructure-documentation.md` §48.1)*. **A remembered auto-chain toggle** (`localStorage`, `tp.routine.autoChain`, default off) restores hands-free chaining; **manual mode has no rest phase at all**, by design. ⚠️ *Do not "fix" the paused start — it is the prerequisite for putting video on an exercise screen.*
- `site/assets/css/members-activacion.css` — all styling, including the dark nav/footer overrides.

A new routine tool is then just: `site/members/<tool>/index.njk` = front matter + inline `window.ACTIVATION_DATA = {...}` (inside `{% raw %}`) + `{% include "partials/activation-tool.njk" %}`. The data model (documented at the top of the engine file) includes per-exercise `cue` (long coaching description), `tag` (equipment), `variants` (each with own mode/cue), and `video: null` — set a YouTube ID there and the Ejercicios tab renders the embed automatically, nothing else to build.

🚨 ***NEVER write an asset path into page JavaScript.*** *(September 8, 2026, and it cost a whole shipped change.)* A setup-first tool injects its engine itself, from inside a `{% raw %}` block the `v` filter cannot reach — so **use `window.TP_ENGINE_SRC`, which both partials publish fingerprinted**, and never a literal `/assets/js/…` string. Caddy serves `/assets/js/*` and `/assets/css/*` with `Cache-Control: immutable, max-age=31536000`: **a bare URL is pinned in every visitor's browser for a year and cannot be busted short of renaming the file.** *This shipped on 24 pages and surfaced as new markup running old JavaScript on a live paid page. `tests/asset-fingerprints.test.js` now fails the build on it.*

**The second engine: `strength-tool.js` + `partials/strength-tool.njk` + `members-fuerza.css`** *(which imports `members-activacion.css` rather than copying it)*. Reads `window.STRENGTH_DATA`: sets × a `reps` **display string rendered verbatim and never parsed**, with a rest timer between sets and the athlete tapping "Serie hecha ✓". **Use it when the prescription is repetitions; use the activation engine when the prescription is a fixed duration per exercise.**
*Since September 8, 2026 it also takes `hold` / `holdMax` / `holdSides` for the exercises inside a strength routine whose prescription IS a duration — a countdown the athlete starts, which never completes the set. Ranges keep both numbers. `reps` is still never parsed at runtime; the fields are derived from it once at edit time.*

For non-routine tools (calculators etc.), fall through to the generic process below.

## Phase 2 — Port into the site

For an artifact named `<tool>` (e.g. `activacion`):

1. **`site/members/<tool>/index.njk`**
   - Front matter: `layout: layouts/base.njk`, `pageCss: "members-<tool>.css"`, `title: "<Name> — Triaperformance All-Access"`.
   - Everything else is inherited from `site/members/members.json`: `lang: es`, `noindex: true`, `navVariant: members-page`, `footerVariant: members`. **Do not override the nav/footer variants** — no bespoke navs.
   - Body: breadcrumb (`<a href="/members/#biblioteca">Biblioteca</a> / <Category>`), then the prototype's markup inside `<div class="wrap wrap--narrow">` (define `wrap--narrow` in the page CSS if the tool wants less than the 1080px default).
   - JS: inline `<script>` at the end, wrapped in `{% raw %}…{% endraw %}` so Nunjucks never parses it.
2. **`site/assets/css/members-<tool>.css`**
   - Self-contained: loads on top of `site.css` only. **Do not include `members.css`** in `pageCss` — that file styles the light content pages and will fight the dark theme.
   - Start from `members-activacion.css`: dark `:root` tokens (§7.1), the dark overrides for `.site-nav-sticky`/`.logo`/nav links/mobile slide-out/`footer`, then the tool's own component styles.
   - **Same tool type = same stylesheet.** A variant of an existing tool (e.g. the cycling activation reusing the running activation's exact component set) points its `pageCss` at the existing file instead of duplicating it. Only fork the CSS when the new tool actually has new components.
3. **`site/_data/library.json`** — the card, the sales copy and the members-home entry, all from one edit.
   *(Corrected September 5, 2026. This step used to say "add a `.card` to `site/members/index.njk` `#card-grid`" and "add a chip to `#filters`". Both were superseded on September 4, when `partials/members-library.njk` replaced the three hand-written card grids and the six filter chips became three category headings — the three home pages no longer contain a card grid to edit.)*
   - Add the entry to the `live` array of **every language the page actually exists in**, with `key`, `name`, `tag`, `desc`, `memberUrl`, `memberDesc`, `memberCta`, `category` and `gated`. A language whose page does not exist yet goes in `soon`, never in `live` — that rule is what the mis-selling checks enforce.
   - `categoryCounts` must be updated for the category you added to, or the group renders empty.

4. 🆕 **`site/_data/workoutLinks.json`** — the `/w/` code, so the tool can be linked from a TrainingPeaks workout.
   - At minimum one bare code: `{ "code": "<tool>", "tool": "<library key>", "slot": "genérico" }`. Add context variants (`-pre`, `-post`, `-run`, `-bike`, `-swim`, `-vo2`, `-umbral`, `-semana`) for the workout types the tool actually belongs in.
   - **The registry holds a library key, never a URL.** The destination is resolved per athlete from `library.json`, in that athlete's own language — which is why step 3 comes first and why there is no second inventory of paths to keep in sync.
   - ***This step is not optional and the build enforces it.*** `tests/workout-links.test.js` fails when a live gated tool has no code. **That assertion exists because the inventory-row step has been skipped three times in eleven days** — `cyclistcore` (Aug 24), `strength` (Sep 2), `hombro` (Sep 3) — *always found later by an audit, never at ship time.* **A check that runs on every build is the version of that step nobody has to remember.**
   - Once built, the copyable link appears on **`/admin/enlaces/`** (single-user basic_auth, same credential as `/admin/*`) as `https://triaperformance.com/w/<code>`, with a per-language coverage badge so a code that only resolves in Spanish is visible *before* it gets pasted into an English athlete's workout.

Free — do NOT rebuild per artifact: auth (Caddy `forward_auth` gates `/members/*` by wildcard), GA4 + Clarity + conversion tracker (`base.njk`), `noindex` + sitemap exclusion (`members.json`), hreflang (off while `noindex`), **per-athlete usage logging** (`/members/check` writes one `member_access_log` row per page load — the tool is measured per athlete from the moment it ships, with nothing to instrument).

## Phase 3 — Verify (before commit)

Run a build and check the real output, not the templates:

```bash
npm run build
grep -c 'gtag/js?id=\|clarity.ms/tag' _site/members/<tool>/index.html   # expect 2
grep -n 'noindex' _site/members/<tool>/index.html                        # expect the robots meta
grep -c '<tool>' _site/sitemap.xml                                       # expect 0
grep -c '{% raw' _site/members/<tool>/index.html                         # expect 0 (raw tags consumed)
node tests/workout-links.test.js                                         # every live tool has a /w/ code
node tests/routine-engines.test.js                                       # both routine engines, faked clock
node tests/asset-fingerprints.test.js                                    # no bare /assets/ URL can reach a visitor
```
*(`npm test` runs all of them, including the two above.)*

Then `npx eleventy --serve` and click through: tool works, nav/footer dark, card + filter chip on `/members/`, mobile width.

## Phase 4 — Deploy & close out (Iván)

1. `git add -A && git commit && git push` — VPS cron pull deploys (or trigger `deploy-website.sh` manually, see `deploy-runbook.md`).
2. Spot-check live behind a real login: `/members/<tool>/` loads, gate intact (open in a private window → login page).
3. Spot-check the workout link: open `https://triaperformance.com/w/<code>` in the same session and confirm it lands on the tool, then check the row arrived — `SELECT * FROM workout_link_clicks WHERE link_code = '<code>';` (`automation/members-area/OPERATIONS.md` §5).
4. Claude updates the docs same session: `ai-infrastructure-documentation.md` (dated note), `open-loops.md`, and this file's "Published artifacts" list below.

## Design rules recap

- Dark theme by default for interactive artifacts (`brand-guidelines.md` §7.1). TP Blue is fill-only on dark; blue text uses `--blue-bright`.
- Standard members nav + footer, restyled dark in page CSS.
- ~~Voseo Spanish~~, no hype vocabulary, sentence case. 🚨 ***Corrected September 8, 2026 — this line was wrong and was the kind of wrong that propagates: it instructs a future session to write copy that `automation/register-sweep.py` then flags.*** **Spanish is neutral LatAm tuteo** (`brand-guidelines.md` §8, enforced on both axes by the sweep). *Run `python3 automation/register-sweep.py` before shipping any Spanish copy.*
- Timer/exercise conventions (from Activación): unilateral = full duration per side; alternating = full duration total; circuits order floor → standing without going back down.
- **No clock ever starts without a tap, and no clock ever advances the athlete's own decision.** *(September 8, 2026, from athlete feedback — §48.)* A block starts when the athlete starts it; a hold timer counts a duration prescription but never marks the set done. **Every routine artifact states an estimated time to completion on its home screen.**

## Published artifacts

**The inventory of record is `site/_data/library.json`.** A tool is published when its entry there is `live`, and that file is what the sales pages and members homes render, so it cannot drift from what a subscriber sees. Phase 4 step 3 is therefore an edit to that file, not to a table here. *The hand-maintained table that used to sit here missed four tools in a row and was removed September 11, 2026.*

**Retired, deliberately, content not moved:** `/members/zonas/`, `/members/tests/`, `/members/carrera/`, `/members/kettlebell/`, `/members/nutricion/`, `/members/activacion-ciclismo/`. *(All Aug 13, 2026. Listed here because this runbook is where a future session looks for "which member URLs exist.")*

### In progress — prototypes not yet ported

*Added Aug 6, 2026. This table used to have a "Shipped" column and nothing else, so an artifact that was **built but not yet ported** had nowhere to be recorded. Prototypes live as Claude artifact share links, outside this repo — which means that unless they are written down here, they are invisible to `open-loops.md` and to every session that starts by reading it. One nearly-finished activation artifact went missing exactly this way. **Add a row the moment a prototype is approved, not when it ships.***

| Tool | Category | State | Notes |
|---|---|---|---|
| ~~*(activation artifact — Iván to identify)*~~ | activacion | ~~prototype ~complete, awaiting port~~ **SHIPPED Aug 13, 2026** | *Corrected Aug 14, 2026.* Identified as the **adaptive activation matrix** and shipped at `/members/activacion/` (ES), EN+PT the same day. Home doc: `activation-matrix.md`. |
| ~~Calculadora de ritmos / pace converter~~ | zonas | ~~not started~~ **SHIPPED September 8, 2026** | *Corrected September 8, 2026 (hygiene pass) — this row read "not started" while the Published-artifacts table **in this same file** recorded the tool as live in all three languages, public and members, on that same day.* **Fourth recurrence of the failure mode this table's own two notes describe**, and the first where both the stale claim and its refutation sat in one document. Live at `/conversor-de-ritmo/` + `/en/pace-converter/` + `/pt/conversor-de-ritmo/` plus the three members copies; closing note in `open-loops-archive.md`, Sept 8. |
| Calculadora de umbral / threshold | zonas | not started | Same source. Overlaps the zone calculator — decide whether they are one tool or two before building either. |
| Calculadora de carga de carbohidratos | nutricion | not started | Same source. `/members/nutricion/` exists as a guide and would be its natural home. |
| ~~Zone calculator at `/members/zonas/`~~ | zonas | ~~not started~~ **SHIPPED Aug 10–13, 2026** | *Corrected Aug 14, 2026 — this row read "not started" for four days after the tool was live in three languages.* Live at `/members/calculadora-de-zonas/` + EN/PT, plus four public URLs per language; `/members/zonas/` was retired into it. The three-article promise is discharged. Home doc: `zones-calculator-brief.md`. |
| ↑ *note on the carb calculator row* | ~~nutricion~~ | not started | *Added Aug 14, 2026: the row above says `/members/nutricion/` "exists as a guide and would be its natural home." **That page was deleted Aug 13, 2026.** The carb calculator needs a new home decided before it is built.* |

*Status corrected August 6, 2026 — all three rows read "pending deploy" for five days. Verified from git: commits `b05e3cc`, `0f8b0e8`, `d6c0a04` and `b41326e` all landed Aug 1 and went out on the normal cron pull, so the pages are deployed. **Deliberately not claimed as verified:** the real-phone check on template v2's mobile UI is Iván's, hasn't been reported back, and the whole reason v2 exists is that v1 rendered badly on a phone — a build that deploys is not a UI that works. That check is the one thing still outstanding on these three.*
