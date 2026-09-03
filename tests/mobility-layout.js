/* mobility-layout.js — rendered-layout and walkthrough checks for
 * /members/movilidad/. Companion to tests/mobility-matrix.js, which checks the
 * DATA. This one checks what the data tests structurally cannot see.
 *
 * It has already earned its keep three times:
 *   - the five sport buttons rendered 61-72px wide on ONE row at 390px. The
 *     wrap rule was present and looked right; `flex: 1 1` let them shrink
 *     instead of wrapping, and only a rendered width discriminates that.
 *   - the walkthrough could not start, because #mainBtn is 0x0 until the
 *     ROUTINE tab is shown — the tool opens on its HOME tab, on #startBtn.
 *   - the finish screen said "Activación completa" on a mobility page. That
 *     string is baked into the partial at build time, so the page's
 *     window.ACTIVATION_UI override silently did nothing.
 *
 * Usage (from repo root):
 *     npx @11ty/eleventy --output=_site
 *     node tests/mobility-layout.js
 *
 * Needs a browser once:  npx playwright install chromium
 * Playwright is NOT in package.json — same situation as automation/
 * layout-check.js. If it is not installed locally this can be run anywhere the
 * built page, members-activacion.css, site.css and activation-tool.js are
 * present, by pointing MOB_ROOT at that directory.
 */
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = process.env.MOB_ROOT || "_site";
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "text/plain" });
  res.end(fs.readFileSync(f));
});

let pass = 0; const fails = [];
const ok = (c, m) => c ? pass++ : fails.push(m);
const eq = (a, b, m) => ok(a === b, m + " — got " + JSON.stringify(a) + ", want " + JSON.stringify(b));

(async () => {
  await new Promise(r => server.listen(8099, r));
  const browser = await chromium.launch();

  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    // Analytics and fonts are not reachable here and are not what we're testing.
    await page.route("**", r => /localhost:8099/.test(r.request().url()) ? r.continue() : r.abort());
    await page.goto("http://localhost:8099/members/movilidad/", { waitUntil: "domcontentloaded" });

    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    eq(sw, width, `[${width}] setup screen does not scroll sideways`);

    // The five sport buttons must each be readable: no clipped text, no button
    // narrower than a thumb target.
    const boxes = await page.$$eval(".setup-opts--wrap .setup-opt", els =>
      els.map(e => ({ t: e.textContent.trim(), w: e.getBoundingClientRect().width,
                      h: e.getBoundingClientRect().height,
                      clipped: e.scrollWidth > e.clientWidth + 1 })));
    eq(boxes.length, 5, `[${width}] five sport options render`);
    ok(boxes.every(b => b.w >= 88), `[${width}] every sport button is at least 88px wide — ${JSON.stringify(boxes.map(b => Math.round(b.w)))}`);
    ok(boxes.every(b => !b.clipped), `[${width}] no sport label is clipped`);
    ok(boxes.every(b => b.h >= 44), `[${width}] every sport button is a real tap target`);

    // 3 + 2, not 5 across, at phone width.
    if (width === 390) {
      const rows = new Set(await page.$$eval(".setup-opts--wrap .setup-opt",
        els => els.map(e => Math.round(e.getBoundingClientRect().top))));
      eq(rows.size, 2, "[390] the sport options wrap onto two rows");
    }

    // The pain hand-off is sport-aware and always points somewhere real.
    for (const [sport, must] of [["run", "/members/rodillas/"], ["swim", "/members/hombro/"], ["bike", "/members/rodillas/"]]) {
      await page.click(`.setup-opt[data-val="${sport}"]`);
      const aside = await page.$eval("#painAside", e => e.innerHTML);
      ok(aside.includes(must), `[${width}] ${sport} pain aside links ${must}`);
      ok(/m[eé]dic/.test(aside), `[${width}] ${sport} pain aside ends at a doctor`);
    }
    ok(!(await page.$eval("#painAside", e => e.innerHTML)).includes("/members/aquiles/"),
       `[${width}] the bike aside does not offer an Achilles tool`);

    await page.close();
  }

  /* A full walk to the done overlay on the longest routine, at phone width. */
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.route("**", r => /localhost:8099/.test(r.request().url()) ? r.continue() : r.abort());
  await page.goto("http://localhost:8099/members/movilidad/", { waitUntil: "domcontentloaded" });
  await page.click('.setup-opt[data-val="tri"]');
  await page.click('.setup-opt[data-val="30"]');
  await page.click("#setupGo");
  await page.waitForSelector(".tool", { state: "visible" });
  await page.waitForFunction(() => !!document.querySelector(".setup-back"));

  ok(await page.isVisible(".setup-back"), "[walk] the way back to the questions exists");
  const est = await page.textContent("#crumbLabel");
  eq(est.trim(), "Movilidad", "[walk] the breadcrumb label was written");

  /* The tool opens on its HOME tab, where the control is #startBtn. #mainBtn is
     the play/pause inside the ROUTINE tab and is 0x0 until that tab is shown —
     which is how this check first failed, and is worth keeping as the reason
     the walk starts here and not there. */
  const startLabel = await page.textContent("#startBtn");
  ok(!/activaci[oó]n/i.test(startLabel), `[walk] the start button reads "${startLabel.trim()}", not "Empezar activación"`);
  await page.click("#startBtn");
  await page.waitForSelector("#tab-workout.active", { timeout: 3000 }).catch(() => {});
  await page.click("#mainBtn", { timeout: 3000 });

  // Skip through every block rather than waiting 31 real minutes. During a rest
  // the control is #skipRestBtn, not #skipBtn, so click whichever is on screen.
  let guard = 0;
  while (guard++ < 120) {
    if (await page.isVisible("#doneOverlay").catch(() => false)) break;
    const restUp = await page.isVisible("#skipRestBtn").catch(() => false);
    const sel = restUp ? "#skipRestBtn" : "#skipBtn";
    const clicked = await page.click(sel, { timeout: 1500 }).then(() => true).catch(() => false);
    if (!clicked) break;
  }
  ok(guard < 120, "[walk] the routine reaches its end rather than looping");
  ok(await page.isVisible("#doneOverlay"), "[walk] the done overlay is reached on tri|30");
  const doneTitle = await page.textContent("#doneOverlay .done-title").catch(() => "");
  ok(!/activaci[oó]n/i.test(doneTitle), `[walk] the done screen reads "${doneTitle.trim()}", not "Activación completa"`);
  eq(await page.textContent("#statEx"), "18", "[walk] tri|30 is 18 exercises");
  const sideScroll = await page.evaluate(() => document.documentElement.scrollWidth);
  eq(sideScroll, 390, "[walk] the running tool does not scroll sideways at 390px");

  await browser.close();
  server.close();

  console.log(`\n${pass} checks passed, ${fails.length} failed.`);
  if (fails.length) { fails.forEach(f => console.log("  x " + f)); process.exit(1); }
  console.log("all green");
})().catch(e => { console.error("THREW:", e.message); process.exit(2); });
