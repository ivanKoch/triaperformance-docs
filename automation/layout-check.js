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
 * First run needs a browser:  npx playwright install chromium
 * Exits non-zero on any failed assertion, so it can gate a deploy later.
 */

const BASE = process.env.LAYOUT_CHECK_BASE || "http://localhost:8099";
const VIEWPORTS = [390, 768, 1440];

// [url, sport to pick, input values in field order]
const CASES = [
  ["/calculadora-de-zonas/", "swimming", ["6", "40", "3", "5"]],
  ["/calculadora-de-zonas/natacion/", "swimming", ["6", "40", "3", "5"]],
  ["/calculadora-de-zonas/ciclismo/", "cycling", ["250"]],
  ["/calculadora-de-zonas/running/", "running", ["4", "0"]],
  // The members copy shares the component and a different theme. It is in this
  // list because "same component, therefore fine" is an assumption, and the
  // whole point of this file is to stop assuming things about rendering.
  ["/members/calculadora-de-zonas/", "swimming", ["6", "40", "3", "5"]],
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

  for (const width of VIEWPORTS) {
    for (const [url, sport, values] of CASES) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        await page.goto(BASE + url, { waitUntil: "networkidle" });

        // drive the tool to its results state — the bugs only appear there
        await page.click(`.zc-choice[data-sport="${sport}"]`);
        await page.waitForTimeout(150);
        const protocol = await page.$("#zc-step-protocol:not([hidden]) .zc-choice");
        if (protocol) { await protocol.click(); await page.waitForTimeout(150); }
        const inputs = await page.$$("#zc-fields input[type=number]");
        for (let i = 0; i < inputs.length; i++) await inputs[i].fill(values[i] ?? "30");
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
      : `\nAll ${checks} assertions passed (${CASES.length} pages x ${VIEWPORTS.length} viewports)`
  );
  process.exit(failures ? 1 : 0);
})();
