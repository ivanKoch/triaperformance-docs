# Website source

The site is built with [Eleventy](https://www.11ty.dev/). You edit files here in `site/`;
the build produces plain static HTML in `_site/`, which is what Caddy serves.

Same idea as a PHP `include` — the nav and footer are written once and pasted into
every page — except it happens once at build time instead of on every request, so
what ships is ordinary static HTML with no runtime.

## Commands

```bash
npm install          # once
npm run serve        # local preview at http://localhost:8080, live-reloads on save
npm run build        # one-off build into _site/
```

## Layout

```
site/
  _data/
    site.json      global values: domain, analytics IDs, email, WhatsApp, price
    nav.json       the navigation menu, per language (+ the members-area variant)
    forms.json     every string in the contact form, per language
  _includes/
    layouts/base.njk        the HTML shell every page uses
    partials/analytics.njk  GA4 + Clarity
    partials/nav.njk        nav — public / members / none variants
    partials/footer.njk
    partials/tracking.njk   GA4 outbound-link conversion events
    partials/contact-form.njk
  assets/css/site.css       the shared stylesheet
  index.njk                 the Spanish homepage
```

## Writing a page

Front matter drives everything in the `<head>` and which shell the page gets:

```yaml
---
layout: layouts/base.njk
lang: es                 # es | en | pt — picks nav language and sets <html lang>
transKey: home           # pages sharing a transKey are translations of each other
title: Page title
description: Meta description.

navVariant: public       # public (default) | members-home | members-page | none
footerVariant: default   # default | members | none
pageCss: planes.css      # one stylesheet, or a list:
# pageCss:
#   - members.css
#   - members-carga.css

noindex: false           # true adds <meta name="robots" content="noindex, nofollow">
noClarity: false         # true omits the Microsoft Clarity tag
noTracking: false        # true omits the GA4 outbound-link conversion tracker
noPrint: false           # true adds no-print classes to nav and footer
---
```

Anything set in a directory data file (`site/members/members.json`) applies to every page
in that folder; a page's own front matter overrides it.

**`transKey` is the important one.** Every page that shares a `transKey` is treated as
the same page in another language. The layout then generates the `hreflang` tags and
points the ES/EN/PT switcher at the equivalent page rather than the language homepage.
Add a translation, get correct hreflang for free — no hand-maintained link tables.

**`transKey` is the important one.** Every page that shares a `transKey` is treated as
the same page in another language. The layout then generates the `hreflang` tags and
points the ES/EN/PT switcher at the equivalent page rather than the language homepage.
Add a translation, get correct hreflang for free — no hand-maintained link tables.

## Things that are deliberate

- **Contact-form sport values are the same Spanish strings in all three languages.**
  Only the visible labels are translated. n8n maps those values to Twenty's `sport`
  enum — changing a value breaks lead creation. See `contact-form-pipeline-runbook.md`.
- **The build knows nothing about authentication.** It emits `/members/*` as ordinary
  static files; Caddy gates that path with `forward_auth` at request time. Adding a
  members page is just adding a page.
- **`_site/` and `node_modules/` are gitignored.** Generated output never goes in the repo;
  the VPS rebuilds it at deploy time.
