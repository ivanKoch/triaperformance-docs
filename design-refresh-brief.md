# Design refresh — home doc

*Opened September 6, 2026, from the external design audit Iván commissioned (Grok, given the live site, a members test token and `brand-guidelines.md` v1.0).*

**What this doc owns:** the design/brand v1.1 initiative — the argument, the verified findings, the work list by difficulty, and the two open design decisions. **It owns no prices, no figures and no open items.** When a tranche of this becomes the live branch, its items go into `open-loops.md` like everything else and point back here. Do not let this file become a second open-item list.

**Its input** — the audit itself — is not in the repo and does not need to be: everything from it that survived checking is restated below with its verification. The audit's own build-order section is superseded by §3 here, which is ordered by effort rather than by priority because that is what Iván asked for.

---

## 1. The argument, in one paragraph

`brand-guidelines.md` v1.0 is an excellent **engineering and voice** spec and a weak **brand** spec. It defines the system by what is forbidden — no webfont, no second color, no dark on public pages, no mark, one image per page, "when in doubt, remove" — and the result is a site with no wrong decisions and no chosen ones. Absence reads as cheap next to `$149/mes`. The audit's central claim is correct and is the one worth acting on: **the members dark tools are the best design in the business, and v1.0 explicitly bans that system from the pages that have to sell it.** The athlete pays, and only then meets the brand that should have closed the sale.

**The sequencing consequence, which matters more than any single item below:** most of §3 is currently *in breach* of v1.0. A builder handed "make it nicer" against v1.0 will produce a more consistent cheap site. The guidelines patch (item 1) is not a documentation chore that follows the work — it is what unblocks it.

---

## 2. Verified against the repo

The audit was written from the outside. Everything below was checked against the files on September 6, 2026.

### Confirmed

| Claim | Verified |
|---|---|
| No logo file in the repo | `find site -iname "*logo*"` returns zero image assets. §2 of the guidelines says the PNG is "held locally by Iván." |
| No portrait on Sobre Iván | `site/sobre-ivan/index.njk` contains one `<img>`: a 56px credential badge. |
| All-Access shows nothing of the product | `site/all-access/index.njk` contains zero `<img>` tags. |
| Three homepage offers share one visual weight | `.grid-3` renders three identical `.card`s — same fill, same 1px Mist border, same 32px padding. |
| Testimonials are unstyled quotes | `.testimonial` is `margin-bottom` + curly quotes + a 14px slate attribution. No name treatment, no result, no link to the 46 reviews. |
| Hero first-paints as a dark rectangle | `.hero` is a CSS `background-image` with `image-set()`. There is no `<img>`, so it is not preload-able as written and paints `var(--ink)` until the JPEG lands. |
| The Ink veil kills the photo | `.hero::before` is a flat `opacity: 0.45` — the top of the 35–50% range the guidelines permit. |
| Empty `.video-slot` still shipping inside the paid area | Present on 6 pages: `carga`, `fuerza`, `en/training-load`, `en/strength`, `pt/carga-de-treino`, `pt/forca`. |
| The members theme split is real | **15 of the 54 members pages are light**: the three logins, the three forgot-passwords, the six Garmin/Carga pages and the three Fuerza pages. |

### Four things the audit could not see, and one it got wrong

1. **There is no `members-theme.css`.** The dark token block is **copy-pasted into six stylesheets** — `members-home`, `members-activacion`, `members-kettlebell`, `members-respiracion`, `members-downloads`, `members-zones-calculator`. `--blue-bright` is declared six times. *This is the structural blocker: any token change is six edits, so every improvement below gets six times more expensive than it should be, and drifts.* Fix it before anything else in members.

2. **Login and forgot-password are not on the brand font at all.** Both stylesheets set `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` — a different stack from the site's `"Helvetica Neue", Helvetica, Arial`. Six pages. *The first paid frame is not just light when it should be dark; it is a different typeface.*

3. **There is no favicon.** Not "default-ish" — `_includes/layouts/base.njk` emits no `rel="icon"`, no `apple-touch-icon`, no manifest. Every tab and every phone bookmark shows the browser's blank-page glyph.

4. **The credential badges already exist and the band already ships.** `site/assets/images/badges/` holds `ironman-u.png`, `stryd-certified-coach.png`, `tp-level2-accredited.png`, `esci.png`, rendered by `partials/credentials-band.njk` off `_data/credentials.json`. The audit's "credential rail, not bullets" is **built**. What is still a bullet list is the credential block *inside* `/sobre-ivan/` (`.cred-list`). Smaller job than the audit implies.

5. **Where I disagree — the nav.** "Delete the two-tier nav" treats a width constraint as a taste failure. The strip exists because content items and utility items were competing for the same 1080px, which is a real problem that returns the moment the strip is deleted. **What makes it read as a plugin bar is not that it is a second row — it is that it is a *washed* second row with a border.** Removing `background: var(--wash)` and the Mist bottom rule gets ~80% of the look for one line and no IA project. Collapsing to one row stays available later, but it is an information-architecture decision, not a CSS one.

6. **Where I disagree — replacing TP Blue.** `#004aad` is in 30+ stylesheets, the members token set, the lead-magnet PDFs, the GBP posts and the TrainingPeaks listings. Swapping the primary is a rebrand with a long tail of half-updated surfaces, and it is not what is broken. What is broken is that blue is the **only** color, so the site has no way to signal effort, heat, result or emphasis. **Keep blue. Add one warm token** — see §4.2, where the argument is that the second color should come out of the zone model rather than out of a moodboard.

---

## 3. The work list, by difficulty

Effort tiers, not priority. The **Impact** column is how much less accidental the site looks, which is the actual goal. Start where impact is high and effort is low — most of L1.

### L1 — an hour or less each, no design judgement required

| # | Change | Where | Impact |
|---|---|---|---|
| 1 | **Patch `brand-guidelines.md` to stop forbidding the rest of this list.** Six edits, not a rewrite: retire High North as the positive reference; replace "when in doubt, remove" with "when in doubt, make one element work harder"; delete "no webfont to load"; change "blue is the only saturated color" to "one accent plus one signal token"; change "this system never appears on public pages" to name the three public surfaces that may go carbon; fence "one strong image per page" so it stops deleting the coach's face. | `brand-guidelines.md` §1–§7.1 | **Unblocks everything else.** Do this first or the rest is in breach. |
| 2 | **Favicon set.** SVG + 180px apple-touch + manifest, wired into `base.njk`. A blue square with a white "T" in whatever face wins §4.1 is enough until a mark exists. | `_includes/layouts/base.njk` | High — every tab, every bookmark. |
| 3 | **Put login and forgot-password on the brand font stack.** Delete the `-apple-system` declaration in both files. | `members-login.css`, `members-forgot-password.css` (6 pages) | Medium — invisible individually, structural in aggregate. |
| 4 | **Hero veil: flat `.45` → `.30` plus a bottom-weighted gradient.** The text sits low; the veil does not need to be uniform. Recovers the yellow kit, which is the only color in the frame. Re-check the H1 against AAA after. | `site.css` `.hero::before` | High — the muddiness is the first thing a visitor sees. |
| 5 | **Stop the black flash.** Two parts: set the `.hero` base `background-color` to a warm dark sampled from the photo instead of `var(--ink)`, and layer a ~1KB inline base64 LQIP beneath `image-set()`. (A `<link rel="preload">` will not work while the image is a CSS background.) | `site.css`, `base.njk` | High — a flash of black is a quality tell before a word is read. |
| 6 | **Tabular figures everywhere a number is display type.** `font-variant-numeric: tabular-nums` on `.amount`, `.record-figure`, `.tp-table`, the zone tables and the calculator output. | `site.css`, `members-carga.css`, `zones-calculator.css` | Medium-high — cheapest "this was designed" signal available. |
| 7 | **Quiet the utility strip.** Drop `background: var(--wash)` and the Mist bottom border; take it to 12px. | `site.css` `.nav-utility` | Medium-high — removes the plugin-bar read for one line. |
| 8 | **Delete the six empty `.video-slot`s** (or record the videos). A dashed empty box inside a paid area reads as a prototype. | 6 members pages + `members.css` | Medium — only paying athletes see it, which is the point. |
| 9 | **One motion token.** `--t: 150ms cubic-bezier(.2,0,0,1)` plus a `prefers-reduced-motion` block. There are currently five ad-hoc `transition` declarations and no policy. | `site.css` | Low-medium — stillness only reads as chosen once it is written down. |

### L2 — an evening each

| # | Change | Where | Impact |
|---|---|---|---|
| 10 | **Extract `members-theme.css`.** One token block; the six stylesheets import it. **Prerequisite for 11, 12 and 20.** | `assets/css/` | Structural — nothing in members is cheap until this exists. |
| 11 | **Dark login + forgot-password.** After 10, mostly a swap. The first frame an athlete sees after paying should be the product, not a marketing card on a wash background. | 6 pages | High — highest-emotion moment in the funnel. |
| 12 | **Dark shell for Garmin / Carga / Fuerza.** Nine pages across three languages, but one table-and-callout skin serves all nine. Do not rewrite the words — the content is the best in the library. | 9 pages, `members-carga.css`, `members-fuerza-guia.css` | High — closes the light/dark split for good. |
| 13 | **Unequal offer cards on the homepage.** 1:1 gets width or height, a featured treatment and a face or a Monday-feedback still; All-Access and Plans stay secondary. | `index.njk`, `site.css` `.grid-3` | **Highest single impact on the public site.** `$149` currently looks like `$19.99` in a slightly different box. |
| 14 | **Testimonial module.** Name, country, event, finish time as a tabular chip, and a link to the 46 Google reviews. No photo needed for v1 — a result is proof, a stock face is not. Quotes stay owned by `social-proof-and-reviews.md`. | `site.css`, homepages | High — the strongest proof in the business is currently typeset as a sentence. |
| 15 | **Price treatment spec.** Lining/tabular figures, `/mes` in slate, one five-word inclusion line beneath, and a defined featured-card variant so 1:1 and a PDF cannot share a skin. | `site.css` `.price-card`, then `brand-guidelines.md` §7 | High — this is the number the whole site has to justify. |
| 16 | **Record strip on Sobre Iván as type.** Large tabular figures, hairline rules, no wash panel, no blue numbers. | `about.css` | Medium-high — right idea, default styling. |
| 17 | **Credential list on Sobre Iván → the band component.** The band already exists and already renders correctly on the homepage. `/sobre-ivan/` still uses `.cred-list` bullets. | `sobre-ivan/index.njk` ×3 | Medium — reuse, not new design. |

### L3 — a weekend each

| # | Change | Where | Impact |
|---|---|---|---|
| 18 | **Ship a real typeface.** Choice, Latin-ext subset (á é í ñ ã ç õ), `font-display: swap`, preload, and a re-tuned type scale — a chosen face at 56px does not sit where Helvetica sits. Two directions in §4.1. | `site.css`, `base.njk`, `brand-guidelines.md` §4 | **Highest impact of anything on this list, and the one that cannot be faked.** |
| 19 | **Promote dark to a first-class public system.** Three surfaces only, to start: the hero, the final CTA, and the featured 1:1 card. Needs a rule for the logo on `--bg`, how cards invert, and a contrast re-check. | `site.css`, `brand-guidelines.md` §7.1 | Very high — this is what makes storefront and product read as one company. |
| 20 | **Full `brand-guidelines.md` v1.1.** Structure: essence → tokens → type → components → photography system → motion → reject list → voice. **Move the changelog out** into `ai-infrastructure-documentation.md`. Half of v1.0 is dated commit notes, and a brand file that is also a lab notebook gets followed as a lab notebook. *(This is also plain repo hygiene — the "one home per figure, append-don't-rewrite" rule was written for technical docs, and it is what turned the brand file into a diff log.)* | `brand-guidelines.md` | High — determines whether any of this holds. |
| 21 | **Second accent token, live in three places.** Zone-scale top end, featured-offer accent, result chips. Not buttons, not links, not yet. Recalculate WCAG for both themes. See §4.2. | `site.css`, `members-theme.css`, `zones.csv` consumers | High — gives the site a way to mean "hard", which "todo se mide" needs. |
| 22 | **Show the product on All-Access.** Screenshots or a short silent loop of Activación and the zones calculator. **Nothing design-side blocks this** — the constraint is the `noindex` gate, which is a screenshot, not a permission. | `all-access/index.njk` ×3 | Very high — you are selling software and showing a paragraph. |
| 23 | **Plan card component.** Discipline icon or color, weeks, level, tabular price. One component serves all 18 hubs and kills the four ~95%-duplicate legacy stylesheets already flagged in the guidelines §9. | `plan-catalog-grid.njk`, `planes-hub.css` | Medium-high — the storefront is currently a text list with facets. |

### L4 — blocked on an asset or a decision, not on effort

| # | Change | Note |
|---|---|---|
| 24 | **A portrait of Iván.** Phone camera, north-facing window, 20 minutes, two crops (4:5 tight, 3:2 environmental). **The single largest trust failure on the site** for a `$149` 1:1 product. A real imperfect photo beats a blank bio by a wide margin — do not wait for a shoot. |
| 25 | **Logo as SVG, in the repo.** Currently local to Iván's machine. If Hermes cannot find it, there is no logo. Redraw in the §4.1 face once that is decided — the two jobs are one job. |
| 26 | **A mark.** Keep it typographic: a monogram cut from the chosen family, not an illustration. Must survive 16px and a watch face. *A bad mark is worse than a good wordmark — this is the one item where doing nothing beats doing it badly.* |
| 27 | **The photo pack.** Named shot list with owners and crops: portrait ×2, Iván racing, four athlete/result stills with names, one test/lab, one TrainingPeaks UI, one members-tool UI. Until it exists, "one strong image per page" means the same cyclist forever. |
| 28 | **OG image.** Mark + one race still. Currently a generic `og-default.jpg`, and plan links get sent over WhatsApp constantly — the highest-intent channel the site has. |

### L5 — projects, only after the system exists

| # | Change |
|---|---|
| 29 | **Hub as a desk, not a directory.** "Continuar", persisted sport/equipment in `localStorage`, last zones result. Re-asking "correr / bici / nadar" every visit makes a smart tool feel disposable. |
| 30 | **Data as a graphic language.** Zone bars, a PMC treatment, numbers as display type — specified in the guidelines. The promise is "todo se mide" and the method currently has no visual vocabulary, so it is always a paragraph. |
| 31 | **Zones result → Garmin guide** as one path in one theme, rather than two cards. |
| 32 | **Single nav component.** Collapse `.site-nav` / `.site-nav-sticky`; retire the competing drawer rules that made `/members/` scroll sideways for three weeks. |
| 33 | **Split hero** (photo + offer stack) using the dark tokens, once 19 has proven itself. |

---

## 3b. Decided, and what shipped September 6, 2026

**Both open decisions are closed — Iván's call, made against rendered specimens rather than descriptions** (`Triaperformance Design Bench`, published the same day: the same headline, price and three figures set three ways, plus the zone scale with and without the second colour).

- **Typeface: Direction B.** Archivo, one self-hosted variable file. **A remains the interesting road not taken** — a serif display would have separated hardest from a field that is uniformly sans — and it is the option to revisit if the site ever reads as competent-but-anonymous rather than cheap.
- **Colour: blue + heat.** Blue keeps identity and every interactive element; heat is a signal confined to three uses.

**Shipped in the same session — all of L1 except the LQIP's sibling work:**

| Item | What landed |
|---|---|
| 1 | `brand-guidelines.md` **v1.1**, rewritten. History moved to `ai-infrastructure-documentation.md` §45. |
| 2 | Favicon, 32px PNG fallback and a 180px touch icon — **the first icons this site has ever had**. The mark is a capital T cut from Archivo 700 / width 125%, the wordmark's own setting. |
| 3 | Login and forgot-password moved off their private `-apple-system` stack. |
| 4 | Hero scrim: flat 45% ink → a radial scrim centred on the text. |
| 5 | Hero first paint: base colour sampled from the image, plus a 936-byte inline LQIP. |
| 6 | Tabular figures on prices, the record strip, tables and card meta. |
| 7 | Utility strip: transparent, no rule, 12px, slate links. |
| 8 | Six empty `.video-slot`s deleted, and the rule with them. |
| 9 | `--t: 150ms` plus a site-wide `prefers-reduced-motion` block. |
| 10 | `tokens.css` — **both token sets in one file; eight stylesheets stopped declaring their own `:root`.** |
| 18 | Archivo live on every page, public and members. |

**Item 10 was L2 and got pulled forward** because everything in members costs six edits until it exists.

⚠️ **Two things found while doing it, neither of which the audit could see.** *(1)* **Login and forgot-password were not on the brand font at all** — six pages on `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`. *(2)* **The bottom-weighted scrim was wrong for this hero**, which centres its text: density at the bottom protects empty road and leaves the headline on the brightest part of the frame. *Caught by rendering the page, not by reading the stylesheet — the same lesson §23 of the infra doc already carries.*

---

## 4. The two decisions only Iván can make

Everything above is execution. These two are choices, and they gate items 18, 21, 25 and 26.

### 4.1 Typeface

Helvetica-as-system-stack is not one typeface — it is Helvetica Neue on a Mac, Arial on Windows, Roboto on Android. The site has four defaults, not a face. Two directions worth mocking on the same `$149` price card and the same H1:

**Direction A — "Studio."** Display in a high-contrast serif (Instrument Serif, Gambetta), text in a neutral grotesque (Inter, Instrument Sans). Reads editorial, calm, expensive; differentiates hardest from every other TrainingPeaks coach site, which are uniformly sans. Risk: a serif has to be handled well or it reads as a wedding invitation.

**Direction B — "Performance."** One family across display and text, using width and weight for hierarchy — Archivo is the strongest free candidate (400/600/700 plus Expanded and Condensed cuts, real tabular figures, full Latin-ext). Reads athletic, precise, technical. One file to load, one family to maintain, and it handles numbers well, which matters on a site that publishes prices, splits and zones on every page.

**Recommendation: B.** The brand promise is measurement, the pages are full of figures, and a single variable family is the lowest-maintenance way to stop looking unchosen. A is the more distinctive answer if he wants the site to look like a studio rather than a coach — it is a bigger swing in both directions.

Either way the wordmark gets redrawn in the winner and exported as SVG (item 25), because a wordmark in a face the site does not use is the current problem restated.

### 4.2 The second color

The audit says pull a heat color from the race kit. **A better source is already in the repo:** `data/zones.csv` defines a seven-zone model that runs from easy to maximal, and every zone-based surface — the calculator, the guides, the lead magnet, the Garmin page — needs to render that scale. So the second token is not decorative. It is the top of a scale the brand already owns.

That makes the palette *mean* something: **blue = aerobic, data, calm, UI; warm = intensity, effort, race, result.** Every use of it is then defensible instead of tasteful, which matters when the person making the call does not trust his own eye.

Proposed: one warm token around `#D9480F`–`#E8590C` (the deeper end clears AAA on white; the brighter end is for dark surfaces, exactly as `--blue-bright` already is for blue). First three uses only: the top of any zone scale, the featured 1:1 accent, and result/PR chips in testimonials. **Not buttons, not links, not nav** — those stay blue, which is what keeps this an addition rather than a rebrand.

---

## 5. What not to do

Carried from the audit, all of it correct:

- **No gradients, no glass, no third font, no second stock library.** More generic is still generic.
- **No AI-generated athletes.** v1.0 is right; that rule survives v1.1 unchanged.
- **Do not lighten the members tools to match the public site.** That would make the best design in the business worse. The direction of travel is the other way.
- **Do not change the offer structure.** Three tiers are clear. This is a design problem, not a packaging one.
- **Do not commission a 40-page brand book.** A four-page tokens + type + photo + reject-list document is enough, and is what item 20 delivers.
- **Do not hand a builder "polish it" against v1.0.** They will produce a more consistent cheap site. Item 1 exists for this reason.

---

## 6. Relationship to the rest of the repo

- **`brand-guidelines.md` stays the owner of every token, type spec and component rule.** This doc proposes changes to it; it does not become a second copy of it. Once v1.1 ships, §4 here is history and the guidelines are the source.
- **`open-loops.md` stays the only open-item list.** Nothing in §3 is an open item until Iván commits it to a branch; then it goes there and points back here by item number. *The list above is a menu, not a queue — treating it as a queue is how this file becomes the fourth thing that has to be split.*
- **Item 22 (show the product on All-Access) overlaps an existing NOW item** — "Nothing in the library is visible to a prospect", which already frames screenshots as one of three undecided options. Design says screenshots are the cheap half and need no decision; the ungating question is separate and stays there.
- **Items 25–28 create asset dependencies** that are Iván's, not a builder's. They are the long pole. Start the portrait this week regardless of what else is decided.
