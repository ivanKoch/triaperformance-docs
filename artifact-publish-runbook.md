# Artifact → Members-Area Publish Runbook

**Last updated: August 1, 2026** (established with the first artifact through the pipeline: Activación de Running, `/members/activacion/`).

The process for taking an interactive training artifact (Claude-built HTML tool — timer, calculator, tracker) from prototype to a live, gated, branded page in the members area. Exists so every artifact lands consistent with the site instead of repeating the kettlebell outlier (bespoke inline nav, own design language, mostly-unique CSS — flagged in `nav.json`'s `_membersNote`, still unfixed).

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
3. **Card on the members home** — `site/members/index.njk`, `#card-grid`:
   - Add a `.card` with `data-category="<category>"`, a `.tag` (Guía / Rutina / Calculadora / Playbook), an `<h3>`, one-sentence description, `card-link` to `/members/<tool>/`.
   - If it's a new category, add a chip to `#filters` (`data-filter` must match `data-category`). Reuse an existing category when honest.

Free — do NOT rebuild per artifact: auth (Caddy `forward_auth` gates `/members/*` by wildcard), GA4 + Clarity + conversion tracker (`base.njk`), `noindex` + sitemap exclusion (`members.json`), hreflang (off while `noindex`).

## Phase 3 — Verify (before commit)

Run a build and check the real output, not the templates:

```bash
npm run build
grep -c 'gtag/js?id=\|clarity.ms/tag' _site/members/<tool>/index.html   # expect 2
grep -n 'noindex' _site/members/<tool>/index.html                        # expect the robots meta
grep -c '<tool>' _site/sitemap.xml                                       # expect 0
grep -c '{% raw' _site/members/<tool>/index.html                         # expect 0 (raw tags consumed)
```

Then `npx eleventy --serve` and click through: tool works, nav/footer dark, card + filter chip on `/members/`, mobile width.

## Phase 4 — Deploy & close out (Iván)

1. `git add -A && git commit && git push` — VPS cron pull deploys (or trigger `deploy-website.sh` manually, see `deploy-runbook.md`).
2. Spot-check live behind a real login: `/members/<tool>/` loads, gate intact (open in a private window → login page).
3. Claude updates the docs same session: `ai-infrastructure-documentation.md` (dated note), `open-loops.md`, and this file's "Published artifacts" list below.

## Design rules recap

- Dark theme by default for interactive artifacts (`brand-guidelines.md` §7.1). TP Blue is fill-only on dark; blue text uses `--blue-bright`.
- Standard members nav + footer, restyled dark in page CSS.
- Voseo Spanish, no hype vocabulary, sentence case.
- Timer/exercise conventions (from Activación): unilateral = full duration per side; alternating = full duration total; circuits order floor → standing without going back down.

## Published artifacts

| Tool | URL | Category | Shipped |
|---|---|---|---|
| Activación de Running | `/members/activacion/` | activacion | Aug 1, 2026 — live; rebuilt same day on template v2 (pending redeploy) |
| Activación de Ciclismo | `/members/activacion-ciclismo/` | activacion | Aug 1, 2026 — built on template v2 (pending deploy) |
