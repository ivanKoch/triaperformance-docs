#!/usr/bin/env node
/**
 * build-fueling-guide-pdf.js — renders the fuelling guide to a branded PDF.
 *
 * Home doc:  fueling-guide-brief.md
 * Content:   automation/fueling-guide-content.js (which reads the markdown)
 * Sibling:   automation/build-fueling-guide-pages.js — the members pages, from
 *            the SAME AST. Neither output is authored; both are generated, so
 *            the page and the PDF cannot drift from each other.
 *
 * Design follows build-zones-guide-pdf.js: white typographic cover per
 * brand-guidelines §6, brand blue kicker, --wash callouts. CSS tokens are
 * duplicated rather than shared, which is the call this repo already made once
 * — extracting a common stylesheet means touching two live builders.
 *
 * ⚠️ This is a ~30-page reference document, NOT a lead magnet. The other three
 * PDFs in site/assets/guias/ are 6–8 page magnets and are laid out for a single
 * sitting; this one gets a contents page and a section-per-page break because
 * it is meant to be searched, not read through. The lead-magnet cut of this
 * guide is a separate artifact and a separate open item.
 *
 * Usage: node automation/build-fueling-guide-pdf.js [es|en|pt] [--magnet] [outfile.pdf]
 * Needs: playwright + chromium.
 */

const fs = require("fs");
const path = require("path");
const C = require("./fueling-guide-content.js");
const { inline, plain } = C;

const MAGNET = process.argv.includes("--magnet");
const LANG = (process.argv[2] || "es").toLowerCase();
const DOC = C[LANG];
if (!DOC) { console.error(`unknown language "${LANG}" — expected es | en | pt`); process.exit(2); }
/* The lead-magnet cut is a SECTION ALLOWLIST through this same builder, not a
   fourth document — the decision recorded in fueling-guide-brief.md. Sections
   are chosen by their number in the guide, so the list is language-independent
   and survives a reorder. 2/3/4/10 is the "how to fuel your long session, and
   what to do when your stomach says no" story: the four both reviews named as
   load-bearing, minus the race templates.

   ⚠️ What is deliberately NOT in the magnet, and why it is not an oversight:
   hydration and sodium (§6), caffeine (§8) and carb loading (§7) all carry a
   safety tail — hyponatraemia symptoms, contraindications, a loading protocol —
   that needs the space the full guide gives it. A magnet reaching strangers
   should not carry a dose it cannot also carry the warning for. The scope box
   ships with the magnet for the same reason, uncut. */
const MAGNET_SECTIONS = [2, 3, 4, 10];

const MAGNET_CHROME = {
  es: { file: "alimentar-tus-sesiones-largas.pdf", title: "Cómo alimentar tus sesiones largas",
        sub: "La fórmula del pre-entreno, cuántos gramos por hora, y cómo entrenar el intestino para tolerarlos",
        lede: "Cuatro secciones del Kit de Combustible de Triaperformance: qué comer antes, cuánto meter por hora según la duración y el deporte, cómo subir esa cantidad sin romperte el estómago, y qué hacer el día que se cierre igual.",
        ctaH: "Esto es la cuarta parte de la guía completa",
        ctaP: "El Kit de Combustible completo añade hidratación y sodio, cafeína, carga de carbohidratos, calor y altura, y una plantilla de carrera para nueve distancias. Está dentro de Triaperformance All-Access, junto con el resto de la biblioteca.",
        ctaA: "Ver All-Access", ctaU: "https://triaperformance.com/all-access/",
        ctaB: "¿Prefieres que lo aterricemos a tu carrera concreta? Escríbeme." },
  en: { file: "fuel-your-long-sessions.pdf", title: "How to fuel your long sessions",
        sub: "The pre-session formula, how many grams per hour, and how to train your gut to tolerate them",
        lede: "Four sections from the Triaperformance Fuel Kit: what to eat before, how much to take per hour by duration and sport, how to raise that number without wrecking your stomach, and what to do the day it shuts down anyway.",
        ctaH: "This is a quarter of the full guide",
        ctaP: "The complete Fuel Kit adds hydration and sodium, caffeine, carbohydrate loading, heat and altitude, and a race template for nine distances. It is inside Triaperformance All-Access, along with the rest of the library.",
        ctaA: "See All-Access", ctaU: "https://triaperformance.com/en/all-access/",
        ctaB: "Would you rather we fitted it to your actual race? Write to me." },
  pt: { file: "alimentar-seus-treinos-longos.pdf", title: "Como alimentar seus treinos longos",
        sub: "A fórmula do pré-treino, quantos gramas por hora, e como treinar o intestino para tolerá-los",
        lede: "Quatro seções do Kit de Combustível da Triaperformance: o que comer antes, quanto colocar por hora conforme a duração e o esporte, como subir essa quantidade sem arrebentar o estômago, e o que fazer no dia em que ele fechar assim mesmo.",
        ctaH: "Isto é um quarto do guia completo",
        ctaP: "O Kit de Combustível completo acrescenta hidratação e sódio, cafeína, carga de carboidratos, calor e altitude, e um modelo de prova para nove distâncias. Está dentro do Triaperformance All-Access, junto com o resto da biblioteca.",
        ctaA: "Ver All-Access", ctaU: "https://triaperformance.com/pt/all-access/",
        ctaB: "Prefere que a gente adapte isso à sua prova? Me escreva." },
}[LANG];

const OUT = process.argv.find((a) => a.endsWith(".pdf")) ||
  path.join(__dirname, "..", "site", "assets", "guias", MAGNET ? MAGNET_CHROME.file : DOC.filename);

const CHROME = {
  es: { kicker: "Guía Triaperformance", contents: "Contenido", cover: "Kit de Combustible" },
  en: { kicker: "Triaperformance Guide", contents: "Contents",  cover: "The Fuel Kit" },
  pt: { kicker: "Guia Triaperformance", contents: "Conteúdo",  cover: "Kit de Combustível" },
}[LANG];

const WARN = /^\s*⚠️/;
const slug = (s) => plain(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/* ------------------------------------------------------------- rendering */

function block(b) {
  switch (b.t) {
    case "h3": return `<h3>${inline(b.x.replace(WARN, "").trim())}</h3>`;
    case "h4": return `<h4>${inline(b.x)}</h4>`;
    case "p":  return `<p>${inline(b.x.replace(WARN, "").trim())}</p>`;
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
   section rather than written here, so the cover cannot contradict the text. */
const scopeParas = scope.blocks.filter((b) => b.t === "p" && !WARN.test(b.x));
// [0] is the "this is not medical advice" disclaimer; [1] is what the guide
// actually promises. The cover takes the promise — the disclaimer is three
// lines further in, in the scope box, where a reader is already reading.
const coverLede = MAGNET ? MAGNET_CHROME.lede : plain((scopeParas[1] || scopeParas[0] || { x: "" }).x);

const HTML = `<!doctype html>
<html lang="${LANG}"><head><meta charset="UTF-8"><style>
  :root{ --blue:#004aad; --blue-deep:#003a89; --ink:#1e2019; --white:#fff;
         --wash:#edf3fb; --slate:#565a52; --mist:#e4e6e1; }
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

  /* ---------- tables ---------- */
  table{width:100%;border-collapse:collapse;margin:4mm 0 5mm;font-size:9pt;page-break-inside:avoid}
  thead{display:table-header-group}
  th,td{border:1px solid var(--mist);padding:2.2mm 2.6mm;text-align:left;vertical-align:top;line-height:1.42}
  th{background:var(--wash);font-weight:700;color:var(--blue-deep)}
  tr{page-break-inside:avoid}

  /* ---------- callouts ---------- */
  .callout{background:var(--wash);border-left:2px solid var(--blue);border-radius:0 4px 4px 0;
           padding:4mm 5mm;margin:4.5mm 0;page-break-inside:avoid}
  .callout h3,.callout h4{margin-top:0}
  .callout p:last-child,.callout ul:last-child,.callout ol:last-child{margin-bottom:0}
  .callout--warn{border-left-color:var(--blue-deep);background:#e8f0fa}
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
