#!/usr/bin/env node
/**
 * build-runner-week-pdf.js — renders "La semana de fuerza del corredor" to a
 * branded PDF. This is the guide traded for an email on the public runner-core
 * page (/core-para-corredores/ + EN/PT siblings).
 *
 * Home doc:  lead-magnet-semana-de-fuerza.md
 * Copy:      automation/runner-week-content.js   (keyed by language)
 * Check:     data/members_exercises.csv          (read at build time)
 *
 * ⚠️ The six circuit exercises are not typed twice. The content file names them,
 * and THIS FILE FAILS THE BUILD if those names or their order disagree with
 * data/members_exercises.csv — which automation/extract-members-exercises.js
 * generates by evaluating the built page's own data script. So the guide cannot
 * describe a routine the athlete does not get. EN/PT are checked BY POSITION
 * against the same ids, with Spanish as the control (ai-infrastructure §44:
 * a literal-match map across languages is N chances to mistype a key, and a
 * mistyped key is a mapping that silently never fires).
 *
 * ⚠️ Typography is Archivo, embedded as a base64 woff2 from the site's own
 * subset — brand-guidelines.md §4 and reject-list item 1. The two older guide
 * builders still render in Helvetica; that predates v1.1 and is logged in
 * design-refresh-brief.md rather than fixed here.
 *
 * Usage:  node automation/build-runner-week-pdf.js [es|en|pt] [outfile.pdf]
 * Needs:  playwright + chromium.
 */

const fs = require("fs");
const path = require("path");

const CONTENT = require("./runner-week-content.js");
const LANG = (process.argv[2] || "es").toLowerCase();
const C = CONTENT[LANG];
if (!C) { console.error(`unknown language "${LANG}" — expected es | en | pt`); process.exit(2); }
const OUT = process.argv[3] || path.join(__dirname, "..", "site", "assets", "guias", C.filename);

/* --------------------------------------------- circuit check against the page */

function csvRows(file) {
  const text = fs.readFileSync(file, "utf8");
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift();
  return rows.filter((r) => r.length === head.length)
             .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

function checkCircuit() {
  const csv = path.join(__dirname, "..", "data", "members_exercises.csv");
  if (!fs.existsSync(csv)) {
    console.error(`data/members_exercises.csv is missing — run automation/extract-members-exercises.js first.`);
    process.exit(2);
  }
  const page = csvRows(csv).filter((r) => r.artifact === "Core del corredor");
  const ids = CONTENT.CIRCUIT_IDS;

  // 1. every circuit id exists on the built page, in the page's own order
  const pageIds = page.map((r) => r.exercise_id);
  const pageCircuit = pageIds.filter((id) => ids.includes(id));
  if (pageCircuit.join("|") !== ids.join("|")) {
    console.error(`circuit drift: the built page has [${pageCircuit.join(", ")}]`);
    console.error(`               the guide expects [${ids.join(", ")}]`);
    console.error(`Fix runner-week-content.js CIRCUIT_IDS, or the page moved and the guide is now wrong.`);
    process.exit(2);
  }

  // 2. this language carries the same ids, same order
  const mine = C.circuit.map((c) => c.id);
  if (mine.join("|") !== ids.join("|")) {
    console.error(`${LANG}: circuit ids are [${mine.join(", ")}], expected [${ids.join(", ")}]`);
    process.exit(2);
  }

  // 3. Spanish is the control: its names must match the page verbatim
  if (LANG === "es") {
    const byId = Object.fromEntries(page.map((r) => [r.exercise_id, r.name]));
    const bad = C.circuit.filter((c) => byId[c.id] !== c.name);
    if (bad.length) {
      bad.forEach((c) => console.error(`name drift on "${c.id}": page says "${byId[c.id]}", guide says "${c.name}"`));
      console.error(`The athlete's page is the source. Fix the guide, not the page.`);
      process.exit(2);
    }
  }
  return page;
}

checkCircuit();

/* ------------------------------------------------------------------ font */

const FONT = path.join(__dirname, "..", "site", "assets", "fonts", "archivo-var-latin.woff2");
if (!fs.existsSync(FONT)) { console.error(`Archivo subset missing at ${FONT} — reject-list item 1.`); process.exit(2); }
const FONT_B64 = fs.readFileSync(FONT).toString("base64");

/* -------------------------------------------------------------- template */

const P = C.prices, L = C.links;

const row = (cells, cls = "") => `<tr class="${cls}">${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;

const circuitTable = `
<table class="t t--circuit">
  <thead><tr><th>${C.s1.cols[0]}</th><th>${C.s1.cols[1]}</th></tr></thead>
  <tbody>
    ${C.circuit.map((e) => `<tr><td class="ex">${e.name}</td><td class="role">${e.role}</td></tr>`).join("")}
  </tbody>
</table>`;

const gapBlocks = C.s2.gaps.map((g, i) => `
  <div class="gap">
    <div class="gap-n">${i + 1}</div>
    <div class="gap-b">
      <h3>${g.h}</h3>
      <p>${g.body}</p>
      ${g.tool ? `<p class="gap-tool"><span class="pill">${C.labels.tool}</span> <strong>${g.tool}</strong> — ${g.note}</p>`
               : `<p class="gap-note">${g.note}</p>`}
    </div>
  </div>`).join("");

const weekGrid = `
<div class="grid-wrap">
  <table class="t t--week">
    <thead><tr><th></th>${C.s4.days.map((d) => `<th>${d}</th>`).join("")}</tr></thead>
    <tbody>
      ${C.s4.rows.map((r) => `<tr><th class="rl">${r.label}</th>${r.cells.map((c) => `<td class="${c === "—" ? "off" : "on"}">${c}</td>`).join("")}</tr>`).join("")}
    </tbody>
  </table>
</div>`;

const phaseTable = `
<table class="t t--phase">
  <thead><tr><th>${C.s5.phaseCols[0]}</th><th>${C.s5.phaseCols[1]}</th><th>${C.s5.phaseCols[2]}</th></tr></thead>
  <tbody>
    ${C.s5.phases.map((p) => `<tr><td class="pn">${p.n}</td><td class="ph"><strong>${p.h}</strong></td><td class="pd">${p.d}</td></tr>`).join("")}
  </tbody>
</table>`;

const HTML = `<!doctype html>
<html lang="${LANG}"><head><meta charset="UTF-8"><style>
  @font-face{font-family:"Archivo";src:url(data:font/woff2;base64,${FONT_B64}) format("woff2-variations");
             font-weight:400 700;font-stretch:100% 125%;font-style:normal}
  :root{
    --blue:#004aad; --blue-deep:#003a89; --ink:#1e2019; --white:#fff;
    --wash:#edf3fb; --slate:#565a52; --mist:#e4e6e1;
    --heat:#c2410c; --heat-wash:#fdf2ec;
  }
  @page { size: A4; margin: 16mm 15mm 18mm; }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Archivo","Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--ink);
       font-size:9.6pt;line-height:1.55;-webkit-font-smoothing:antialiased}
  em{font-style:italic}
  strong{font-weight:700}
  a{color:var(--blue);text-decoration:none}

  /* Sections may break across pages — forcing whole-section avoid pushed each one
     to a fresh page and left half-empty spreads. The blocks that must not split
     declare it themselves below. */
  section{margin-bottom:9mm}
  h2,h3{page-break-after:avoid}
  table.t,.dose,.three{page-break-inside:avoid}
  .kicker{font-size:8pt;font-weight:700;letter-spacing:.14em;color:var(--blue);
          display:block;margin-bottom:2mm;font-variant-numeric:tabular-nums}
  h2{font-size:19pt;font-weight:700;letter-spacing:-0.02em;line-height:1.1;margin-bottom:3.5mm;
     font-stretch:112%}
  h3{font-size:11pt;font-weight:700;letter-spacing:-0.01em;margin-bottom:1.4mm}
  p{margin-bottom:2.6mm;max-width:165mm}
  p.lead{font-size:10.4pt;color:var(--slate);margin-bottom:5mm}

  .callout{background:var(--wash);border-left:2px solid var(--blue);border-radius:0 4px 4px 0;
           padding:3.5mm 4mm;margin:4mm 0;font-size:9.4pt}
  .callout p:last-child{margin-bottom:0}

  /* ---------- cover ---------- */
  .cover{height:252mm;page-break-after:always;display:flex;flex-direction:column}
  .cover .wordmark{font-size:13pt;font-weight:700;letter-spacing:-0.01em;color:var(--blue)}
  .cover .cover-body{margin-top:auto}
  .cover .kicker{font-size:8.5pt;letter-spacing:.13em;margin-bottom:5mm}
  .cover h1{font-size:34pt;font-weight:700;letter-spacing:-0.028em;line-height:1.04;
            margin-bottom:4mm;font-stretch:112%;max-width:150mm}
  .cover .sub{font-size:13pt;color:var(--slate);margin-bottom:9mm;max-width:135mm}
  .cover .rule{height:3px;width:34mm;background:var(--heat);margin-bottom:9mm}
  .cover .lede{font-size:10.5pt;line-height:1.6;color:var(--slate);max-width:132mm}
  .cover .foot{margin-top:auto;font-size:8.5pt;color:var(--slate);
               border-top:1px solid var(--mist);padding-top:3mm}

  /* ---------- tables ---------- */
  table.t{width:100%;border-collapse:collapse;margin:3mm 0 4mm;font-size:9.2pt}
  table.t th{text-align:left;font-size:7.6pt;font-weight:700;letter-spacing:.1em;
             text-transform:uppercase;color:var(--slate);padding:0 4mm 1.6mm 0;
             border-bottom:1.4px solid var(--ink)}
  /* padding-right is load-bearing, not cosmetic: without it the phase table's
     8mm first header sat flush against the second and printed "FASE4 SEMANAS". */
  table.t td{padding:2.2mm 0;border-bottom:1px solid var(--mist);vertical-align:top}
  table.t--circuit td.ex{width:62mm;font-weight:700;padding-right:5mm}
  table.t--circuit td.role{color:var(--slate)}
  table.t--phase th:nth-child(1){width:8mm}
  table.t--phase th:nth-child(2){width:44mm}
  table.t--phase td.pn{width:8mm;font-weight:700;color:var(--blue);font-variant-numeric:tabular-nums}
  table.t--phase td.ph{width:44mm}
  table.t--phase td.pd{color:var(--slate);font-variant-numeric:tabular-nums}

  /* ---------- week grid ---------- */
  .grid-wrap{margin:4mm 0}
  table.t--week{table-layout:fixed;font-size:8.6pt;margin:0}
  table.t--week th{text-align:center;padding-bottom:1.8mm}
  table.t--week th.rl{text-align:left;font-size:8.6pt;text-transform:none;letter-spacing:0;
                      color:var(--ink);border-bottom:1px solid var(--mist);padding:2.4mm 3mm 2.4mm 0;width:24mm}
  table.t--week td{text-align:center;padding:2.4mm 1mm;font-variant-numeric:tabular-nums}
  table.t--week td.on{background:var(--wash);color:var(--blue);font-weight:700}
  table.t--week td.off{color:#b6bab2}

  /* ---------- dose ---------- */
  .dose{display:flex;gap:0;border-top:1.4px solid var(--ink);border-bottom:1.4px solid var(--ink);
        margin:3mm 0 4mm}
  .dose div{flex:1;padding:3.5mm 4mm 3.5mm 0}
  .dose div + div{border-left:1px solid var(--mist);padding-left:4mm}
  .dose .k{font-size:7.6pt;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
           color:var(--slate);display:block;margin-bottom:1.2mm}
  .dose .v{font-size:10pt;font-weight:700;line-height:1.3}

  /* ---------- gaps ---------- */
  .gap{display:flex;gap:4mm;margin-bottom:5mm;page-break-inside:avoid}
  .gap-n{flex:0 0 7mm;height:7mm;border-radius:50%;background:var(--ink);color:#fff;
         font-weight:700;font-size:9pt;display:flex;align-items:center;justify-content:center}
  .gap-b{flex:1}
  .gap-b p{margin-bottom:1.8mm}
  .gap-tool{font-size:8.8pt;color:var(--slate)}
  .gap-note{font-size:8.8pt;color:var(--slate);background:var(--wash);padding:2.6mm 3mm;
            border-radius:3px}
  .pill{display:inline-block;background:var(--blue);color:#fff;font-size:7pt;font-weight:700;
        letter-spacing:.08em;text-transform:uppercase;padding:.9mm 2mm;border-radius:2px;
        vertical-align:1px}

  /* ---------- rules / lists ---------- */
  ol.rules{list-style:none;counter-reset:r;margin:3mm 0 4mm}
  ol.rules li{counter-increment:r;position:relative;padding-left:8mm;margin-bottom:2.4mm}
  ol.rules li::before{content:counter(r);position:absolute;left:0;top:0;width:5mm;height:5mm;
    border-radius:50%;background:var(--wash);color:var(--blue);font-weight:700;font-size:7.6pt;
    display:flex;align-items:center;justify-content:center}

  ul.flags{list-style:none;margin:2.5mm 0 3mm}
  ul.flags li{position:relative;padding-left:6mm;margin-bottom:1.8mm}
  ul.flags li::before{content:"";position:absolute;left:0;top:1.9mm;width:2.4mm;height:2.4mm;
    background:var(--heat);border-radius:1px}

  /* ---------- three-up ---------- */
  .three{display:flex;gap:5mm;margin:3mm 0 4mm}
  .three > div{flex:1}
  .three h3{font-size:10pt;margin-bottom:1mm}
  .three p{font-size:8.8pt;color:var(--slate);margin:0}

  /* ---------- errors ---------- */
  .err{border-top:1px solid var(--mist);padding:3mm 0;page-break-inside:avoid}
  .err:first-child{border-top:1.4px solid var(--ink)}
  .err h3{margin-bottom:1mm}
  .err p{font-size:9.2pt;color:var(--slate);margin:0}

  /* ---------- red flag box ---------- */
  .flagbox{background:var(--heat-wash);border-left:2px solid var(--heat);border-radius:0 4px 4px 0;
           padding:4mm;margin:4mm 0;page-break-inside:avoid}
  .flagbox h3{color:var(--heat);margin-bottom:2mm}
  .flagbox p:last-child{margin-bottom:0;font-size:9pt}

  /* ---------- cta ---------- */
  .cta{page-break-before:always}
  .cta h2{font-size:22pt;margin-bottom:4mm}
  .offers{display:flex;gap:5mm;margin:6mm 0 5mm;align-items:stretch}
  .offer{flex:1;border:1px solid var(--mist);border-radius:6px;padding:5mm;display:flex;flex-direction:column}
  .offer--primary{border:1.5px solid var(--blue);background:var(--wash)}
  .offer .tag{font-size:7.4pt;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
              color:var(--blue);margin-bottom:2mm;display:block}
  .offer h3{font-size:13pt;margin-bottom:1.5mm}
  .offer .price{font-size:17pt;font-weight:700;color:var(--blue);white-space:nowrap;
                margin-bottom:2.5mm;font-variant-numeric:tabular-nums;font-stretch:112%}
  .offer .price small{font-size:9pt;font-weight:400;color:var(--slate)}
  .offer > p{font-size:8.9pt;color:var(--slate)}
  .offer ul{list-style:none;margin:2.5mm 0 0;font-size:8.6pt}
  .offer ul li{position:relative;padding-left:4.5mm;margin-bottom:1.4mm}
  .offer ul li::before{content:"";position:absolute;left:0;top:1.7mm;width:2mm;height:2mm;
    background:var(--blue);border-radius:50%}
  .offer .btn{margin-top:auto}
  .btn{display:inline-block;background:var(--blue);color:#fff;text-decoration:none;
       font-weight:700;font-size:9pt;padding:2.6mm 5mm;border-radius:4px;margin-top:4mm}
  .btn--ghost{background:transparent;color:var(--ink);border:1.5px solid var(--ink)}
  .cta-foot{font-size:8.8pt;color:var(--slate);border-top:1px solid var(--mist);padding-top:3mm}
</style></head><body>

<!-- 1 · cover -->
<div class="cover">
  <div class="wordmark">Triaperformance</div>
  <div class="cover-body">
    <span class="kicker">${C.cover.kicker}</span>
    <h1>${C.cover.h1}</h1>
    <p class="sub">${C.cover.sub}</p>
    <div class="rule"></div>
    <p class="lede">${C.cover.lede}</p>
  </div>
  <div class="foot">${C.cover.foot}</div>
</div>

<!-- 2 · what you just trained -->
<section>
  <span class="kicker">${C.s1.kicker}</span>
  <h2>${C.s1.h2}</h2>
  <p class="lead">${C.s1.intro}</p>
  ${circuitTable}
  <div class="callout"><p>${C.s1.note}</p></div>
</section>

<!-- 3 · what it doesn't -->
<section>
  <span class="kicker">${C.s2.kicker}</span>
  <h2>${C.s2.h2}</h2>
  <p class="lead">${C.s2.intro}</p>
  ${gapBlocks}
</section>

<!-- 4 · dose -->
<section>
  <span class="kicker">${C.s3.kicker}</span>
  <h2>${C.s3.h2}</h2>
  <div class="dose">
    ${C.s3.dose.map((d) => `<div><span class="k">${d.k}</span><span class="v">${d.v}</span></div>`).join("")}
  </div>
  <p>${C.s3.body}</p>
  <div class="callout"><p>${C.s3.callout}</p></div>
</section>

<!-- 5 · the week -->
<section>
  <span class="kicker">${C.s4.kicker}</span>
  <h2>${C.s4.h2}</h2>
  <p class="lead">${C.s4.intro}</p>
  <ol class="rules">${C.s4.rules.map((r) => `<li>${r}</li>`).join("")}</ol>
  <h3>${C.s4.gridTitle}</h3>
  ${weekGrid}
  <p>${C.s4.caveat}</p>
  <div class="callout"><p>${C.s4.constraint}</p></div>
</section>

<!-- 6 · what strength buys -->
<section>
  <span class="kicker">${C.s5.kicker}</span>
  <h2>${C.s5.h2}</h2>
  <div class="three">
    ${C.s5.buys.map((b) => `<div><h3>${b.h}</h3><p>${b.body}</p></div>`).join("")}
  </div>
  <p>${C.s5.notWatts}</p>
  <h3>${C.s5.phasesTitle}</h3>
  ${phaseTable}
  <p>${C.s5.blockNote}</p>
  <h3>${C.s5.noHyperTitle}</h3>
  <p>${C.s5.noHyper}</p>
  <h3>${C.s5.maintTitle}</h3>
  <p>${C.s5.maint}</p>
</section>

<!-- 7 · errors -->
<section>
  <span class="kicker">${C.s6.kicker}</span>
  <h2>${C.s6.h2}</h2>
  ${C.s6.errors.map((e) => `<div class="err"><h3>${e.h}</h3><p>${e.body}</p></div>`).join("")}
</section>

<!-- 8 · pain -->
<section>
  <span class="kicker">${C.s7.kicker}</span>
  <h2>${C.s7.h2}</h2>
  <div class="dose">
    ${C.s7.rules.map((r) => `<div><span class="k">${r.k}</span><span class="v">${r.v}</span></div>`).join("")}
  </div>
  <div class="flagbox">
    <h3>${C.s7.flagsTitle}</h3>
    <ul class="flags">${C.s7.flags.map((f) => `<li>${f}</li>`).join("")}</ul>
    <p>${C.s7.disclaimer}</p>
  </div>
</section>

<!-- 9 · cta -->
<section class="cta">
  <h2>${C.cta.headline}</h2>
  <p class="lead">${C.cta.lead}</p>
  <div class="offers">
    <div class="offer offer--primary">
      <span class="tag">${C.cta.allAccess.tag}</span>
      <h3>${C.cta.allAccess.name}</h3>
      <div class="price">US$ ${P.allAccess}<small>${C.cta.perMonth}</small></div>
      <p>${C.cta.allAccess.body}</p>
      <ul>${C.cta.allAccess.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
      <a class="btn" href="${L.allAccess}">${C.cta.allAccess.button}</a>
    </div>
    <div class="offer">
      <span class="tag">${C.cta.coaching.tag}</span>
      <h3>${C.cta.coaching.name}</h3>
      <div class="price">US$ ${P.coaching}<small>${C.cta.perMonth}</small></div>
      <p>${C.cta.coaching.body}</p>
      <a class="btn btn--ghost" href="${L.coaching}">${C.cta.coaching.button}</a>
    </div>
  </div>
  <p class="cta-foot">${C.cta.foot}</p>
</section>

</body></html>`;

/* ----------------------------------------------------------------- build */

(async () => {
  let chromium;
  try { ({ chromium } = require("playwright")); }
  catch (e) { console.error("playwright missing — npm i -D playwright && npx playwright install chromium"); process.exit(2); }

  /* CHROMIUM_PATH lets a machine point at a browser Playwright did not download
     itself — a pinned build in a container, or a local Chrome. Without it the
     default applies, which is what runs on Iván's laptop. */
  const exe = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage();
  await page.setContent(HTML, { waitUntil: "networkidle" });
  await page.pdf({
    path: OUT,
    format: "A4",
    printBackground: true,
    margin: { top: "16mm", right: "15mm", bottom: "18mm", left: "15mm" },
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate:
      `<div style="width:100%;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:7pt;color:#565a52;
        padding:0 15mm;display:flex;justify-content:space-between;">
        <span>Triaperformance · ${C.cover.h1}</span>
        <span class="pageNumber"></span></div>`,
  });
  await browser.close();
  console.log(`PDF written: ${OUT}  (${LANG}, circuit verified against the built page)`);
})();
