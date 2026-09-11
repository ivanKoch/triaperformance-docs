#!/usr/bin/env node
/**
 * build-fueling-guide-pages.js — renders the three members-area pages for the
 * fuelling guide from the shared AST.
 *
 * Home doc:  fueling-guide-brief.md
 * Content:   automation/fueling-guide-content.js (which reads the markdown)
 * Outputs:   site/members/combustible/index.njk       (es)
 *            site/members/en/fueling/index.njk        (en)
 *            site/members/pt/combustivel/index.njk    (pt)
 *
 * ⚠️ NEVER HAND-EDIT THE GENERATED PAGES. Edit the markdown in fueling-guide/
 * and re-run this. Every page carries a DO-NOT-EDIT banner saying so; the same
 * rule mobility-brief.md and recovery-brief.md already state for their i18n
 * generators.
 *
 * Usage: node automation/build-fueling-guide-pages.js
 */

const fs = require("fs");
const path = require("path");
const C = require("./fueling-guide-content.js");
const { inline, plain } = C;

const ROOT = path.join(__dirname, "..");

/* Page chrome. This is UI, not guide copy, so it lives here rather than in the
   markdown — the markdown holds only what an athlete reads. */
// noindex is NOT set here on purpose: site/members/members.json is a directory
// data file that already applies it to every page under site/members/, en/ and
// pt/ included. Restating it per page gives the setting two homes and no benefit.
const CHROME = {
  es: { dir: "site/members/combustible",    home: "/members/#biblioteca",    lib: "Biblioteca", crumb: "Combustible", label: "Guía",  toc: "En esta guía", pdf: "Descargar en PDF" },
  en: { dir: "site/members/en/fueling",     home: "/members/en/#biblioteca", lib: "Library",    crumb: "Fuelling",    label: "Guide", toc: "In this guide", pdf: "Download as PDF" },
  pt: { dir: "site/members/pt/combustivel", home: "/members/pt/#biblioteca", lib: "Biblioteca", crumb: "Combustível", label: "Guia",  toc: "Neste guia",   pdf: "Baixar em PDF" },
};

const slug = (s) =>
  plain(s).toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const WARN = /^\s*⚠️/;

/* ------------------------------------------------------------- renderers */

function renderBlock(b) {
  switch (b.t) {
    case "h3": return `      <h3>${inline(b.x.replace(WARN, "").trim())}</h3>`;
    case "h4": return `      <h4>${inline(b.x)}</h4>`;
    case "p":  return `      <p>${inline(b.x.replace(WARN, "").trim())}</p>`;
    case "ul": return `      <ul>\n${b.items.map((i) => `        <li>${inline(i)}</li>`).join("\n")}\n      </ul>`;
    case "ol": return `      <ol>\n${b.items.map((i) => `        <li>${inline(i)}</li>`).join("\n")}\n      </ol>`;
    case "table":
      // tp-table--stack + data-label: the mobile pattern from members-carga.css.
      // Cells here hold sentences, which is the case a smaller font cannot save.
      return `      <table class="tp-table tp-table--stack">\n        <thead><tr>${
        b.head.map((h) => `<th>${inline(h)}</th>`).join("")
      }</tr></thead>\n        <tbody>\n${
        b.rows.map((r) => `          <tr>${r.map((c, j) =>
          `<td data-label="${plain(b.head[j] || "").replace(/"/g, "&quot;")}">${inline(c)}</td>`).join("")}</tr>`).join("\n")
      }\n        </tbody>\n      </table>`;
    default: throw new Error(`unhandled block type ${b.t}`);
  }
}

/** Blocks → HTML, opening a warn callout at a ⚠️ heading and closing it at the
    next heading of the same or higher level. A ⚠️ paragraph is its own callout. */
function renderBlocks(blocks) {
  const out = [];
  let open = false;
  const close = () => { if (open) { out.push(`      </div>`); open = false; } };

  for (const b of blocks) {
    const isHeading = b.t === "h3" || b.t === "h4";
    if (isHeading) close();

    if (isHeading && WARN.test(b.x)) {
      out.push(`      <div class="callout callout--warn">`);
      open = true;
      out.push(renderBlock(b));
      continue;
    }
    if (b.t === "p" && WARN.test(b.x) && !open) {
      out.push(`      <div class="callout callout--warn">`);
      out.push(renderBlock(b));
      out.push(`      </div>`);
      continue;
    }
    out.push(renderBlock(b));
  }
  close();
  return out.join("\n");
}

/* ------------------------------------------------------------------ page */

function buildPage(lang) {
  const c = C[lang], k = CHROME[lang];
  const [scope, letter, ...rest] = c.sections;
  const body = rest.slice(0, -1);             // the 13 numbered sections
  const sources = rest[rest.length - 1];

  const toc = body.map((s) => `        <li><a href="#${slug(s.heading)}">${inline(s.heading)}</a></li>`).join("\n");

  return `---
layout: layouts/base.njk
pageCss:
  - members.css
  - members-combustible.css
  - members-dark.css

title: "${plain(c.title)} — Triaperformance All-Access"
---
{#- GENERATED FILE — DO NOT EDIT BY HAND.
    Source:    fueling-guide/${c.source}
    Generator: automation/build-fueling-guide-pages.js
    Home doc:  fueling-guide-brief.md
    Edit the markdown and re-run the generator; a hand edit here is lost on the
    next build and puts this page out of sync with its two siblings and the PDF.

    Every fuelling figure on this page is a copy of methodology.md §8. Move it
    there first, then in the markdown. -#}
<header class="artifact-hero">
  <div class="wrap">
    <div class="breadcrumb"><a href="${k.home}">${k.lib}</a> / ${k.crumb}</div>
    <span class="label">${k.label}</span>
    <h1>${inline(c.title)}</h1>
    <p>${inline(c.subtitle)}</p>
  </div>
</header>

<section>
  <div class="wrap">
    <div class="callout callout--warn">
      <h2 class="callout-title">${inline(scope.heading)}</h2>
${renderBlocks(scope.blocks)}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>${inline(letter.heading)}</h2>
${renderBlocks(letter.blocks)}

    <div class="callout">
      <h3 class="callout-title">${k.toc}</h3>
      <ol class="toc">
${toc}
      </ol>
      <p><a href="/assets/guias/${c.filename}">${k.pdf} →</a></p>
    </div>
  </div>
</section>

${body.map((s) => `<section id="${slug(s.heading)}">
  <div class="wrap">
    <h2>${inline(s.heading)}</h2>
${renderBlocks(s.blocks)}
  </div>
</section>`).join("\n\n")}

<section>
  <div class="wrap fineprint">
    <h2>${inline(sources.heading)}</h2>
${renderBlocks(sources.blocks)}
  </div>
</section>
`;
}

/* ------------------------------------------------------------------ main */

let wrote = 0;
for (const lang of Object.keys(CHROME)) {
  const html = buildPage(lang);

  // Nunjucks safety: the guide must never emit template syntax into a .njk file.
  const bare = html.replace(/\{#-[\s\S]*?-#\}/g, "");
  if (/\{\{|\{%/.test(bare)) throw new Error(`${lang}: generated page contains Nunjucks syntax — escape it or the build will interpret it`);

  const dir = path.join(ROOT, CHROME[lang].dir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.njk"), html);
  console.log(`${lang}: ${CHROME[lang].dir}/index.njk — ${(html.length / 1024).toFixed(1)} KB, ${C[lang].sections.length} sections`);
  wrote++;
}
console.log(`${wrote} pages written from ${Object.keys(CHROME).length} markdown sources.`);
