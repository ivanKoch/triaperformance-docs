#!/usr/bin/env node
/**
 * build-zones-guide-pdf.js — renders "Los dos umbrales y el problema de la
 * Zona 2" to a branded PDF. This is the guide sent to every contact-form
 * prospect and every CoachMatch lead.
 *
 * Home doc:  lead-magnet-zonas-de-entrenamiento.md
 * Copy:      automation/zones-guide-content.js  (keyed by language)
 * Numbers:   data/zones.csv                     (read at build time)
 *
 * ⚠️ There is not a single zone percentage in this file or in the content file.
 * Every band, every axis tick and every figure boundary is computed from
 * data/zones.csv at render time. The version of this PDF that shipped before
 * September 2026 was a fifth hand-typed copy of the zone model and it had
 * drifted from the calculator — that is the specific failure this design
 * makes impossible.
 *
 * Design: deliberately the same system as build-lead-magnet-pdf.js (white
 * typographic cover per brand-guidelines §6, --wash tint and --blue-deep
 * marker on zones X and Y, page-break-inside:avoid on the CTA). The CSS tokens
 * are duplicated rather than shared: extracting a common stylesheet means
 * touching the live sessions-guide builder, which is logged in open-loops.md
 * rather than done here.
 *
 * Usage:  node automation/build-zones-guide-pdf.js [es|en|pt] [outfile.pdf]
 * Needs:  playwright + chromium.
 */

const fs = require("fs");
const path = require("path");

const LANG = (process.argv[2] || "es").toLowerCase();
const C = require("./zones-guide-content.js")[LANG];
if (!C) { console.error(`unknown language "${LANG}" — expected es | en | pt`); process.exit(2); }
const OUT = process.argv[3] || path.join(__dirname, "..", "site", "assets", "guias", C.filename);

/* ------------------------------------------------- zones.csv → geometry */

const CSV = path.join(__dirname, "..", "data", "zones.csv");
const ORDER = ["1", "2", "X", "3", "Y", "4", "5"];

function readBands() {
  const rows = fs.readFileSync(CSV, "utf8").trim().split("\n").slice(1)
    .map((l) => l.split(","))
    .filter((r) => r[0] === "running" && r[1] === "lthr");
  const by = Object.fromEntries(rows.map((r) => [r[2], { floor: +r[3], ceil: +r[4] }]));
  const missing = ORDER.filter((z) => !by[z]);
  if (missing.length) { console.error(`zones.csv is missing running/lthr zones: ${missing}`); process.exit(2); }
  return by;
}

const B = readBands();

/* The two anchors, derived rather than typed:
   LT2 is the threshold itself — the ceiling of Zone 3, where Zone Y begins.
   LT1 is the ceiling of Zone 2, where Zone X begins. That equivalence is an
   approximation (LT1 lands ~85–95% of threshold depending on the athlete) and
   the copy says so; it is not presented as arithmetic. */
const LT1 = B["2"].ceil;
const LT2 = B["3"].ceil;
const LOW = B["1"].floor;
const HIGH = B["5"].ceil;

const AXIS_MIN = LOW - 2;
const AXIS_MAX = HIGH + 2;
const pos = (v) => ((v - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100;
const span = (a, b) => `left:${pos(a).toFixed(3)}%;width:${(pos(b) - pos(a)).toFixed(3)}%`;
const segSpan = (ids) => span(B[ids[0]].floor, B[ids[ids.length - 1]].ceil);

const TICKS = [...new Set([LOW, B["2"].floor, LT1, B["3"].floor, LT2, B["4"].floor, B["5"].floor, HIGH])]
  .sort((a, b) => a - b);

/* -------------------------------------------------------------- figures */

const F = C.fig;

const figCurve = `
<figure class="fig fig--curve">
  <svg viewBox="0 0 600 250" width="100%" role="img">
    <text x="8" y="120" class="ax" transform="rotate(-90 8 120)" text-anchor="middle">${F.curve.y}</text>
    <line x1="55" y1="18" x2="55" y2="222" class="axis"/>
    <line x1="55" y1="222" x2="585" y2="222" class="axis"/>
    <line x1="55" y1="203" x2="250" y2="203" class="dash"/>
    <text x="60" y="216" class="tiny">${F.curve.base}</text>
    <path d="M60,205 C130,204 180,203 232,197 C300,189 362,174 420,149 C482,120 528,82 566,34"
          class="curve"/>
    <line x1="232" y1="197" x2="232" y2="222" class="drop"/>
    <line x1="420" y1="149" x2="420" y2="222" class="drop"/>
    <circle cx="232" cy="197" r="5" class="dot"/>
    <circle cx="420" cy="149" r="5" class="dot"/>
    <text x="232" y="176" class="lab" text-anchor="middle">${F.curve.lt1}</text>
    <text x="420" y="128" class="lab" text-anchor="middle">${F.curve.lt2}</text>
    <text x="320" y="243" class="ax" text-anchor="middle">${F.curve.x}</text>
  </svg>
  <figcaption>${F.curve.caption}</figcaption>
</figure>`;

const S = F.stack;

function stackRow(label, cells, cls = "") {
  return `<div class="sf-row ${cls}">
    <div class="sf-lab">${label}</div>
    <div class="sf-plot">${cells}</div>
  </div>`;
}

const figStack = `
<figure class="fig">
  <div class="sf">
    <div class="sf-marks">
      <div class="sf-mark" style="left:${pos(LT1).toFixed(3)}%"><span>LT1</span></div>
      <div class="sf-mark" style="left:${pos(LT2).toFixed(3)}%"><span>LT2</span></div>
    </div>

    ${stackRow(S.rows.three, `
      <div class="band b-low"  style="${span(LOW, LT1)}">${S.three[0]}</div>
      <div class="band b-hole" style="${span(LT1, LT2)}">${S.three[1]}</div>
      <div class="band b-high" style="${span(LT2, HIGH)}">${S.three[2]}</div>`, "sf-row--tall")}

    ${stackRow(S.rows.seven, ORDER.map((z) => {
      const sp = (z === "X" || z === "Y") ? " band--special" : "";
      return `<div class="band b-zone${sp}" style="${span(B[z].floor, B[z].ceil)}">${z}</div>`;
    }).join(""), "sf-row--tall")}

    ${stackRow(S.rows.rpe, S.rpeSegs.map(([ids, t]) =>
      `<div class="band b-plain" style="${segSpan(ids)}">${t}</div>`).join(""))}

    ${stackRow(S.rows.tte, S.tteSegs.map(([ids, t]) =>
      `<div class="band b-plain" style="${segSpan(ids)}">${t}</div>`).join(""))}

    ${stackRow(S.rows.session, S.sessionSegs.map(([ids, t]) =>
      `<div class="band b-plain" style="${segSpan(ids)}">${t}</div>`).join(""))}

    ${stackRow("", TICKS.map((t) =>
      `<div class="tick" style="left:${pos(t).toFixed(3)}%">${t}</div>`).join(""), "sf-row--ticks")}
    ${stackRow("", `<div class="sf-axlab">${S.axis}</div>`, "sf-row--axlab")}
  </div>
  <figcaption>${S.caption}</figcaption>
</figure>`;

const O = F.overlap;
const figOverlap = `
<figure class="fig fig--tight">
  <div class="sf sf--ov">
    <div class="sf-marks">
      <div class="sf-mark" style="left:${pos(LT1).toFixed(3)}%"><span>LT1</span></div>
      <div class="sf-mark" style="left:${pos(LT2).toFixed(3)}%"><span>LT2</span></div>
    </div>
    ${stackRow(O.ours, `<div class="band b-ours" style="${span(B["2"].floor, B["2"].ceil)}">${O.oursNote}</div>`, "sf-row--ov")}
    ${stackRow(O.seiler, `<div class="band b-hole" style="${span(LT1, LT2)}">${O.seilerNote}</div>`, "sf-row--ov")}
    ${stackRow("", TICKS.map((t) =>
      `<div class="tick" style="left:${pos(t).toFixed(3)}%">${t}</div>`).join(""), "sf-row--ticks")}
  </div>
  <figcaption>${O.caption} ${O.note}</figcaption>
</figure>`;

/* ------------------------------------------------------------- template */

const T = C.thresholds, K = C.stack, P = C.problem, TS = C.tests, R = C.rpe, TK = C.talk, PR = C.practice;
const CTA = C.cta, PRICES = C.prices, LINKS = C.links, L = C.labels;

const HTML = `<!DOCTYPE html>
<html lang="${LANG}"><head><meta charset="UTF-8"><style>
  :root{
    --blue:#004aad; --blue-deep:#003a89; --ink:#1e2019; --white:#fff;
    --wash:#edf3fb; --slate:#565a52; --mist:#e4e6e1; --hole:#d8e2f0;
  }
  @page { size: A4; margin: 16mm 15mm 18mm; }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--ink);
       font-size:10.5pt;line-height:1.55;-webkit-font-smoothing:antialiased}
  strong{font-weight:700}
  em{font-style:italic}
  .page{page-break-before:always;padding-top:2mm}
  .eyebrow{display:block;font-size:8pt;font-weight:700;text-transform:uppercase;
           letter-spacing:.12em;color:var(--blue);margin-bottom:2mm}
  h2.sec{font-size:24pt;font-weight:700;letter-spacing:-0.02em;line-height:1.06;margin-bottom:4mm}
  p.lede{color:var(--slate);max-width:158mm;margin-bottom:6mm}

  /* rows — same pattern as the sessions guide's intro block */
  .row{margin-bottom:3.2mm;padding-bottom:3.2mm;border-bottom:1px solid var(--mist)}
  .row:last-child{border-bottom:0;padding-bottom:0;margin-bottom:0}
  .row h4{font-size:11pt;font-weight:700;margin-bottom:1.4mm}
  .row p{color:var(--slate);font-size:10pt;line-height:1.52}

  .callout{background:var(--wash);border-left:2px solid var(--blue);border-radius:0 4px 4px 0;
           padding:4mm 5mm;margin-top:4.5mm}
  .callout-t{font-weight:700;font-size:9.5pt;margin-bottom:1.5mm}
  .callout p{font-size:9.5pt;color:var(--slate)}

  /* ---------- cover ---------- */
  .cover{height:255mm;page-break-after:always;display:flex;flex-direction:column}
  .cover .wordmark{font-size:14pt;font-weight:700;letter-spacing:-0.01em;color:var(--blue)}
  .cover .cover-body{margin-top:auto}
  .cover .kicker{font-size:8.5pt;font-weight:700;text-transform:uppercase;
                 letter-spacing:.13em;color:var(--blue);display:block;margin-bottom:5mm}
  .cover h1{font-size:33pt;font-weight:700;letter-spacing:-0.02em;line-height:1.06;margin-bottom:4mm}
  .cover .sub{font-size:13pt;color:var(--slate);margin-bottom:10mm}
  .zonestrip{display:flex;gap:2mm;margin-bottom:10mm}
  .zonestrip div{flex:1;text-align:center;padding:3mm 0;border:1px solid var(--mist);
                 border-radius:3px;font-size:10pt;font-weight:700;color:var(--slate)}
  .zonestrip div.hl{background:var(--wash);border-color:var(--blue);color:var(--blue)}
  .cover .lede{font-size:10.5pt;line-height:1.6;color:var(--slate);max-width:130mm;
               border-top:1px solid var(--mist);padding-top:6mm;margin-bottom:0}
  .cover .foot{margin-top:auto;font-size:8.5pt;color:var(--slate);
               border-top:1px solid var(--mist);padding-top:4mm}

  /* ---------- figures ---------- */
  figure.fig{margin:6mm 0 5mm;page-break-inside:avoid}
  figure.fig--tight{margin:5mm 0 4mm}
  figure.fig--curve{margin:5mm 0 4mm}
  figure.fig--curve svg{display:block;width:87%;margin:0 auto}
  figcaption{font-size:8pt;color:var(--slate);margin-top:2.5mm;font-style:italic}
  svg .axis{stroke:var(--ink);stroke-width:1.2;fill:none}
  svg .dash{stroke:var(--mist);stroke-width:1.4;stroke-dasharray:4 4}
  svg .drop{stroke:var(--blue);stroke-width:1;stroke-dasharray:3 3;opacity:.55}
  svg .curve{stroke:var(--blue);stroke-width:2.6;fill:none;stroke-linecap:round}
  svg .dot{fill:var(--blue)}
  svg .lab{font:700 15px "Helvetica Neue",Helvetica,Arial;fill:var(--blue)}
  svg .ax{font:600 12px "Helvetica Neue",Helvetica,Arial;fill:var(--slate)}
  svg .tiny{font:400 11px "Helvetica Neue",Helvetica,Arial;fill:var(--slate)}

  /* the stacked-axis figure */
  .sf{position:relative}
  .sf-row{display:flex;align-items:stretch;height:7mm;margin-bottom:1.1mm}
  .sf-row--tall{height:9mm}
  .sf-row--tag{height:4mm;margin-bottom:1.6mm}
  .sf-row--ticks{height:5mm;margin-bottom:0}
  .sf-row--axlab{height:5mm;margin-bottom:0}
  .sf-lab{flex:0 0 25mm;padding-right:3mm;text-align:right;font-size:7.5pt;font-weight:700;
          line-height:1.15;color:var(--ink);align-self:center}
  .sf-lab span{display:block;font-weight:400;color:var(--slate);font-size:6.8pt}
  .sf-plot{position:relative;flex:1}
  .band{position:absolute;top:0;bottom:0;display:flex;align-items:center;justify-content:center;
        border-radius:2px;font-size:8pt;text-align:center;overflow:hidden;white-space:nowrap;padding:0 .6mm}
  .b-low{background:var(--wash);color:var(--blue);font-weight:700;border:1px solid #cfe0f4}
  .b-hole{background:var(--hole);color:var(--blue-deep);font-weight:700;border:1px solid #b9cde6}
  .b-high{background:var(--blue);color:#fff;font-weight:700}
  .b-zone{background:#fff;border:1px solid var(--mist);color:var(--ink);font-weight:700;font-size:8.5pt}
  .band--special{background:var(--wash);border-color:var(--blue-deep);color:var(--blue-deep)}
  .b-plain{background:transparent;border-left:1px solid var(--mist);color:var(--slate);
           font-size:7.2pt;justify-content:center}
  .b-ours{background:var(--wash);color:var(--blue);font-weight:700;border:1px solid #cfe0f4;font-size:8pt}
  .hole-tag{position:absolute;top:0;bottom:0;display:flex;align-items:center;justify-content:center;
            font-size:6.8pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
            color:var(--blue-deep)}
  .tick{position:absolute;top:0;transform:translateX(-50%);font-size:6.8pt;color:var(--slate);
        font-variant-numeric:tabular-nums}
  .sf-axlab{position:absolute;left:0;right:0;text-align:center;font-size:7pt;color:var(--slate);
            text-transform:uppercase;letter-spacing:.07em}
  .sf-marks{position:absolute;left:25mm;right:0;top:0;bottom:10mm;pointer-events:none}
  .sf--ov .sf-marks{left:28mm;bottom:5mm}
  .sf--ov .sf-lab{flex:0 0 28mm;font-size:8.5pt;line-height:1.2}
  .sf-row--ov{height:11mm}
  .sf-mark{position:absolute;top:-3.5mm;bottom:0;border-left:1.4px dashed var(--blue);transform:translateX(-0.7px)}
  .sf-mark span{position:absolute;top:-1mm;left:1mm;font-size:6.8pt;font-weight:700;color:var(--blue)}

  /* ---------- quote pair (page 4) ---------- */
  .pair{display:flex;gap:6mm;margin-bottom:5mm}
  .pair .col{flex:1;border:1px solid var(--mist);border-radius:5px;padding:4mm 4.5mm}
  .pair .col h4{font-size:11pt;font-weight:700;margin-bottom:2mm;line-height:1.2}
  .pair .col p{font-size:9pt;color:var(--slate);line-height:1.5}

  /* ---------- tables ---------- */
  table.t{width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:5mm}
  table.t th{text-align:left;font-size:7.5pt;text-transform:uppercase;letter-spacing:.06em;
             color:var(--slate);font-weight:700;padding:0 3mm 2mm 0;border-bottom:1px solid var(--mist)}
  table.t td{padding:2.6mm 3mm 2.6mm 0;border-bottom:1px solid var(--mist);vertical-align:top}
  table.t td:first-child{font-weight:700;white-space:nowrap}
  table.t td:last-child{color:var(--slate);padding-right:0}
  table.t--talk{margin-top:3mm;margin-bottom:0}
  table.t--talk td.rpe{width:18mm;color:var(--blue);font-size:10pt}
  table.t--talk td.feel{font-weight:400;color:var(--ink);white-space:normal}
  table.t--talk td.zc{width:14mm;text-align:right}
  .zchip{display:inline-flex;align-items:center;justify-content:center;width:6.5mm;height:6.5mm;
         border-radius:50%;background:var(--blue);color:#fff;font-weight:700;font-size:8.5pt}
  .zchip--special{background:var(--blue-deep)}

  /* ---------- two-up blocks (page 6) ---------- */
  .block{border-top:1px solid var(--mist);padding-top:4mm;margin-top:4mm}
  .block:first-of-type{border-top:0;padding-top:0;margin-top:0}
  .block h3{font-size:13pt;font-weight:700;margin-bottom:2mm}
  .block p{color:var(--slate);font-size:10pt;margin-bottom:2.5mm}
  .block p:last-child{margin-bottom:0}

  /* ---------- who ---------- */
  .who{margin-top:5mm;border-top:1px solid var(--mist);padding-top:3.5mm}
  .who p{color:var(--slate);margin-bottom:2.5mm;max-width:158mm;font-size:9.5pt;line-height:1.5}
  .stats{display:flex;gap:9mm;margin:3mm 0 2.5mm}
  .stat .v{font-size:18pt;font-weight:700;color:var(--blue);line-height:1}
  .stat .k{font-size:8pt;text-transform:uppercase;letter-spacing:.08em;color:var(--slate);margin-top:1mm}
  .quotes{display:flex;gap:7mm;margin-top:2mm}
  .quote{flex:1}
  .quote p{font-size:9pt;color:var(--ink);margin-bottom:1.2mm;line-height:1.45}
  .quote .who-q{font-size:7.5pt;color:var(--slate)}
  .quote{page-break-inside:avoid}

  /* ---------- CTA — must land on one page (see sessions guide) ---------- */
  .cta{page-break-before:always;page-break-inside:avoid;padding-top:0}
  .cta h2{font-size:21pt;font-weight:700;letter-spacing:-0.02em;line-height:1.06;margin-bottom:2.5mm}
  .cta .lead{color:var(--slate);max-width:155mm;margin-bottom:5mm;font-size:10pt}
  .offer{border:1px solid var(--mist);border-radius:6px;padding:5mm;margin-bottom:3.5mm}
  .offer--primary{border:1.5px solid var(--blue);background:var(--wash)}
  .offer .tag{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.09em;
              color:var(--blue);margin-bottom:1.5mm}
  .offer h3{font-size:15pt;font-weight:700;margin-bottom:1mm}
  .offer .price{font-size:15pt;font-weight:700;color:var(--blue);white-space:nowrap}
  .offer-top{display:flex;justify-content:space-between;align-items:baseline;gap:6mm}
  .offer p{font-size:9.5pt;color:var(--slate);margin:1.5mm 0 2.5mm;max-width:140mm}
  .offer ul{margin:0 0 2.5mm 4.5mm;font-size:9.5pt}
  .offer li{margin-bottom:0.6mm}
  .btn{display:inline-block;background:var(--blue);color:#fff;text-decoration:none;
       font-weight:700;font-size:9.5pt;padding:2.8mm 6mm;border-radius:4px}
  .btn--ghost{background:transparent;color:var(--ink);border:1.5px solid var(--ink)}
  .cta-foot{margin-top:4mm;border-top:1px solid var(--mist);padding-top:3mm;
            font-size:8.5pt;color:var(--slate)}
  .cta-foot a{color:var(--blue)}
</style></head><body>

<!-- 1 · cover -->
<div class="cover">
  <div class="wordmark">Triaperformance</div>
  <div class="cover-body">
    <span class="kicker">${C.cover.kicker}</span>
    <h1>${C.cover.title}</h1>
    <div class="sub">${C.cover.sub}</div>
    <div class="zonestrip">
      ${ORDER.map((z) => `<div${z === "X" || z === "Y" ? ' class="hl"' : ""}>${z}</div>`).join("")}
    </div>
    <div class="lede">${C.cover.lede}</div>
  </div>
  <div class="foot">Iván Koch · triaperformance.com</div>
</div>

<!-- 2 · the two thresholds -->
<div class="page">
  <span class="eyebrow">${T.eyebrow}</span>
  <h2 class="sec">${T.title}</h2>
  <p class="lede">${T.lede}</p>
  ${figCurve}
  ${T.rows.map(([h, p]) => `<div class="row"><h4>${h}</h4><p>${p}</p></div>`).join("")}
  <div class="callout"><div class="callout-t">${T.anchor.title}</div><p>${T.anchor.body}</p></div>
</div>

<!-- 3 · the stack -->
<div class="page">
  <span class="eyebrow">${K.eyebrow}</span>
  <h2 class="sec">${K.title}</h2>
  <p class="lede">${K.lede}</p>
  ${figStack}
  ${K.notes.map(([h, p]) => `<div class="row"><h4>${h}</h4><p>${p}</p></div>`).join("")}
  <div class="callout"><p>${K.foot}</p></div>
</div>

<!-- 4 · the zone 2 problem -->
<div class="page">
  <span class="eyebrow">${P.eyebrow}</span>
  <h2 class="sec">${P.title}</h2>
  <p class="lede">${P.lede}</p>
  <div class="pair">
    ${P.quotes.map(([h, p]) => `<div class="col"><h4>${h}</h4><p>${p}</p></div>`).join("")}
  </div>
  ${figOverlap}
  <div class="callout"><div class="callout-t">${P.resolution.title}</div><p>${P.resolution.body}</p></div>
  <div class="row" style="margin-top:6mm;border-top:1px solid var(--mist);padding-top:4mm">
    <h4>${P.rule.title}</h4><p>${P.rule.body}</p>
  </div>
</div>

<!-- 5 · tests -->
<div class="page">
  <span class="eyebrow">${TS.eyebrow}</span>
  <h2 class="sec">${TS.title}</h2>
  <p class="lede">${TS.lede}</p>
  <table class="t">
    <thead><tr>${TS.cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${TS.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>
  <div class="row"><h4>${TS.hygiene.title}</h4><p>${TS.hygiene.body}</p></div>
  <div class="callout"><div class="callout-t">${TS.calc.title}</div><p>${TS.calc.body}</p></div>
</div>

<!-- 6 · RPE + TTE -->
<div class="page">
  <span class="eyebrow">${R.eyebrow}</span>
  <h2 class="sec">${R.title}</h2>
  <div class="block">
    <h3>${R.rpe.title}</h3>
    <p>${R.rpe.body}</p><p>${R.rpe.use}</p><p>${R.rpe.test}</p>
  </div>
  <div class="block">
    <h3>${R.tte.title}</h3>
    <p>${R.tte.body}</p><p>${R.tte.why}</p>
  </div>
  <div class="block">
    <h3>${TK.title}</h3>
    <p>${TK.lede}</p>
    <table class="t t--talk">
      <thead><tr>${TK.cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
      <tbody>${TK.rows.map(([r, f, z]) => `<tr>
        <td class="rpe">${r}</td><td class="feel">${f}</td>
        <td class="zc"><span class="zchip${z === "X" || z === "Y" ? " zchip--special" : ""}">${z}</span></td>
      </tr>`).join("")}</tbody>
    </table>
  </div>
</div>

<!-- 7 · what we do with it -->
<div class="page">
  <span class="eyebrow">${PR.eyebrow}</span>
  <h2 class="sec">${PR.title}</h2>
  <p class="lede">${PR.lede}</p>
  ${PR.rows.map(([h, p]) => `<div class="row"><h4>${h}</h4><p>${p}</p></div>`).join("")}
  <div class="callout"><div class="callout-t">${PR.bridge.title}</div><p>${PR.bridge.body}</p></div>

  <div class="who">
    <h2 class="sec" style="font-size:15pt;margin-bottom:2.5mm">${L.whoWeAre}</h2>
    ${C.who.body.map((p) => `<p>${p}</p>`).join("")}
    <div class="stats">
      ${C.who.stats.map(([v, k]) => `<div class="stat"><div class="v">${v}</div><div class="k">${k}</div></div>`).join("")}
    </div>
    <div class="quotes">
      ${C.quotes.map(([q, n, c]) => `<div class="quote"><p>“${q}”</p><div class="who-q">${n} · ${c}</div></div>`).join("")}
    </div>
  </div>
</div>

<!-- 8 · CTA -->
<div class="cta">
  <span class="eyebrow">${L.nextStep}</span>
  <h2>${CTA.headline}</h2>
  <p class="lead">${CTA.lead}</p>

  <div class="offer offer--primary">
    <div class="offer-top">
      <div><div class="tag">${CTA.allAccess.tag}</div><h3>${CTA.allAccess.name}</h3></div>
      <div class="price">US$ ${PRICES.allAccess}<span style="font-size:9pt;font-weight:400;color:var(--slate)">${CTA.perMonth}</span></div>
    </div>
    <p>${CTA.allAccess.body}</p>
    <ul>${CTA.allAccess.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
    <a class="btn" href="${LINKS.allAccess}">${CTA.allAccess.button}</a>
  </div>

  <div class="offer">
    <div class="offer-top">
      <div><div class="tag">${CTA.coaching.tag}</div><h3>${CTA.coaching.name}</h3></div>
      <div class="price">US$ ${PRICES.coaching}<span style="font-size:9pt;font-weight:400;color:var(--slate)">${CTA.perMonth}</span></div>
    </div>
    <p>${CTA.coaching.body}</p>
    <a class="btn btn--ghost" href="${LINKS.coaching}">${CTA.coaching.button}</a>
  </div>

  <div class="offer">
    <div class="offer-top">
      <div><div class="tag">${CTA.plans.tag}</div><h3>${CTA.plans.name}</h3></div>
      <div class="price">${CTA.plans.price}</div>
    </div>
    <p>${CTA.plans.body}</p>
    <a class="btn btn--ghost" href="${LINKS.plans}">${CTA.plans.button}</a>
  </div>

  <div class="cta-foot">${CTA.foot}</div>
</div>

</body></html>`;

/* ----------------------------------------------------------------- build */

(async () => {
  let chromium;
  try { ({ chromium } = require("playwright")); }
  catch (e) { console.error("playwright missing — npm i -D playwright && npx playwright install chromium"); process.exit(2); }

  const browser = await chromium.launch();
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
      `<div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:7pt;color:#565a52;
        padding:0 15mm;display:flex;justify-content:space-between;">
        <span>Triaperformance · ${C.footerTitle}</span>
        <span class="pageNumber"></span></div>`,
  });
  await browser.close();
  console.log(`PDF written: ${OUT}  (LT1=${LT1}%  LT2=${LT2}%  axis ${AXIS_MIN}–${AXIS_MAX}%)`);
})();
