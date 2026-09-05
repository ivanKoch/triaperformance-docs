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
- `site/assets/js/activation-tool.js` — the engine. Reads `window.ACTIVATION_DATA`. Handles tabs, work/rest cycle, unilateral = full duration per side, prev/skip/pause, variant swap ("Cambiar ejercicio"), position-change callouts between phases, beeps + vibration, done stats, repeat.
- `site/assets/css/members-activacion.css` — all styling, including the dark nav/footer overrides.

A new routine tool is then just: `site/members/<tool>/index.njk` = front matter + inline `window.ACTIVATION_DATA = {...}` (inside `{% raw %}`) + `{% include "partials/activation-tool.njk" %}`. The data model (documented at the top of the engine file) includes per-exercise `cue` (long coaching description), `tag` (equipment), `variants` (each with own mode/cue), and `video: null` — set a YouTube ID there and the Ejercicios tab renders the embed automatically, nothing else to build.

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
```

Then `npx eleventy --serve` and click through: tool works, nav/footer dark, card + filter chip on `/members/`, mobile width.

## Phase 4 — Deploy & close out (Iván)

1. `git add -A && git commit && git push` — VPS cron pull deploys (or trigger `deploy-website.sh` manually, see `deploy-runbook.md`).
2. Spot-check live behind a real login: `/members/<tool>/` loads, gate intact (open in a private window → login page).
3. Spot-check the workout link: open `https://triaperformance.com/w/<code>` in the same session and confirm it lands on the tool, then check the row arrived — `SELECT * FROM workout_link_clicks WHERE link_code = '<code>';` (`automation/members-area/OPERATIONS.md` §5).
4. Claude updates the docs same session: `ai-infrastructure-documentation.md` (dated note), `open-loops.md`, and this file's "Published artifacts" list below.

## Design rules recap

- Dark theme by default for interactive artifacts (`brand-guidelines.md` §7.1). TP Blue is fill-only on dark; blue text uses `--blue-bright`.
- Standard members nav + footer, restyled dark in page CSS.
- Voseo Spanish, no hype vocabulary, sentence case.
- Timer/exercise conventions (from Activación): unilateral = full duration per side; alternating = full duration total; circuits order floor → standing without going back down.

## Published artifacts

> ***Corrected August 14, 2026 — both tables below were thirteen days stale, in opposite directions, and this file's own Phase 4 step 3 is the step that was skipped.*** *The "Published artifacts" table listed **three** tools, all Spanish, when the members library is **eight tools in each of three languages** (24 pages); two of its three URLs no longer exist as described. The "In progress" table listed the zone calculator and the activation artifact as* **"not started"** *and* **"awaiting port"** *— both shipped, in three languages, on Aug 10–13.* ***What this was blocking:*** *`open-loops.md`'s tools-library item points at this table by name ("Detail: `artifact-publish-runbook.md` ("In progress" table)"), so the one list that was supposed to tell a session what is left to build was telling it to build two things that exist. Inventory of record is `triaperformance-business-overview.md` §Interactive tools; per-tool home docs are `activation-matrix.md`, `knee-strength-brief.md`, `achilles-brief.md`, `zones-calculator-brief.md`.* ***Verified from the filesystem, not from a doc:*** *`site/members/**` — eight ES entries, eight under `members/en/`, eight under `members/pt/`.*

| Tool | URL (ES / EN / PT) | Category | Shipped |
|---|---|---|---|
| ~~Activación de Running~~ → **Activation matrix** | `/members/activacion/` · `/members/en/activation/` · `/members/pt/ativacao/` | activacion | Aug 1, 2026 as a fixed 8-exercise routine; **replaced Aug 13, 2026 by the adaptive matrix at the same URL**, EN+PT same day |
| ~~Activación de Ciclismo~~ — `/members/activacion-ciclismo/` | — | activacion | ~~Aug 1, 2026~~ **DELETED Aug 13, 2026** on Iván's call, folded into the matrix. The URL does not resolve; do not cite it |
| Core Sin Excusas | `/members/core/` · `/members/en/core/` · `/members/pt/core/` | fuerza | Aug 1, 2026 (template v2); EN+PT Aug 12, chrome localised Aug 13 |
| Zones calculator | `/members/calculadora-de-zonas/` · `/members/en/training-zones-calculator/` · `/members/pt/calculadora-de-zonas/` | zonas | ES Aug 10, 2026; EN+PT Aug 13. `/members/zonas/` and `/members/tests/` retired into it |
| Training load | `/members/carga/` · `/members/en/training-load/` · `/members/pt/carga-de-treino/` | zonas | ES pre-existing; EN+PT Aug 2026 |
| Box breathing | `/members/respiracion/` · `/members/en/breathing/` · `/members/pt/respiracao/` | — | three languages |
| Knees (strength engine) | `/members/rodillas/` · `/members/en/knees/` · `/members/pt/joelhos/` | fuerza | Aug 13, 2026, all three |
| Achilles | `/members/aquiles/` · `/members/en/achilles/` · `/members/pt/aquiles/` | fuerza | Aug 13, 2026, all three |
| Strength guide | `/members/fuerza/` · `/members/en/strength/` · `/members/pt/forca/` | fuerza | ES Aug 2026; **EN+PT Sept 2, 2026**. *This table did not list the tool at all until that date — see the note below.* |
| Swimmer's shoulder (strength engine) | `/members/hombro/` · `/members/en/shoulder/` · `/members/pt/ombro/` | fuerza | Sept 3, 2026, all three. *This table did not list it either — added later the same day; see the note under the Published-artifacts table.* Home doc: `swimmer-shoulder-brief.md` |
| Mobility, post-exercise (activation engine) | `/members/movilidad/` · `/members/en/mobility/` · `/members/pt/mobilidade/` | activacion | ES Sept 3, **EN+PT Sept 4, 2026**. 15 routines, 5 sports × 10/20/30 min. EN/PT derived by `automation/mobility-i18n.py` (string literals only). Home doc: `mobility-brief.md` |
| Cyclist core (strength engine) | `/members/core-ciclista/` · `/members/en/cyclist-core/` · `/members/pt/core-do-ciclista/` | fuerza | Aug 18, 2026, all three. ***Row added Sept 4, 2026 — this is the FOURTH instance of the same omission*** (`strength` Sep 2, `hombro` Sep 3, and this one), and it is the oldest: the tool shipped seventeen days before anyone noticed this table did not contain it. Home doc: `cyclist-core-brief.md` |
| Runner core (strength engine) | `/members/core-corredor/` · `/members/en/runner-core/` · `/members/pt/core-do-corredor/` | fuerza | Sept 4, 2026, all three. *Row written in the same session the tool shipped — the first time that has happened — and updated the same session EN+PT landed.* Home doc: `runner-core-brief.md` |
| Recovery day, active (activation engine) | `/members/recuperacion/` — **ES only** | activacion | Sept 4, 2026. 15 routines, 5 sports × 30/45/60 min, three named blocks. Section B of the same source doc as `/members/movilidad/`. **EN/PT not built and not claimed.** Home doc: `recovery-brief.md` |
| Downloads / guides | `/members/guias/` · `/members/en/downloads/` · `/members/pt/downloads/` | guías | 5 PDFs ES / 1 EN / 1 PT |

> 🚨 ***Second correction, September 2, 2026, and it is the August 14 one recurring rather than a new kind.*** *That note above says this table was trusted because its purpose is to be trusted, and fixed it by re-deriving from the filesystem.* **It re-derived eight tools and the strength guide was already the ninth — `/members/fuerza/` shipped in August and appears in neither this table nor `triaperformance-business-overview.md` §Interactive tools, the file that note names as the inventory of record.** ***The cost was measurable: `site/_data/library.json` sold `strength` as a live gated tool on the English and Portuguese All-Access pages with no page behind it in either language, and neither inventory could contradict the claim because neither contained the tool.*** *Found by the Sept 2 hygiene pass, which diffed every `library.json` key against `site/members/` rather than the one key it was asked about. EN and PT built the same day.* **The check that would have caught it in August is now Step 0 of `kb-hygiene-prompt.md`.**

**Retired, deliberately, content not moved:** `/members/zonas/`, `/members/tests/`, `/members/carrera/`, `/members/kettlebell/`, `/members/nutricion/`, `/members/activacion-ciclismo/`. *(All Aug 13, 2026. Listed here because this runbook is where a future session looks for "which member URLs exist.")*

### In progress — prototypes not yet ported

*Added Aug 6, 2026. This table used to have a "Shipped" column and nothing else, so an artifact that was **built but not yet ported** had nowhere to be recorded. Prototypes live as Claude artifact share links, outside this repo — which means that unless they are written down here, they are invisible to `open-loops.md` and to every session that starts by reading it. One nearly-finished activation artifact went missing exactly this way. **Add a row the moment a prototype is approved, not when it ships.***

| Tool | Category | State | Notes |
|---|---|---|---|
| ~~*(activation artifact — Iván to identify)*~~ | activacion | ~~prototype ~complete, awaiting port~~ **SHIPPED Aug 13, 2026** | *Corrected Aug 14, 2026.* Identified as the **adaptive activation matrix** and shipped at `/members/activacion/` (ES), EN+PT the same day. Home doc: `activation-matrix.md`. |
| Calculadora de ritmos / pace converter | zonas | not started | Named in `growth-roadmap.md` §Tools library since the original plan. Three published articles' worth of intent behind it. |
| Calculadora de umbral / threshold | zonas | not started | Same source. Overlaps the zone calculator — decide whether they are one tool or two before building either. |
| Calculadora de carga de carbohidratos | nutricion | not started | Same source. `/members/nutricion/` exists as a guide and would be its natural home. |
| ~~Zone calculator at `/members/zonas/`~~ | zonas | ~~not started~~ **SHIPPED Aug 10–13, 2026** | *Corrected Aug 14, 2026 — this row read "not started" for four days after the tool was live in three languages.* Live at `/members/calculadora-de-zonas/` + EN/PT, plus four public URLs per language; `/members/zonas/` was retired into it. The three-article promise is discharged. Home doc: `zones-calculator-brief.md`. |
| ↑ *note on the carb calculator row* | ~~nutricion~~ | not started | *Added Aug 14, 2026: the row above says `/members/nutricion/` "exists as a guide and would be its natural home." **That page was deleted Aug 13, 2026.** The carb calculator needs a new home decided before it is built.* |

*Status corrected August 6, 2026 — all three rows read "pending deploy" for five days. Verified from git: commits `b05e3cc`, `0f8b0e8`, `d6c0a04` and `b41326e` all landed Aug 1 and went out on the normal cron pull, so the pages are deployed. **Deliberately not claimed as verified:** the real-phone check on template v2's mobile UI is Iván's, hasn't been reported back, and the whole reason v2 exists is that v1 rendered badly on a phone — a build that deploys is not a UI that works. That check is the one thing still outstanding on these three.*
