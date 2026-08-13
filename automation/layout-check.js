#!/usr/bin/env node
/**
 * layout-check.js — visual-regression assertions for the zone calculator.
 *
 * Why this exists: the Aug 13, 2026 bugs (ai-infrastructure-documentation.md
 * §23) were all invisible to the checks this repo already runs. The build was
 * clean, the HTML was correct, the CSS rules were present in the file — and the
 * page was still visibly wrong, because a `margin: 0 auto`, a specificity tie
 * and a badly-closed comment don't fail a build. The only check that
 * discriminates is rendering the page and reading the computed values.
 *
 * Usage (from repo root):
 *     npx @11ty/eleventy --output=/tmp/_site-check
 *     (cd /tmp/_site-check && python3 -m http.server 8099 &)
 *     node automation/layout-check.js
 *
 * Scope it while iterating:
 *     LAYOUT_CHECK_ONLY=/en/ LAYOUT_CHECK_VIEWPORTS=1440 node automation/layout-check.js
 *
 * First run needs a browser:  npx playwright install chromium
 * Exits non-zero on any failed assertion, so it can gate a deploy later.
 */

const BASE = process.env.LAYOUT_CHECK_BASE || "http://localhost:8099";
const VIEWPORTS = (process.env.LAYOUT_CHECK_VIEWPORTS || "390,768,1440").split(",").map(Number);
// LAYOUT_CHECK_ONLY filters the case list by URL substring. The full run is 13
// pages x 3 viewports and takes several minutes; being able to run just the
// language or page you touched is what keeps this from becoming a check that
// exists but never gets run.
const ONLY = process.env.LAYOUT_CHECK_ONLY || "";

// [url, sport, input values in field order, sport-locked?]
// Locked pages must not offer a sport switch: the prose under the tool is
// per-page and static, so a switch there produces a page that contradicts
// itself (bike zones under the 30-minute run-test explanation).
const CASES = [
  ["/calculadora-de-zonas/", "swimming", ["6", "40", "3", "5"], false],
  ["/calculadora-de-zonas/natacion/", "swimming", ["6", "40", "3", "5"], true],
  ["/calculadora-de-zonas/ciclismo/", "cycling", ["250"], true],
  ["/calculadora-de-zonas/running/", "running", ["4", "0"], true],
  ["/en/training-zones-calculator/", "swimming", ["6", "40", "3", "5"], false],
  ["/en/training-zones-calculator/swimming/", "swimming", ["6", "40", "3", "5"], true],
  ["/en/training-zones-calculator/cycling/", "cycling", ["250"], true],
  ["/en/training-zones-calculator/running/", "running", ["4", "0"], true],
  ["/pt/calculadora-de-zonas/", "swimming", ["6", "40", "3", "5"], false],
  ["/pt/calculadora-de-zonas/natacao/", "swimming", ["6", "40", "3", "5"], true],
  ["/pt/calculadora-de-zonas/ciclismo/", "cycling", ["250"], true],
  ["/pt/calculadora-de-zonas/corrida/", "running", ["4", "0"], true],
  // The members copy shares the component and a different theme. It is in this
  // list because "same component, therefore fine" is an assumption, and the
  // whole point of this file is to stop assuming things about rendering.
  ["/members/calculadora-de-zonas/", "swimming", ["6", "40", "3", "5"], false],
];

(async () => {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (e) {
    console.error("playwright not installed — run: npm i -D playwright && npx playwright install chromium");
    process.exit(2);
  }

  const browser = await chromium.launch();
  let failures = 0, checks = 0;

  const cases = ONLY ? CASES.filter(([u]) => u.includes(ONLY)) : CASES;
  for (const width of VIEWPORTS) {
    for (const [url, sport, values, isLocked] of cases) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        await page.goto(BASE + url, { waitUntil: "networkidle" });

        // Sport picker: visible and usable on the hub, gone on locked pages.
        // Checked before calculating, because on a locked page the step must
        // never appear — not at load, and not after "recalculate" below.
        const pickerAtLoad = await page.isVisible("#zc-step-sport");

        // drive the tool to its results state — the bugs only appear there
        if (!isLocked) {
          await page.click(`.zc-choice[data-sport="${sport}"]`);
          await page.waitForTimeout(150);
        }
        const protocol = await page.$("#zc-step-protocol:not([hidden]) .zc-choice");
        if (protocol) { await protocol.click(); await page.waitForTimeout(150); }
        const inputs = await page.$$("#zc-fields input[type=number]");
        for (let i = 0; i < inputs.length; i++) await inputs[i].fill(values[i] ?? "30");
        await page.click("#zc-go");
        await page.waitForTimeout(300);

        // "Cambiar mis números" must reopen the inputs, never the sport picker
        // on a locked page — that was the original bug's second door.
        await page.click("#zc-again");
        await page.waitForTimeout(200);
        const pickerAfterAgain = await page.isVisible("#zc-step-sport");
        await page.click("#zc-go");
        await page.waitForTimeout(300);

        const m = await page.evaluate(() => {
          const q = s => document.querySelector(s);
          const left = e => (e ? Math.round(e.getBoundingClientRect().left) : null);
          const width_ = e => (e ? Math.round(e.getBoundingClientRect().width) : null);
          const note = q(".zc-table td.zc-zone-note");
          const doc = document.documentElement;
          return {
            h1: left(q("h1")), zc: left(q("#zc")),
            table: left(q(".zc-table")), capture: left(q(".zc-capture")),
            tableW: width_(q(".zc-table")), zcW: width_(q("#zc")),
            resultsShown: !!q("#zc-step-results:not([hidden])"),
            // computed, not declared: a rule in the file is not a rule applied
            noteAlign: note ? getComputedStyle(note).textAlign : null,
            noteWrap: note ? getComputedStyle(note).whiteSpace : null,
            overflow: doc.scrollWidth > doc.clientWidth ? `${doc.scrollWidth}>${doc.clientWidth}` : null,
          };
        });

        const assertions = [
          ["results rendered", m.resultsShown],
          [isLocked ? "sport picker hidden (locked page)" : "sport picker offered (hub)",
            pickerAtLoad === !isLocked],
          [isLocked ? "picker stays hidden after recalculate" : "picker returns after recalculate",
            pickerAfterAgain === !isLocked],
          ["one left edge", m.zc === m.h1 && m.table === m.h1 && (m.capture === null || m.capture === m.h1)],
          ["table within container", m.tableW !== null && m.tableW <= m.zcW],
          ["zone note left-aligned", m.noteAlign === "left"],
          ["zone note wraps", m.noteWrap === "normal"],
          ["no horizontal overflow", !m.overflow],
        ];

        for (const [name, ok] of assertions) {
          checks++;
          if (!ok) {
            failures++;
            console.error(`FAIL  ${String(width).padStart(4)}px  ${url}  — ${name}\n      ${JSON.stringify(m)}`);
          }
        }
      } catch (err) {
        failures++; checks++;
        console.error(`ERROR ${width}px ${url}: ${err.message.split("\n")[0]}`);
      }
      await page.close();
    }
  }

  await browser.close();
  console.log(
    failures
      ? `\n${failures} of ${checks} assertions FAILED`
      : `\nAll ${checks} assertions passed (${cases.length} pages x ${VIEWPORTS.length} viewports)`
  );
  process.exit(failures ? 1 : 0);
})();
