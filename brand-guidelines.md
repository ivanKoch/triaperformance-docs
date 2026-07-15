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

Source file: `tp_logo_horizontal.png` (currently hosted on HubSpot — download before HubSpot access ends; recreate as SVG for the new site).

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

- Real athletes, real races — the existing race photography (finish lines, open-water swims) is on-brand. No stock, no AI-generated athletes.
- Treatment: natural color, no filters. When text sits on a photo, use an Ink overlay at 35–50% opacity.
- Use photography sparingly — one strong image per page beats five average ones.

## 7. Components

**Primary button**: TP Blue fill, white text, 4px radius, 16px/28px padding, weight 700. Hover: Blue Deep. One primary CTA per section.

**Secondary button**: transparent, 1.5px Ink border, Ink text. Same geometry.

**Cards** (plans, tools): white fill, 1px Mist border, 8px radius, 32px padding. Price in Display weight. No shadows at rest; `0 1px 3px` shadow on hover only.

**Testimonials**: plain text, no card chrome. Quote in Body size, name + country in Small/Slate. Source quotes from `social-proof-and-reviews.md` — per-page, per-language.

**Forms**: single column, Mist borders, 4px radius. Labels above fields, never placeholder-only.

## 8. Voice

- Direct and data-grounded, like the coaching. Short sentences. Numbers over adjectives ("42k under 3 hours" beats "amazing results").
- Second person, informal-professional: "tú" in Spanish, "you" in English, "você" in Portuguese.
- No hype vocabulary: avoid "unlock", "crush", "beast mode", exclamation marks.
- Every page written natively per language (ES/EN/PT), not machine-translated verbatim — ES is the primary market and is written first.

## 9. Page inventory (v1 site)

Deliberately small, per the High North model:

1. **Home** — hero, services in one pass, plans/pricing, testimonials, lead magnet CTA.
2. **Coaching 1:1** — the Private-channel page. Pricing per `pricing-and-positioning.md`.
3. **Plans** — links out to the 300 TrainingPeaks plans.
4. **Tools** (later) — the calculators library, behind All-Access paywall.
5. **Contact** — WhatsApp + email. No contact-form theater.

Lead magnet (training zones guide) is a CTA block reused across pages, not its own page.
