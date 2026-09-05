# Triaperformance — Brand Guidelines

v1.0 — July 2026. Lives in the site repo. Claude and Hermes build every page against this document; if a design decision isn't covered here, extend this file first, then build.

## 1. Brand essence

Data-driven coaching with personal attention. The site should feel like the coaching does: precise, calm, no noise. Reference aesthetic: [highnorth.co.uk](https://www.highnorth.co.uk) — minimal, white-dominant, sparse pages where typography and whitespace do the work.

Tagline: **Eleva tu performance** (ES) / **Elevate your performance** (EN) / **Eleve sua performance** (PT).

One rule above all: **when in doubt, remove.** Fewer sections, fewer words, fewer colors.

## 2. Logo

Wordmark: "Triaperformance" set in Helvetica Bold.

- On white backgrounds: wordmark in Blue `#004aad`.
- On Blue backgrounds: wordmark in White.
- Never on photography without a solid color block behind it.
- Clearspace: minimum padding around the logo equal to the height of the capital "T" on all sides.
- Minimum width: 140px digital.
- Don't: add effects, outlines, gradients, or recolor outside the two approved combinations.

Source file: `tp_logo_horizontal.png` — held locally by Iván. Still worth recreating as an SVG for the site.

## 3. Color

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary | TP Blue | `#004aad` | Links, primary buttons, logo, accents. The only saturated color on the site. |
| Ink | Ink | `#1e2019` | All body and headline text on light backgrounds. |
| Base | White | `#ffffff` | Default page background. The site is white-first. |
| Tint | Blue Wash | `#edf3fb` | Alternate section backgrounds, card fills. Use sparingly — max one washed section per page. |
| Neutral | Slate | `#565a52` | Secondary text, captions, meta info. |
| Line | Mist | `#e4e6e1` | Borders, dividers, card outlines. |
| Interaction | Blue Deep | `#003a89` | Hover/active state of TP Blue elements. |

Rules:

- Blue is an accent, not a background theme. A typical viewport should be ~90% white/ink, ~10% blue.
- One exception: a single full-blue section per page is allowed (hero or final CTA, not both).
- No gradients, no shadows heavier than `0 1px 3px rgba(30,32,25,.08)`, no additional colors. Success/error states in forms may use standard green/red but nowhere else.

Contrast (WCAG, verified): every approved text/background pair passes AAA — Blue on White 8.1:1, Ink on White 16.5:1, Slate on White 7.1:1, Blue on Wash 7.3:1, White on Blue Deep 10.7:1. Any new color must clear 4.5:1 against its background before entering this table.

## 4. Typography

Font: **Helvetica** — served as system stack, no webfont to load:

```css
font-family: "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif;
```

Scale (desktop / mobile):

| Level | Size | Weight | Notes |
|---|---|---|---|
| Display (H1) | 56px / 36px | 700 | Letter-spacing −0.02em, line-height 1.05. One per page. |
| H2 | 36px / 28px | 700 | Section titles. Letter-spacing −0.01em. |
| H3 | 22px / 20px | 700 | Card titles, plan names. |
| Body | 17px / 16px | 400 | Line-height 1.6, max width 65ch. |
| Small | 14px | 400 | Captions, meta. Slate color. |
| Label | 13px | 700 | Uppercase, letter-spacing +0.08em, TP Blue. Section eyebrows. |

Rules: no italics, no light weights, no more than two weights (400/700) anywhere. Headlines in sentence case, not all-caps (labels are the only uppercase element).

## 5. Layout & spacing

- Content max-width: 1080px, centered. Text columns max 65ch.
- Spacing on an 8px grid. Section vertical padding: 96–128px desktop, 64px mobile. Generous whitespace is the brand's main visual asset — do not compress sections to fit more content.
- One idea per section. A page is 4–6 sections maximum (see High North: hero → what we do → plans → proof → CTA).
- Grid: cards in 2–3 columns desktop, single column mobile.

## 6. Photography

- Real athletes, real races — the existing race photography (finish lines, open-water swims) is on-brand. ~~No stock, no AI-generated athletes.~~ **Amended August 24, 2026 — licensed stock is now allowed on blog listing cards only.** *Iván's call, made explicitly against this rule while rebuilding the blog index. The reasoning is worth keeping: the no-stock rule was written for pages where the photo carries the brand — the homepage, coaching pages, All-Access. A blog card is a 16:10 thumbnail whose job is scannability, and the only alternatives were one sourced photo per article (his time, forever, which is what the whole content engine exists to avoid) or no images at all. **AI-generated athletes remain prohibited, without exception** — that half of the rule was never in question and covers a different risk. Scope: `/blog/` listing cards only. Article heroes, product pages and marketing pages still take real photography or nothing.*
  **Practical rule, so the exception doesn't spread:** stock lives at `site/assets/images/blog/topics/<topic>.jpg` (one per topic, reused) or `site/assets/images/blog/articles/<slug>.jpg` (a specific article). Anywhere else and it's outside the exception. Cards render a topic-coloured panel when no file exists, so the grid is complete with zero images and photos are an upgrade, never a dependency.
- Treatment: natural color, no filters. When text sits on a photo, use an Ink overlay at 35–50% opacity.
- Use photography sparingly — one strong image per page beats five average ones.

## 7. Components

**Primary button**: TP Blue fill, white text, 4px radius, 16px/28px padding, weight 700. Hover: Blue Deep. One primary CTA per section.

**Secondary button**: transparent, 1.5px Ink border, Ink text. Same geometry.

**Cards** (plans, tools): white fill, 1px Mist border, 8px radius, 32px padding. Price in Display weight. No shadows at rest; `0 1px 3px` shadow on hover only.

**Testimonials**: plain text, no card chrome. Quote in Body size, name + country in Small/Slate. Source quotes from `social-proof-and-reviews.md` — per-page, per-language.

**Forms**: single column, Mist borders, 4px radius. Labels above fields, never placeholder-only.

**Nav is two-tier** *(Aug 10, 2026)*: a thin utility strip (`.nav-utility`, Wash background, Mist bottom border) carries the language switcher and the members link; the main row carries content only. It went two-tier because the single row ran out of width the moment the members button was added — the language switcher wrapped to a second line — and the underlying cause was that content items and utility items were competing for the same 1080px. Each row now has one job. **The utility strip is desktop-only**; below 860px both its items move into the hamburger drawer. A dropdown parent with no page of its own (`Recursos`) renders as `.nav-dropdown-label`, a plain span styled identically to its sibling links — it opens the menu and does not navigate, because a parent link pointing nowhere real is worse than one that doesn't pretend to.

**Members Access nav button** (`.nav-member`, added Aug 10, 2026): 1.5px TP Blue border, TP Blue text, transparent fill, 4px radius, 8px/16px padding, weight 700, with a small outline padlock to its left. Hover inverts to a Blue fill with white text. *(In the utility strip it renders borderless at 13px — the outline treatment is for the mobile drawer and any future in-row use.)* It is a Secondary button in geometry but Blue rather than Ink, because it is a brand-owned destination rather than a generic alternative action. **It must stay the outline variant.** It sits in the same nav row as the solid Contacto CTA, and the "one primary CTA per section" rule above is what's at stake: two filled buttons side by side read as two equally-weighted asks, and the one that should win is the one aimed at people who haven't paid yet. This button is for people who already have.

## 7.1 Members-area dark theme (interactive tools / artifacts)

*Added August 1, 2026.* The members home and interactive tools (starting with the kettlebell routine, formalized with the running-activation tool) use a dark variant of the brand. **Dark is the default for members-area interactive artifacts**; static guide pages built earlier remain light until unified — as of Aug 13, 2026 that is only `carga` and its EN/PT siblings. (`nutricion` was retired outright.) (`zonas` and `tests` were retired into the calculator; `carrera` and `kettlebell` were retired outright; `guias` went dark with `members-downloads.css`, which also covers the new `/members/en/downloads/` and `/members/pt/downloads/`.) The public site stays white-first — this system never appears on public pages.

Token set (matches `assets/css/members-home.css`):

| Role | Var | Hex |
|---|---|---|
| Background | `--bg` | `#0d1117` |
| Surface (cards, dialogs, active rows) | `--surface` | `#171b21` |
| Surface 2 (nested elements) | `--surface2` | `#1f242c` |
| Border | `--border` | `#2a313b` |
| Blue fill (buttons, filled accents) | `--blue` | `#004aad` |
| Blue hover | `--blue-deep` | `#003a89` |
| Blue as text on dark | `--blue-bright` | `#4f8fdb` |
| Blue tint | `--blue-dim` | `rgba(0,74,173,.22)` |
| Text | `--text` | `#f2f3f1` |
| Secondary text | `--text-dim` | `#8b9089` |
| Headings | `--white` | `#ffffff` |

Rules: TP Blue `#004aad` stays a fill-only color on dark (fails contrast as text on `--bg`); any blue text uses `--blue-bright`. Secondary buttons: 1.5px `--border` border, `--text`, hover to `--blue-bright`. Everything else (type scale, spacing, radius, no-shadow rule, voice) unchanged from the light system.

## 8. Voice

- Direct and data-grounded, like the coaching. Short sentences. Numbers over adjectives ("42k under 3 hours" beats "amazing results").
- Second person, informal-professional: "tú" in Spanish, "you" in English, "você" in Portuguese.
- **Spanish is neutral Latin American, not Rioplatense** *(Iván, September 5, 2026, when the register sweep reached the last two surfaces)*. Two separate axes, and both apply: **tuteo** for verbs and pronouns (`tienes`, not `tenés`; `apoya`, not `apoyá`; `tú`/`ti`, not `vos`), and **neutral vocabulary** for the words that are regional without being voseo — `aquí` not `acá`, `piscina` not `pileta`/`natatorio`, `espinilla` not `canilla`, `glúteos` not `cola`, `poco a poco` not `de a poco`, `una pausa` not `un parate`. *The second axis is the one that survives a verb-only find-and-replace, which is why it is written down.*
  - ⚠️ **One deliberate exception: the 1:1 WhatsApp message library in `sales-playbook.md` is exempt** *(carve-out taken September 4, 2026 and re-confirmed by Iván on September 5 during the full sweep)*. Those are messages he sends as himself in a conversation; this section is a rule for published surfaces, and applying it to his own voice would be applying a website rule to a chat.
- No hype vocabulary: avoid "unlock", "crush", "beast mode", exclamation marks.
- Every page written natively per language (ES/EN/PT), not machine-translated verbatim — ES is the primary market and is written first.

## 9. Page inventory (v1 site)

Deliberately small, per the High North model:

1. **Home** — hero, services in one pass, plans/pricing, testimonials, lead magnet CTA.
2. **Coaching 1:1** — the Private-channel page. Pricing per `pricing-and-positioning.md`.
3. **Plans** — the storefront: per-language catalog pages with facet filters and an individual page per plan, each redirecting to its TrainingPeaks checkout with UTM + plan_id. *(Updated Aug 2, 2026 — this used to read "links out to the 300 TrainingPeaks plans," which describes a link list, not what was built.)* *(Updated Aug 6, 2026 — now **18 plan pages**, not 3 catalogs plus 4 categories. Intent hubs added: ES `/planes/ciclismo/`, `/natacion/`, `/ironman/` alongside the existing `/running/`, `/triatlon/`, `/hyrox/`, `/bajar-de-peso/` · EN `/en/plans/running/`, `/cycling/`, `/swimming/`, `/ironman/`, `/weight-loss/` · PT `/pt/planos/maratona/`, `/ciclismo/`, `/ironman/`. Every hub is the same catalog component with a facet preset plus its own intro copy and a closing coaching CTA — the pattern for any future hub, so a new one is a template and copy, never a new page type. Individual plan pages also gained four generated content sections (who it's for / how the training works / what you need / how TrainingPeaks works). Shared styles live in `planes-hub.css`; the four legacy per-category stylesheets are ~95% duplicates awaiting consolidation.)*
4. **Tools** — the calculators and routines library, behind the `/members/` token gate for All-Access subscribers. Live, not "later." *(Updated Aug 10, 2026 — the members area now has **three language trees**: `/members/` (ES), `/members/en/`, `/members/pt/`. Note the shape: language is a path segment here, not a `/en/` prefix like the public site, so one Caddy gate keeps covering all three — see `ai-infrastructure-documentation.md` §22 for why. ~~The EN and PT trees are **shell only** — home, login, forgot-password — and their library sections render a designed empty state. Ten tool pages exist in Spanish and none in EN/PT; do not read "three languages" as "translated."~~ *Corrected August 21, 2026 — no longer true. Every tool artifact originally published in Spanish has since been translated into English and Portuguese; Iván confirmed all three language trees working correctly in real use. The EN/PT trees are no longer shell-only. The zone calculator is the first tool going into all three at once.)*
5. **Contact** — a real contact form (name, email, WhatsApp, sport, goal) posting through Caddy → n8n → Twenty, plus WhatsApp and email. *(Updated Aug 2, 2026 — this used to say "no contact-form theater." The form has been the front door of the live lead pipeline since July 22, 2026; the original note was about avoiding a form that goes nowhere, which is the opposite of what shipped.)*

6. **Programa de referidos** — `/referidos/`, added Aug 26, 2026. **Unlisted by design:** `noindex: true`, absent from `sitemap.xml`, and linked from no nav, footer or page — it is reachable only from the WhatsApp/email disclosure message that carries the link. *That is a product decision, not an SEO one: a referral program anyone can find is one Iván can no longer decline gracefully, and "discretionary and earned" is the constraint the whole design rests on (`referral-program-brief.md` §2).* Six sections, one washed and one full-blue, per §3. Styles: `assets/css/referidos.css`.
   **English sibling at `/en/referrals/`** *(added Aug 26, 2026)*. ~~*Originally shipped the same day at a bare `/referrals/`, on the argument that a `noindex` link-only page carries no navigation meaning and a shorter URL pastes better into a message.*~~ **Moved to `/en/referrals/` within the hour, on Iván's call — keep the convention.** ***The reasoning is worth keeping because the original argument was not wrong, it was just outweighed:*** a one-off URL shape costs nothing today and costs an explanation every time someone later asks why this page is not where every other English page is. **Consistency is cheaper than a good reason.** Both siblings share `referidos.css` (one stylesheet, named for the language that shipped first) and `transKey: referrals` — the key emits no hreflang while `noindex` is set, and is there so the pair wires up correctly if that ever changes.
   **The copy-to-clipboard button lives in `_includes/partials/copy-button.njk`**, extracted the moment the second page needed it rather than pasted. *Same reasoning as `library-showcase.njk`: two hand-maintained copies of one behaviour is exactly how the three All-Access pages drifted.* Its strings come from the page's front matter (`copyTarget`, `copyLabel`, `copyDone`), so the partial holds no language.

7. **Sobre Iván** — `/sobre-ivan/`, `/en/about/`, `/pt/sobre-ivan/`, added Aug 27, 2026. **Indexable and in the nav**, under `Coaching` — the opposite of `/referidos/` above, and for the opposite reason: this page exists to be found by strangers, search engines and language models. Hero, a four-figure record strip, three prose sections, the credential list, and a contact CTA. **One washed section (`.about-record`) and no full-blue section**, per §3. Content comes from `site/_data/credentials.json` — the marks and the record are never hand-written into the page. Styles: `assets/css/about.css`; the credential strip that also appears on the homepages lives in `site.css`. Technical record: `ai-infrastructure-documentation.md` §36.

   > **Voice note, §8.** These three pages are written natively per language, not translated from the Spanish — and they use **tú/você**, not voseo. *`site/all-access/index.njk` remains the one ES page in breach of the §8 rule, which is logged in `open-loops.md` as a copy decision rather than a lint fix.*

Lead magnet (training zones guide) is a CTA block reused across pages, not its own page.
