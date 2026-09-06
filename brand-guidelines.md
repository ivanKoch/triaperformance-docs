# Triaperformance — Brand Guidelines

**v1.1 — September 6, 2026.** Lives in the site repo. Claude and Hermes build every page against this document; if a design decision isn't covered here, extend this file first, then build.

## 0. How to read this file

**Everything here is current and stated once.** There is no history in this document — no dated amendments, no struck-through lines, no "as of" notes. That is deliberate, and it is the main change from v1.0: a brand file that is also a changelog gets followed as a changelog, and a builder skimming for "what does the brand look like?" ends up parsing three months of decisions to find the colour table. **The historical record — every dated call, every superseded rule and the reasoning behind it — is preserved in `ai-infrastructure-documentation.md` §37.** Nothing was thrown away; it was moved somewhere that reading it is a choice.

**The rule that keeps it that way:** when a decision changes, **edit the rule in place** and add one line to §37. Do not strike text through here. Do not append a dated note here. If a rule can no longer be stated in one present-tense sentence, the decision underneath it is not finished.

**Ownership, so nothing is defined twice:**

| This file owns | Owned elsewhere |
|---|---|
| Colour tokens, type, spacing, components, motion, photography, voice, the reject list | Prices — `triaperformance-pricing-and-positioning.md` |
| The rules a page is built against | Zone percentages — `data/zones.csv` |
| | Systems, URLs, build record — `ai-infrastructure-documentation.md` |
| | Open work — `open-loops.md` |
| | Review quotes and counts — `social-proof-and-reviews.md` |
| | Members library wording — `site/_data/library.json` |

A number in this file is a copy and is wrong the moment its owner moves. There are none, on purpose.

---

## 1. Brand essence

Data-driven coaching with personal attention. The site should feel like the coaching does: **precise, calm, chosen.**

> Premium endurance studio. Few elements, but every one of them decided. Type is specified, not inherited. Photography is cropped and owned. Colour is scarce because the scarce colour is memorable — not because the palette was never finished.

Tagline: **Eleva tu performance** (ES) / **Elevate your performance** (EN) / **Eleve sua performance** (PT).

**The rule above all: when in doubt, make one element work harder.** Do not add a fifth section. Do not remove the thing that signals price. *v1.0 said "when in doubt, remove," and it produced deleted identity rather than edited identity — the mark, the webfont, the second colour and the coach's own face all went, each defensibly, and what was left was a page with no wrong decisions and no chosen ones.*

**Altitude.** The work must not look like a generic TrainingPeaks coach site or an Elementor triathlon template. It should sit comfortably beside brands priced above this one — calm, material, confident. **The internal benchmark is the members-area dark tools**: that is the most designed surface the business has, and the public site rises to meet it rather than the other way around.

---

## 2. Logo and mark

**Wordmark**: "Triaperformance", set in **Archivo, weight 700, width 112%**, letter-spacing −0.025em. Same setting as a Display heading, because the wordmark and the headline come from the same voice.

- On light backgrounds: Blue `#004aad`.
- On carbon backgrounds: White `#ffffff`.
- On photography: White, and it may sit directly on the image — no solid block behind it — provided the area under it is at 40% ink or darker. *A logo that cannot sit on a race photo is a logo that is not ready.*
- Clearspace: padding equal to the cap-height of the "T" on all sides.
- Minimum width: 140px digital.
- Never: effects, outlines, gradients, or a colourway outside the two above.

**Mark**: a capital **T** cut from the same setting (Archivo 700 / width 125%), knocked out of a Blue field. It is a monogram, not an illustration — that is what lets it survive 16px and a watch face.

Files, in the repo:

| Asset | Path | Use |
|---|---|---|
| Favicon | `site/assets/icons/favicon.svg` | Browser tab. 6px corner radius. |
| Favicon fallback | `site/assets/icons/favicon-32.png` | Browsers without SVG icon support. |
| Touch icon | `site/assets/icons/apple-touch-icon.png` | 180px, full-bleed, square — iOS applies its own mask. |

The horizontal wordmark still needs an SVG export in this setting. Until it exists the wordmark renders as live text, which is correct anyway for the nav.

---

## 3. Colour

Two complete systems, **peers, not a system and an appendix.** Light is the default for public pages; carbon is the default for the members area and is permitted on three named public surfaces (§3.3).

### 3.1 Light system

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary | TP Blue | `#004aad` | Links, primary buttons, logo, eyebrows. |
| Interaction | Blue Deep | `#003a89` | Hover/active of any Blue element. |
| Signal (text) | Heat | `#c2410c` | Result chips, intensity labels. Text-safe. |
| Signal (graphic) | Heat Graphic | `#d9480f` | Zone bars, the featured card's rule. Never body text. |
| Ink | Ink | `#1e2019` | Body and headline text. |
| Base | White | `#ffffff` | Default page background. |
| Tint | Blue Wash | `#edf3fb` | Alternate section backgrounds, card fills. Max one washed section per page. |
| Neutral | Slate | `#565a52` | Secondary text, captions, meta. |
| Line | Mist | `#e4e6e1` | Borders, dividers, card outlines. |

### 3.2 Carbon system

| Role | Var | Hex |
|---|---|---|
| Background | `--bg` | `#0d1117` |
| Surface (cards, dialogs, active rows) | `--surface` | `#171b21` |
| Surface 2 (nested) | `--surface2` | `#1f242c` |
| Border | `--border` | `#2a313b` |
| Blue as fill | `--blue` | `#004aad` |
| Blue hover | `--blue-deep` | `#003a89` |
| Blue as text | `--blue-bright` | `#4f8fdb` |
| Blue tint | `--blue-dim` | `rgba(0,74,173,.22)` |
| Heat, any use | `--heat-bright` | `#ff8a4c` |
| Heat tint | `--heat-dim` | `rgba(217,72,15,.22)` |
| Text | `--text` | `#f2f3f1` |
| Secondary text | `--text-dim` | `#8b9089` |
| Headings | `--white` | `#ffffff` |

Both token sets live once, in `assets/css/tokens.css`, imported by every stylesheet. **A stylesheet that declares its own `:root` block is a bug** — that is how `--blue-bright` came to be defined in six files.

### 3.3 Rules

- **Blue is the brand. Heat is a signal.** Blue carries identity, navigation and every interactive element. Heat carries *intensity* and appears in exactly three places: the top of any zone or effort scale, the featured offer's accent rule, and result chips. **Never a button, a link, or nav.**
- **Heat is not decorative, and that is what licenses it.** It is the top of the zone model in `data/zones.csv`. On a running scale the colour turns inside zone Y (100–102% of LTHR), which is where the physiology turns. If a proposed use of Heat cannot be justified by "this is the hard end of something", it is the wrong colour for that job.
- **TP Blue is fill-only on carbon** — it fails as text on `--bg`. Blue text on carbon is always `--blue-bright`. Same rule, same reason, for `--heat-bright`.
- **Full-blue sections are retired.** The dark moment on a page is carbon, not a flooded blue panel — a full-bleed brand-blue band is the single strongest "theme template" signal available. `/referidos/` and `/en/referrals/` still carry one and migrate to carbon when next touched.
- **Carbon on public pages is allowed on exactly three surfaces**: the **hero**, the **final CTA**, and the **featured offer card**. A page may use the hero and the final CTA together — they bookend it. Everything between them stays white-first.
- No gradients as decoration. A gradient is allowed only where it encodes something: a photographic scrim (§7) or a transition between two zone colours.
- Shadows: nothing heavier than `0 1px 3px rgba(30,32,25,.08)`. Form success/error may use standard green/red and appear nowhere else.

### 3.4 Contrast gate

Every text/background pair must clear **4.5:1**; graphic objects (bars, rules, icon strokes) must clear **3:1**. Any new colour clears its gate before it enters a table above.

| Pair | Ratio | Verdict |
|---|---|---|
| Ink on White | 16.5:1 | AAA |
| Blue on White | 8.1:1 | AAA |
| Slate on White | 7.1:1 | AAA |
| Blue on Wash | 7.3:1 | AAA |
| White on Blue Deep | 10.7:1 | AAA |
| Heat on White | 5.19:1 | AA — text permitted |
| Heat Graphic on White | 4.30:1 | Graphic only — fails AA text |
| `--blue-bright` on `--bg` | 7.4:1 | AAA |
| `--heat-bright` on `--bg` | 8.13:1 | AAA |

---

## 4. Typography

**Archivo**, self-hosted, one variable file: `site/assets/fonts/archivo-var-latin.woff2` (59.6 KB, weights 400–700, widths 100–125, Latin subset — which covers á é í ó ú ñ ü ã õ ç, so ES, EN and PT all ship from one file).

```css
@font-face {
  font-family: "Archivo";
  src: url("/assets/fonts/archivo-var-latin.woff2") format("woff2-variations");
  font-weight: 400 700;
  font-stretch: 100% 125%;
  font-display: swap;
}
--font: "Archivo", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
```

Preload it in `<head>`, ahead of the stylesheet. There is exactly one font file on this site; a second one needs an argument, not a preference.

**Three weights are permitted — 400, 600, 700.** *v1.0 capped it at two because each weight was a separate download on a system stack. With one variable file the cap has no cost behind it, and 600 is what a label or a nav item wants when 700 is shouting.*

**Width is hierarchy.** Display headings widen; body text does not. This is where the family earns its place — it gives a display voice without a second file.

| Level | Size (desktop / mobile) | Weight | Width | Tracking | Notes |
|---|---|---|---|---|---|
| Display (H1) | 56 / 36 | 700 | 112% | −0.025em | line-height 1.03. One per page. |
| H2 | 36 / 28 | 700 | 106% | −0.02em | Section titles. |
| H3 | 22 / 20 | 700 | 100% | −0.01em | Card titles, plan names. |
| Body | 17 / 16 | 400 | 100% | 0 | line-height 1.6, max 65ch. |
| Small | 14 | 400 | 100% | 0 | Captions, meta. Slate. |
| Label | 13 | 700 | 100% | +0.08em | Uppercase. Eyebrows. Blue, or Heat where it labels intensity. |
| UI | 15 | 600 | 100% | +0.005em | Nav, buttons, chips. |

**Figures.** `font-variant-numeric: tabular-nums` is **mandatory** anywhere numerals are display type or sit in a column: prices, the record strip, zone tables, calculator output, times, percentages. *This site publishes `$149`, `10h06` and seven zone ranges on almost every page; proportional figures are why they currently look typed rather than set.*

Rules: no italics. Headlines in sentence case — labels are the only uppercase element. `text-wrap: balance` on every heading.

---

## 5. Layout and spacing

- Content max-width 1080px, centred. Text columns max 65ch.
- 8px spacing grid. Section padding 96–128px desktop, 64px mobile. Whitespace is a material, not a filler — do not compress sections to fit more content, and do not add a section to fill space.
- **One idea per section. Four to six sections per page.** If an idea appears twice on one page, the second appearance is deleted, not reworded.
- Cards: 2–3 columns desktop, one column mobile.
- **Equal weight is a claim.** Three cards in a row asserts three equivalent things. Where the offers are not equivalent, the layout must say so — see §6 Featured card.

---

## 6. Components

**Primary button** — Blue fill, white text, 4px radius, 16px/28px padding, weight 700. Hover: Blue Deep. One per section.

**Secondary button** — transparent, 1.5px Ink border, Ink text, same geometry. On carbon: 1.5px `--border`, `--text`, hover to `--blue-bright`.

**Card** — white fill, 1px Mist border, 8px radius, 32px padding. `0 1px 3px` shadow on hover only. On carbon: `--surface` fill, 1px `--border`.

**Featured card** — the variant that carries the expensive offer. **A 3px Heat Graphic rule along the top edge** (`--heat-bright` on carbon), a Heat eyebrow, and more space than its siblings — wider, taller, or both. Nothing else changes. *One accent on one edge reads as "this is the chosen one"; a full orange outline reads as a warning.* Coaching 1:1 and a $19.99 plan must never share a card skin.

**Price** — Display weight and width, tabular figures, the period (`/mes`) at 20px weight 400 in Slate. Directly beneath it, **one line of five to seven words naming what you get** — not a feature, the shape of the thing. Then the list.

**Testimonial** — quote in Body, then name (600), country (Small/Slate), and a **result chip**: the event and the time, in tabular figures, 3px radius, Heat text on a Heat tint. The chip is the proof; the quote is the colour around it. Quotes come from `social-proof-and-reviews.md`.

**Credential band** — logo band grouped by issuing body, placed after athlete proof and before the final ask. Institutional proof follows human proof. Content from `site/_data/credentials.json`; never hand-written into a page.

**Zone scale** — a proportional bar: each zone's width is its actual span in % of threshold, read from `data/zones.csv`. Real zones take a hue; transition zones (X, Y) render as a gradient between their neighbours, because that is what a transition is. Never a row of equal tabs.

**Forms** — single column, Mist borders, 4px radius, labels above fields, never placeholder-only.

**Nav** — two rows. A quiet utility strip carries the language switcher and the members link; the main row carries content. *It is two rows because content items and utility items competed for the same 1080px and the language switcher wrapped — one row, one job.* The strip is **transparent, no bottom border, 12px**; it is a strip, not a bar. Below 860px both its items move into the drawer. A dropdown parent with no page of its own (`Recursos`) renders as `.nav-dropdown-label` — a span styled like its sibling links that opens the menu and does not navigate.

**Members Access button** (`.nav-member`) — 1.5px Blue border, Blue text, transparent fill, 4px radius, 8px/16px padding, weight 700, outline padlock to its left. Hover inverts to Blue fill, white text. **It stays the outline variant.** It shares a row with the solid Contacto CTA, and two filled buttons read as two equally weighted asks; the one that should win is aimed at people who have not paid yet. This one is for people who already have.

---

## 7. Photography

**Photography is a system, not a permission list.** The face is the product on a coaching site; a page that obeys every rule here and shows no human has failed.

**Subjects.** Real athletes, real races, real work. The vocabulary is: the coach, the athlete, the Monday feedback, the test protocol, the race, the watch, the whiteboard. **No AI-generated athletes, ever, without exception.**

**Required shots.** Until this pack exists, "one strong image per page" resolves to the same cyclist forever.

| Shot | For |
|---|---|
| Iván portrait, 4:5 tight | Sobre Iván, offer cards |
| Iván portrait, 3:2 environmental | Home, About hero |
| Iván racing | Home, About |
| 4 athlete/result stills, named | Testimonials, All-Access |
| 1 test/lab | Methodology, Coaching |
| 1 TrainingPeaks UI (permissioned) | Coaching, All-Access |
| 1 members-tool UI | All-Access |

**Treatment.** Natural colour, no filters. Crop tight and off-centre — a magazine crop, not a full frame shrunk to fit.

**Text on photography** uses a **gradient scrim shaped to where the text sits**, never a flat veil. Centred text takes a radial scrim (`radial-gradient(ellipse 78% 62% at 50% 47%, rgba(13,17,23,.66), rgba(13,17,23,.46) 55%, rgba(13,17,23,.16))`); text anchored low takes a bottom-weighted linear one. Either way the words clear contrast and the edges of the frame keep their colour. *A flat 45% ink veil greys an entire photograph to protect words that occupy a third of it, which is how the homepage hero came to have no colour in it — and a scrim aimed at the wrong third is the same mistake with extra steps.*

**Stock is permitted on blog listing cards only.** A blog card is a 16:10 thumbnail whose job is scannability, and the alternatives were one sourced photo per article — Iván's time, forever — or no images. Files live at `site/assets/images/blog/topics/<topic>.jpg` or `.../articles/<slug>.jpg`; anywhere else is outside the exception. Cards render a topic-coloured panel when no file exists, so the grid is complete with zero images and a photo is always an upgrade, never a dependency. Article heroes, product pages and marketing pages take real photography or nothing.

**Never ship a hero that flashes.** A photographic hero declares a base colour sampled from the image itself and an inline low-quality placeholder beneath the real file. A hero that paints flat black before the JPEG lands is a quality tell before a word has been read.

---

## 8. Motion

Motion is specified so that stillness is a choice rather than an omission.

- One duration token: `--t: 150ms cubic-bezier(.2, 0, 0, 1)`. Colour, border, background, opacity, transform.
- 200ms for anything crossing more than 200px.
- **Never animates:** page load, text, section entrances, numbers counting up. Content is present at first paint. No parallax, no bounce, no scroll-triggered reveals.
- Timers, progress rings and the zone bar in members may animate their own value; that is data moving, not decoration.
- Every transition sits behind `@media (prefers-reduced-motion: reduce)`, which disables all of them.

---

## 9. Data as a graphic language

The promise is *todo se mide*. Measurement needs a visual vocabulary, or the method is always a paragraph.

- **Numbers are display type.** A figure that matters is set at Display or H2 size in tabular figures, with its label small and beneath it — never inline in a sentence, never as a coloured number on a wash panel.
- **Scales are proportional.** Zone bars, effort ranges and progress render to the real spans in `data/zones.csv`. Blue at the aerobic end, Heat at the hard end, blends across transitions.
- **A chart takes the same care as type**: labelled axes, values the chart actually reaches, theme-appropriate text colour, and no legend where a direct label fits.
- Tables get tabular figures, a header in Wash (or `--surface2`), and horizontal scroll inside their own container — the page never scrolls sideways.

---

## 10. Voice

- Direct and data-grounded, like the coaching. Short sentences. Numbers over adjectives — "42k under 3 hours" beats "amazing results".
- Second person, informal-professional: "tú" in Spanish, "you" in English, "você" in Portuguese.
- **Spanish is neutral Latin American, not Rioplatense.** Two axes, both apply. **Tuteo** for verbs and pronouns (`tienes` not `tenés`; `apoya` not `apoyá`; `tú`/`ti` not `vos`). **Neutral vocabulary** for words that are regional without being voseo — `aquí` not `acá`, `piscina` not `pileta`, `espinilla` not `canilla`, `glúteos` not `cola`, `poco a poco` not `de a poco`, `una pausa` not `un parate`. *The second axis is the one that survives a verb-only find-and-replace, which is why it is written down.*
- **One exception: the 1:1 WhatsApp message library in `sales-playbook.md`.** Those are messages Iván sends as himself in a conversation. This section is a rule for published surfaces; applying it there would be applying a website rule to a chat.
- No hype vocabulary: no "unlock", "crush", "beast mode", no exclamation marks.
- Every page written natively per language, not machine-translated. ES is primary and is written first.

---

## 11. Reject list

If a page has any of these, it is not ready. This list exists because "minimal" with no floor under it defaults to "unset".

1. System fonts. If Archivo did not load, that is a bug, not a fallback.
2. A flat grey or ink veil over a hero photograph.
3. A hero that paints a solid rectangle before its image arrives.
4. A washed, bordered utility bar across the top of the page.
5. An empty dashed placeholder — a video slot, an image well — on any shipped page, paid or public.
6. A page selling 1:1 coaching with no photograph of the coach.
7. Offers of different prices sharing one card skin.
8. Prices or times in proportional figures.
9. Two blues of similar weight in one header.
10. A light page inside `/members/`.
11. A testimonial with no name, no country and no result.
12. Credentials as a bullet list where the credential band exists.
13. A full-bleed brand-blue section.
14. A number stated in two documents.

---

## 12. Page inventory

Deliberately small. **The build record for each — URLs, language trees, technical detail — lives in `ai-infrastructure-documentation.md`, not here.**

| Page | Note |
|---|---|
| **Home** | Hero, the three offers in one pass, price, testimonials, credential band, CTA. |
| **Coaching 1:1** | The private-channel page. |
| **Plans** | The storefront: per-language catalogue with facet filters, an individual page per plan, intent hubs. Every hub is the same catalogue component with a facet preset plus its own copy — a new hub is a template and copy, never a new page type. |
| **Tools** | The calculators and routines library, behind the `/members/` token gate. Three language trees, all translated. |
| **Contact** | A real form posting through Caddy → n8n → Twenty, plus WhatsApp and email. |
| **Sobre Iván** | Indexable and in the nav. Hero, record strip, prose, credential band, CTA. Content from `site/_data/credentials.json`. |
| **Referidos** | Unlisted by design — `noindex`, absent from the sitemap, linked from nowhere. Reachable only from the disclosure message that carries the link. *That is a product decision: a referral program anyone can find is one Iván can no longer decline gracefully.* |

Language convention: the public site prefixes `/en/` and `/pt/`; the members area uses a path segment (`/members/en/`) so one Caddy gate covers all three. **Keep both conventions** — consistency is cheaper than a good reason for an exception.

The lead-magnet CTA is a block reused across pages, not a page.
