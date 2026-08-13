#!/usr/bin/env node
/**
 * build-lead-magnet-pdf.js — renders "Las sesiones que hacen crecer cada zona"
 * to a branded PDF.
 *
 * Content source: lead-magnet-sesiones-por-zona.md (the home doc). The session
 * text lives in the DATA block below rather than being parsed out of the
 * markdown — parsing prose to rebuild prose is fragile, and this file is the
 * thing that actually ships. If the two disagree, the markdown is the doc and
 * this is the artefact; fix both in the same session.
 *
 * Zone percentages are copies of data/zones.csv (see the standing rule in the
 * home doc). Prices are copies of triaperformance-pricing-and-positioning.md.
 *
 * Usage:  node automation/build-lead-magnet-pdf.js [es|en|pt] [outfile.pdf]
 * Needs:  npx playwright install chromium
 */

const path = require("path");
const LANG = (process.argv[2] || "es").toLowerCase();
const C = require("./lead-magnet-content.js")[LANG];
if (!C) { console.error(`unknown language "${LANG}" — expected es | en | pt`); process.exit(2); }
const OUT = process.argv[3] || path.join(__dirname, "..", "site", "assets", "guias", C.filename);

/* ------------------------------------------------------------------ data */

const PRICES = C.prices;
const LINKS = C.links;

const INTRO = C.intro;

const sport = (o) => o;

const SPORTS = C.sports;

const BRICK = C.brick;

const QUOTES = C.quotes;
const L = C.labels;
const WHO = C.who;
const CTA = C.cta;

/* -------------------------------------------------------------- template */

const esc = (s) => String(s);

function zoneBlock(z, cols) {
  return `
  <section class="zone${z.special ? " zone--special" : ""}">
    <div class="zone-head">
      <div class="zone-id">${z.id}</div>
      <div class="zone-title">
        <h3>${z.name}</h3>
        <p class="zone-purpose">${z.purpose}</p>
      </div>
      <div class="zone-bands">
        ${z.bands.map((b, i) => `<div class="band"><span class="band-l">${cols[i]}</span><span class="band-v">${b}</span></div>`).join("")}
      </div>
    </div>
    <p class="zone-what">${z.que}</p>
    ${z.donde ? `<p class="zone-where">${z.donde}</p>` : ""}
    <p class="zone-adapt"><span class="lbl">${L.adapts}</span>${z.adapta}</p>
    <div class="sessions">
      <div class="sessions-h">${L.sessions}${z.cond ? ` <span class="cond">— ${z.cond}</span>` : ""}</div>
      <ol>
        ${z.sesiones.map(([n, d]) => `<li><strong>${n}</strong> — ${d}</li>`).join("")}
      </ol>
      ${z.extra ? `<p class="extra"><strong>${z.extra[0]}.</strong> ${z.extra[1]}</p>` : ""}
    </div>
    <p class="dont"><span class="lbl">${L.dont}</span>${z.no}</p>
    <p class="howmuch">${z.cuanto}</p>
  </section>`;
}

function sportSection(s) {
  return `
<div class="sport-cover">
  <span class="eyebrow">${L.sportEyebrow}</span>
  <h2>${s.label}</h2>
  <p class="metric">${s.metric}</p>
  <p class="metric-note">${s.metricNote}</p>
  <table class="ztable">
    <thead><tr><th>${L.zoneCol}</th>${s.cols.map((c) => `<th>${c}</th>`).join("")}<th>${L.purposeCol}</th></tr></thead>
    <tbody>
      ${s.zones.map((z) => `<tr${z.special ? ' class="special"' : ""}>
        <td class="z"><strong>${z.id}</strong> · ${z.name}</td>
        ${z.bands.map((b) => `<td class="num">${b}</td>`).join("")}
        <td class="pu">${z.purpose}</td></tr>`).join("")}
    </tbody>
  </table>
  ${s.callout ? `<div class="callout"><div class="callout-t">${s.callout[0]}</div><p>${s.callout[1]}</p></div>` : ""}
</div>
${s.zones.map((z) => zoneBlock(z, s.cols)).join("")}`;
}

const HTML = `<!DOCTYPE html>
<html lang="${LANG}"><head><meta charset="UTF-8"><style>
  :root{
    --blue:#004aad; --blue-deep:#003a89; --ink:#1e2019; --white:#fff;
    --wash:#edf3fb; --slate:#565a52; --mist:#e4e6e1;
  }
  @page { size: A4; margin: 16mm 15mm 18mm; }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--ink);
       font-size:10.5pt;line-height:1.55;-webkit-font-smoothing:antialiased}
  strong{font-weight:700}
  .lbl{display:block;font-size:7.5pt;font-weight:700;text-transform:uppercase;
       letter-spacing:.09em;color:var(--blue);margin-bottom:2px}

  /* ---------- cover ----------
     White, not a blue slab. Two reasons: brand-guidelines §6 names High North as
     the reference — white-dominant, typography and whitespace doing the work —
     and a full-bleed colour panel does not survive Chromium's print margin box,
     so the blue version rendered as an inset rectangle with an uneven gutter. */
  .cover{height:255mm;page-break-after:always;display:flex;flex-direction:column}
  .cover .wordmark{font-size:14pt;font-weight:700;letter-spacing:-0.01em;color:var(--blue)}
  .cover .cover-body{margin-top:auto}
  .cover .kicker{font-size:8.5pt;font-weight:700;text-transform:uppercase;
                 letter-spacing:.13em;color:var(--blue);display:block;margin-bottom:5mm}
  .cover h1{font-size:33pt;font-weight:700;letter-spacing:-0.02em;line-height:1.04;margin-bottom:4mm}
  .cover .sub{font-size:13pt;color:var(--slate);margin-bottom:10mm}
  .zonestrip{display:flex;gap:2mm;margin-bottom:10mm}
  .zonestrip div{flex:1;text-align:center;padding:3mm 0;border:1px solid var(--mist);
                 border-radius:3px;font-size:10pt;font-weight:700;color:var(--slate)}
  .zonestrip div.hl{background:var(--wash);border-color:var(--blue);color:var(--blue)}
  .cover .lede{font-size:10.5pt;line-height:1.6;color:var(--slate);max-width:125mm;
               border-top:1px solid var(--mist);padding-top:6mm}
  .cover .foot{margin-top:auto;font-size:8.5pt;color:var(--slate);
               border-top:1px solid var(--mist);padding-top:4mm}

  /* ---------- intro ---------- */
  /* Must hold one page, callout included — see the note on .cta. The first
     build after the X/Y explanation was expanded pushed the calculator callout
     alone onto page 3. Spacing here is tuned to fit; re-check after adding copy. */
  .intro{page-break-after:always}
  h2.sec{font-size:20pt;font-weight:700;letter-spacing:-0.02em;margin-bottom:4mm}
  .intro .row{margin-bottom:3.4mm;padding-bottom:3.4mm;border-bottom:1px solid var(--mist)}
  .intro .row:last-child{border-bottom:0;padding-bottom:0}
  .intro .row h4{font-size:10.5pt;font-weight:700;margin-bottom:1.2mm}
  .intro .row p{color:var(--slate);font-size:10pt;line-height:1.5}
  .intro .row p br{line-height:0.7}

  /* ---------- sport ---------- */
  .sport-cover{page-break-before:always;padding-top:2mm}
  .eyebrow{display:block;font-size:8pt;font-weight:700;text-transform:uppercase;
           letter-spacing:.12em;color:var(--blue);margin-bottom:2mm}
  .sport-cover h2{font-size:28pt;font-weight:700;letter-spacing:-0.02em;line-height:1.05}
  .metric{font-size:11pt;font-weight:700;margin:2mm 0 2mm}
  .metric-note{color:var(--slate);max-width:150mm;margin-bottom:7mm}

  table.ztable{width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:6mm}
  table.ztable th{text-align:left;font-size:7.5pt;text-transform:uppercase;letter-spacing:.06em;
                  color:var(--slate);font-weight:700;padding:0 3mm 2mm 0;border-bottom:1px solid var(--mist)}
  table.ztable td{padding:2.4mm 3mm 2.4mm 0;border-bottom:1px solid var(--mist);vertical-align:top}
  table.ztable td.num{white-space:nowrap;color:var(--ink);font-variant-numeric:tabular-nums}
  table.ztable td.pu{color:var(--slate);font-size:8.5pt}
  table.ztable tr.special td{background:var(--wash)}
  table.ztable th:last-child,table.ztable td:last-child{padding-right:2mm}

  .callout{background:var(--wash);border-left:2px solid var(--blue);border-radius:0 4px 4px 0;
           padding:4mm 5mm;margin-bottom:4mm}
  .callout-t{font-weight:700;font-size:9.5pt;margin-bottom:1.5mm}
  .callout p{font-size:9pt;color:var(--slate)}

  /* ---------- zone block ---------- */
  .zone{page-break-inside:avoid;border-top:1px solid var(--mist);padding:5mm 0 4mm}
  .zone-head{display:flex;align-items:flex-start;gap:4mm;margin-bottom:3mm}
  .zone-id{flex:0 0 9mm;height:9mm;border-radius:50%;background:var(--blue);color:#fff;
           font-weight:700;font-size:11pt;display:flex;align-items:center;justify-content:center}
  .zone--special .zone-id{background:var(--blue-deep)}
  .zone-title{flex:1}
  .zone-title h3{font-size:14pt;font-weight:700;letter-spacing:-0.01em;line-height:1.15}
  .zone-purpose{font-size:8.5pt;color:var(--slate)}
  .zone-bands{display:flex;gap:5mm;text-align:right}
  .band-l{display:block;font-size:7pt;text-transform:uppercase;letter-spacing:.07em;color:var(--slate)}
  .band-v{display:block;font-size:11pt;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
  .zone-what{margin-bottom:2mm}
  .zone-where{background:var(--wash);padding:2.5mm 4mm;border-radius:4px;margin-bottom:2.5mm;font-size:9.5pt}
  .zone-adapt{color:var(--slate);font-size:9.5pt;margin-bottom:3mm}
  .sessions{border-left:2px solid var(--blue);padding-left:5mm;margin-bottom:3mm}
  .sessions-h{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.09em;
              color:var(--blue);margin-bottom:1.5mm}
  .sessions-h .cond{color:var(--slate);letter-spacing:.04em}
  .sessions ol{margin-left:4.5mm}
  .sessions li{margin-bottom:1.5mm;font-size:9.5pt}
  .extra{font-size:9pt;color:var(--slate);margin-top:2mm}
  .dont{color:var(--slate);font-size:9.5pt;margin-bottom:2mm}
  .howmuch{font-size:8.5pt;color:var(--slate);border-top:1px solid var(--mist);padding-top:1.5mm}

  /* ---------- brick + CTA ---------- */
  .brick{page-break-before:always;padding-top:2mm}
  .brick .punch{background:var(--wash);border-left:2px solid var(--blue);padding:4mm 5mm;
                border-radius:0 4px 4px 0;margin-top:3mm}
  .who{margin-top:9mm;border-top:1px solid var(--mist);padding-top:6mm}
  .who p{color:var(--slate);margin-bottom:3mm;max-width:155mm}
  .stats{display:flex;gap:9mm;margin:5mm 0}
  .stat .v{font-size:20pt;font-weight:700;color:var(--blue);line-height:1}
  .stat .k{font-size:8pt;text-transform:uppercase;letter-spacing:.08em;color:var(--slate);margin-top:1mm}
  .quotes{display:flex;gap:7mm;margin-top:4mm}
  .quote{flex:1}
  .quote p{font-size:9.5pt;color:var(--ink);margin-bottom:1.5mm}
  .quote .who-q{font-size:8pt;color:var(--slate)}

  /* The whole CTA must land on one page — a closing offer that spills an orphan
     line onto page 17 reads as a mistake at exactly the moment it is asking for
     money. Kept tight deliberately; if a line is added here, re-check the fit. */
  .cta{page-break-before:always;page-break-inside:avoid;padding-top:0}
  .cta h2{font-size:21pt;font-weight:700;letter-spacing:-0.02em;line-height:1.06;margin-bottom:2.5mm}
  .cta .lead{color:var(--slate);max-width:150mm;margin-bottom:5mm;font-size:10pt}
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

<div class="cover">
  <div class="wordmark">Triaperformance</div>
  <div class="cover-body">
    <span class="kicker">${INTRO.kicker}</span>
    <h1>${INTRO.title}</h1>
    <div class="sub">${INTRO.sub}</div>
    <div class="zonestrip">
      ${["1", "2", "X", "3", "Y", "4", "5"].map((z) => `<div${z === "X" || z === "Y" ? ' class="hl"' : ""}>${z}</div>`).join("")}
    </div>
    <div class="lede">${INTRO.lede}</div>
  </div>
  <div class="foot">Iván Koch · triaperformance.com</div>
</div>

<div class="intro">
  <h2 class="sec">${L.howToRead}</h2>
  ${INTRO.body.map(([h, p]) => `<div class="row"><h4>${h}</h4><p>${p}</p></div>`).join("")}
  <div class="callout" style="margin-top:4mm">
    <div class="callout-t">${L.noZonesTitle}</div>
    <p>${L.noZonesBody}</p>
  </div>
</div>

${SPORTS.map(sportSection).join("")}

<div class="brick">
  <span class="eyebrow">${L.bonus}</span>
  <h2 class="sec">${BRICK.title}</h2>
  <p>${BRICK.body}</p>
  <div class="punch">${BRICK.punch}</div>

  <div class="who">
    <h2 class="sec">${L.whoWeAre}</h2>
    ${WHO.body.map((p) => `<p>${p}</p>`).join("")}
    <div class="stats">
      ${WHO.stats.map(([v, k]) => `<div class="stat"><div class="v">${v}</div><div class="k">${k}</div></div>`).join("")}
    </div>
    <div class="quotes">
      ${QUOTES.map(([q, n, c]) => `<div class="quote"><p>“${q}”</p><div class="who-q">${n} · ${c}</div></div>`).join("")}
    </div>
  </div>
</div>

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
        <span>Triaperformance · ${INTRO.title}</span>
        <span class="pageNumber"></span></div>`,
  });
  await browser.close();
  console.log("PDF written:", OUT);
})();
