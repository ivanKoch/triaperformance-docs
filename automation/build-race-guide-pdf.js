#!/usr/bin/env node
/**
 * build-race-guide-pdf.js — renders the race execution guide to a branded PDF.
 *
 * Home doc:  race-execution-guide-brief.md
 * Content:   automation/race-guide-content.js (which reads the markdown)
 * Sibling:   automation/build-race-guide-pages.js — the members pages, from the
 *            SAME AST. Neither output is authored; both are generated, so the
 *            page and the PDF cannot drift from each other.
 *
 * Design follows build-fueling-guide-pdf.js: white typographic cover per
 * brand-guidelines §6, brand blue kicker, --wash callouts.
 *
 * Usage: node automation/build-race-guide-pdf.js [es|en|pt] [--magnet] [outfile.pdf]
 * Needs: playwright + chromium.
 */

const fs = require("fs");
const path = require("path");
const C = require("./race-guide-content.js");
const { inline, plain } = C;

const MAGNET = process.argv.includes("--magnet");
const LANG = (process.argv[2] || "es").toLowerCase();
const DOC = C[LANG];
if (!DOC) { console.error(`unknown language "${LANG}" — expected es | en | pt`); process.exit(2); }

/* The lead-magnet cut is a SECTION ALLOWLIST through this same builder, not a
   fourth document. Sections are chosen by their number, so the list is
   language-independent and survives a reorder.

   2 / 9 / 14 is the guide's one argument end to end: write three goals before
   the race, follow the procedure when the plan dies at kilometre 30, and carry
   the if/then sheet that makes both executable. It is the part no competing
   guide in this market gives away.

   ⚠️ What is deliberately NOT in the magnet, and why it is not an oversight:
   §3 (the written plan), §5 (the block calendar) and §6 (race week) are
   preparation work that needs a coach's calendar to be worth anything, and a
   magnet reaching strangers would be selling a process it cannot deliver.
   §9 ships whole, including the stop list — a magnet that teaches an athlete
   to push through kilometre 30 without also telling them when to stop is the
   exact document this guide was rebuilt to stop being. The scope box ships
   uncut for the same reason. */
const MAGNET_SECTIONS = [2, 9, 14];

const MAGNET_CHROME = {
  es: { file: "decidir-en-el-kilometro-30.pdf", title: "Decidir en el kilómetro 30",
        sub: "Las tres metas, el procedimiento cuando el plan falla, y la hoja que llevas encima",
        lede: "Tres secciones de la Guía de Ejecución de Carrera de Triaperformance: cómo escribir tus metas A, B y C antes de la carrera, qué decidir exactamente cuando el ritmo se cae y el objetivo se aleja, y la plantilla de decisiones que resuelve el día por ti.",
        ctaH: "Esto es una parte de la guía completa",
        ctaP: "La Guía de Ejecución completa añade el plan de carrera escrito, el techo de ritmo de los primeros kilómetros, dónde poner la atención según la intensidad, la semana de la carrera, el debrief y cuatro plantillas imprimibles. Está dentro de Triaperformance All-Access, junto con el resto de la biblioteca.",
        ctaA: "Ver All-Access", ctaU: "https://triaperformance.com/all-access/",
        ctaB: "¿Prefieres que lo aterricemos a tu carrera concreta? Escríbeme." },
  en: { file: "deciding-at-kilometre-30.pdf", title: "Deciding at kilometre 30",
        sub: "The three goals, the procedure when the plan fails, and the sheet you carry with you",
        lede: "Three sections from the Triaperformance Race Execution Guide: how to write your A, B and C goals before the race, exactly what to decide when the pace drops and the goal moves away, and the decision template that settles the day for you.",
        ctaH: "This is one part of the full guide",
        ctaP: "The complete Race Execution Guide adds the written race plan, the pace ceiling for the opening kilometres, where to put your attention by intensity, race week, the debrief and four printable templates. It is inside Triaperformance All-Access, along with the rest of the library.",
        ctaA: "See All-Access", ctaU: "https://triaperformance.com/en/all-access/",
        ctaB: "Would you rather we fitted it to your actual race? Write to me." },
  pt: { file: "decidir-no-quilometro-30.pdf", title: "Decidir no quilômetro 30",
        sub: "As três metas, o procedimento quando o plano falha, e a folha que você leva junto",
        lede: "Três seções do Guia de Execução de Prova da Triaperformance: como escrever as suas metas A, B e C antes da prova, o que exatamente decidir quando o ritmo cai e o objetivo se afasta, e o modelo de decisões que resolve o dia por você.",
        ctaH: "Isto é uma parte do guia completo",
        ctaP: "O Guia de Execução completo acrescenta o plano de prova escrito, o teto de ritmo dos primeiros quilômetros, onde colocar a atenção conforme a intensidade, a semana da prova, o debrief e quatro modelos para imprimir. Está dentro do Triaperformance All-Access, junto com o resto da biblioteca.",
        ctaA: "Ver All-Access", ctaU: "https://triaperformance.com/pt/all-access/",
        ctaB: "Prefere que a gente adapte isso à sua prova? Me escreva." },
}[LANG];

const OUT = process.argv.find((a) => a.endsWith(".pdf")) ||
  path.join(__dirname, "..", "site", "assets", "guias", MAGNET ? MAGNET_CHROME.file : DOC.filename);

const CHROME = {
  es: { kicker: "Guía Triaperformance", contents: "Contenido", cover: "Guía de Ejecución de Carrera" },
  en: { kicker: "Triaperformance Guide", contents: "Contents", cover: "Race Execution Guide" },
  pt: { kicker: "Guia Triaperformance", contents: "Conteúdo", cover: "Guia de Execução de Prova" },
}[LANG];

const WARN = /^\s*⚠️/;

/* ------------------------------------------------------------- rendering */

function block(b) {
  switch (b.t) {
    case "h3": return `<h3>${inline(b.x.replace(WARN, "").trim())}</h3>`;
    case "h4": return `<h4>${inline(b.x)}</h4>`;
    case "p":  return `<p>${inline(b.x.replace(WARN, "").trim())}</p>`;
    case "quote": return `<blockquote class="rule">${inline(b.x)}</blockquote>`;
    case "ul": return `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`;
    case "ol": return `<ol>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ol>`;
    case "table":
      return `<table><thead><tr>${b.head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${
        b.rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")
      }</tbody></table>`;
    default: throw new Error(`unhandled block type ${b.t}`);
  }
}

function blocks(list) {
  const out = [];
  let open = false;
  const close = () => { if (open) { out.push("</div>"); open = false; } };
  for (const b of list) {
    const heading = b.t === "h3" || b.t === "h4";
    if (heading) close();
    if (heading && WARN.test(b.x)) { out.push(`<div class="callout callout--warn">`); open = true; out.push(block(b)); continue; }
    if (b.t === "p" && WARN.test(b.x) && !open) { out.push(`<div class="callout callout--warn">${block(b)}</div>`); continue; }
    out.push(block(b));
  }
  close();
  return out.join("");
}

const [scope, letter, ...rest] = DOC.sections;
const allBody = rest.slice(0, -1);
const sources = rest[rest.length - 1];

const secNo = (s) => parseInt((s.heading.match(/^(\d+)\./) || [])[1], 10);
const body = MAGNET ? allBody.filter((s) => MAGNET_SECTIONS.includes(secNo(s))) : allBody;
if (MAGNET && body.length !== MAGNET_SECTIONS.length) {
  console.error(`magnet allowlist matched ${body.length} of ${MAGNET_SECTIONS.length} sections — the guide was renumbered`);
  process.exit(2);
}
// In the magnet the guide's numbering is meaningless, so headings renumber 1..n.
const headingOf = (s, i) => MAGNET ? `${i + 1}. ${s.heading.replace(/^\d+\.\s*/, "")}` : s.heading;

const TITLE = MAGNET ? MAGNET_CHROME.title : DOC.title;
const SUBTITLE = MAGNET ? MAGNET_CHROME.sub : DOC.subtitle;

/* The cover lede: the guide's own one-line promise, taken from the scope
   section rather than written here, so the cover cannot contradict the text.
   [0] is the "this is not medical or psychological advice" disclaimer; [1] is
   what the guide actually promises. THE COVER TAKES THE PROMISE — the fuelling
   build shipped a cover carrying the disclaimer, and it read like a warning
   label instead of an offer. */
const scopeParas = scope.blocks.filter((b) => b.t === "p" && !WARN.test(b.x));
const coverLede = MAGNET ? MAGNET_CHROME.lede : plain((scopeParas[1] || scopeParas[0] || { x: "" }).x);

const HTML = `<!doctype html>
<html lang="${LANG}"><head><meta charset="UTF-8"><style>
  :root{ --blue:#004aad; --blue-deep:#003a89; --ink:#1e2019; --white:#fff;
         --wash:#edf3fb; --slate:#565a52; --mist:#e4e6e1;
         /* Literal copies of --warn-ink / --warn-wash from tokens.css. A PDF is
            standalone HTML and cannot import them; the values must match. */
         --warn-ink:#a3301c; --warn-wash:#fdf1ef; }
  @page { size: A4; margin: 16mm 15mm 18mm; }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--ink);
       font-size:10.5pt;line-height:1.55;-webkit-font-smoothing:antialiased}
  strong{font-weight:700} em{font-style:italic}
  code{font-family:"SF Mono",Menlo,monospace;font-size:9.5pt;background:var(--wash);padding:0 .8mm;border-radius:2px}
  a{color:var(--blue);text-decoration:none}

  /* ---------- cover ---------- */
  .cover{height:255mm;page-break-after:always;display:flex;flex-direction:column}
  .cover .wordmark{font-size:14pt;font-weight:700;letter-spacing:-0.01em;color:var(--blue)}
  .cover .cover-body{margin-top:auto}
  .cover .kicker{font-size:8.5pt;font-weight:700;text-transform:uppercase;
                 letter-spacing:.13em;color:var(--blue);display:block;margin-bottom:5mm}
  .cover h1{font-size:33pt;font-weight:700;letter-spacing:-0.02em;line-height:1.06;margin-bottom:4mm}
  .cover .sub{font-size:13pt;color:var(--slate);margin-bottom:10mm}
  .cover .lede{font-size:10.5pt;line-height:1.6;color:var(--slate);max-width:130mm;
               border-top:1px solid var(--mist);padding-top:6mm}
  .cover .foot{margin-top:auto;font-size:8.5pt;color:var(--slate);
               border-top:1px solid var(--mist);padding-top:4mm}

  /* ---------- contents ---------- */
  .toc{page-break-after:always}
  .toc h2{font-size:20pt;font-weight:700;letter-spacing:-0.02em;margin-bottom:6mm}
  .toc ol{list-style:none;counter-reset:t}
  .toc li{counter-increment:t;padding:2.4mm 0;border-bottom:1px solid var(--mist);
          font-size:11pt;display:flex;gap:4mm}
  .toc li::before{content:counter(t);color:var(--blue);font-weight:700;flex:0 0 7mm}

  /* ---------- sections ---------- */
  section{page-break-before:always}
  section.tight{page-break-before:auto}
  h2.sec{font-size:20pt;font-weight:700;letter-spacing:-0.02em;line-height:1.1;
         margin-bottom:5mm;padding-bottom:2.5mm;border-bottom:2px solid var(--blue)}
  h3{font-size:12pt;font-weight:700;margin:6mm 0 2mm;page-break-after:avoid}
  h4{font-size:10.5pt;font-weight:700;margin:4mm 0 1.5mm;page-break-after:avoid}
  p{margin-bottom:3mm;max-width:158mm}
  ul,ol{margin:0 0 3.5mm 5mm} li{margin-bottom:1.4mm;max-width:152mm}

  /* ---------- the coach's own rules ---------- */
  blockquote.rule{border-left:3px solid var(--blue);background:var(--wash);
                  padding:3mm 5mm;margin:4mm 0;font-size:11pt;page-break-inside:avoid;
                  max-width:158mm}

  /* ---------- tables ---------- */
  /* width:100%, which is the full 180mm content box. A capped 176mm was tried
     on September 11, 2026 to fix a right border that looked missing in the
     rendered page image; it was not missing. Measured with pdfplumber, the
     table grid draws to x1=553.5pt against a content edge of 553.4 — the
     border sits exactly on the margin and renders faint at screen resolution.
     Do not cap it again without measuring first. */
  table{width:100%;border-collapse:collapse;margin:4mm 0 5mm;font-size:9pt;page-break-inside:avoid}
  thead{display:table-header-group}
  th,td{border:1px solid var(--mist);padding:2.2mm 2.6mm;text-align:left;vertical-align:top;line-height:1.42}
  th{background:var(--wash);font-weight:700;color:var(--blue-deep)}
  tr{page-break-inside:avoid}
  /* The four templates are meant to be filled in by hand, so their empty cells
     need a writable height. Without this they collapse to a hairline and print
     as a grid nobody can use. */
  td:empty{height:12mm}

  /* ---------- callouts ---------- */
  .callout{background:var(--wash);border-left:2px solid var(--blue);border-radius:0 4px 4px 0;
           padding:4mm 5mm;margin:4.5mm 0;page-break-inside:avoid}
  .callout h3,.callout h4{margin-top:0}
  .callout p:last-child,.callout ul:last-child,.callout ol:last-child{margin-bottom:0}
  /* Red, not blue. #e8f0fa was one shade off the plain callout and the stop
     list printed as a note. Matches .callout--warn in members-dark.css. */
  .callout--warn{border-left-color:var(--warn-ink);border-left-width:3px;background:var(--warn-wash)}
  .callout--warn h3,.callout--warn h4{color:var(--warn-ink)}
  .scope{border:1px solid var(--mist);border-left:3px solid var(--blue);border-radius:0 4px 4px 0;
         padding:5mm 6mm;margin-bottom:6mm}
  .scope h2{font-size:13pt;font-weight:700;margin-bottom:3mm}

  /* ---------- sources ---------- */
  .sources{font-size:8.5pt;color:var(--slate)}
  .sources li{margin-bottom:2mm}
</style></head><body>

<div class="cover">
  <div class="wordmark">Triaperformance</div>
  <div class="cover-body">
    <span class="kicker">${CHROME.kicker}</span>
    <h1>${inline(TITLE)}</h1>
    <p class="sub">${inline(SUBTITLE)}</p>
    <p class="lede">${coverLede}</p>
  </div>
  <div class="foot">Iván Koch — Founder &amp; Head Coach · coach@triaperformance.com</div>
</div>

${MAGNET ? "" : `<div class="toc">
  <h2>${CHROME.contents}</h2>
  <ol>${body.map((s) => `<li>${inline(s.heading.replace(/^\d+\.\s*/, ""))}</li>`).join("")}</ol>
</div>`}

<section class="tight">
  <div class="scope">
    <h2>${inline(scope.heading)}</h2>
    ${blocks(scope.blocks)}
  </div>
  <h2 class="sec">${inline(letter.heading)}</h2>
  ${blocks(letter.blocks)}
</section>

${body.map((s, i) => `<section><h2 class="sec">${inline(headingOf(s, i))}</h2>${blocks(s.blocks)}</section>`).join("")}

${MAGNET ? `<section>
  <h2 class="sec">${MAGNET_CHROME.ctaH}</h2>
  <p>${MAGNET_CHROME.ctaP}</p>
  <div class="callout"><p><strong><a href="${MAGNET_CHROME.ctaU}">${MAGNET_CHROME.ctaA} →</a></strong></p>
  <p>${MAGNET_CHROME.ctaB} <a href="mailto:coach@triaperformance.com">coach@triaperformance.com</a> · <a href="https://wa.me/573105437088">WhatsApp</a></p></div>
</section>` : `<section><h2 class="sec">${inline(sources.heading)}</h2><div class="sources">${blocks(sources.blocks)}</div></section>`}

</body></html>`;

/* The stop list must survive every cut. The magnet includes §9 by allowlist,
   but an allowlist is a number and a number can be edited; this asserts the
   rendered HTML, which is what the athlete actually receives. */
if (!/callout--warn/.test(HTML)) {
  console.error(`${LANG}${MAGNET ? " magnet" : ""}: rendered HTML has no warn callout — the stop list is missing`);
  process.exit(2);
}

(async () => {
  let chromium;
  try { ({ chromium } = require("playwright")); }
  catch (e) { console.error("playwright missing — npm i -D playwright && npx playwright install chromium"); process.exit(2); }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(HTML, { waitUntil: "networkidle" });
  await page.pdf({
    path: OUT, format: "A4", printBackground: true,
    margin: { top: "16mm", right: "15mm", bottom: "18mm", left: "15mm" },
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate:
      `<div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:7pt;color:#565a52;
        padding:0 15mm;display:flex;justify-content:space-between;">
        <span>Triaperformance · ${plain(TITLE)}</span>
        <span class="pageNumber"></span></div>`,
  });
  await browser.close();
  console.log(`${MAGNET ? "MAGNET" : "GUIDE "} ${LANG}: ${path.relative(path.join(__dirname, ".."), OUT)}  (${body.length} sections)`);
})();
