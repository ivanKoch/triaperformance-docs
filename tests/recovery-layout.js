/* recovery-layout.js — rendered-layout and walkthrough checks for
 * /members/recuperacion/. Companion to tests/recovery-matrix.js, which checks the
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
 *     node tests/recovery-layout.js
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

const LANGS = {
  es: { url: "/members/recuperacion/", crumb: "Recuperación",
        knees: "/members/rodillas/", shoulder: "/members/hombro/",
        achilles: "/members/aquiles/", doctor: /m[eé]dic/,
        badStart: /activaci[oó]n/i, badDone: /activaci[oó]n/i,
        load: /sesi[oó]n suave, no un d[ií]a libre/i,
        act: "/members/activacion/", mob: "/members/movilidad/" },
  en: { url: "/members/en/recovery/", crumb: "Recovery",
        knees: "/members/en/knees/", shoulder: "/members/en/shoulder/",
        achilles: "/members/en/achilles/", doctor: /doctor/i,
        badStart: /activation/i, badDone: /activation/i,
        load: /easy session, not a day off/i,
        act: "/members/en/activation/", mob: "/members/en/mobility/" },
  pt: { url: "/members/pt/recuperacao/", crumb: "Recuperação",
        knees: "/members/pt/joelhos/", shoulder: "/members/pt/ombro/",
        achilles: "/members/pt/aquiles/", doctor: /m[eé]dic/,
        badStart: /ativa[cç][ãa]o/i, badDone: /ativa[cç][ãa]o/i,
        load: /sess[ãa]o leve, n[ãa]o um dia de folga/i,
        act: "/members/pt/ativacao/", mob: "/members/pt/mobilidade/" }
};

(async () => {
  await new Promise(r => server.listen(8099, r));
  const browser = await chromium.launch();

  for (const [lang, C] of Object.entries(LANGS)) {
    for (const width of [390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.route("**", r => /localhost:8099/.test(r.request().url()) ? r.continue() : r.abort());
      await page.goto("http://localhost:8099" + C.url, { waitUntil: "domcontentloaded" });

      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      eq(sw, width, `[${lang} ${width}] setup screen does not scroll sideways`);

      const boxes = await page.$$eval(".setup-opts--wrap .setup-opt", els =>
        els.map(e => ({ t: e.textContent.trim(), w: e.getBoundingClientRect().width,
                        h: e.getBoundingClientRect().height,
                        clipped: e.scrollWidth > e.clientWidth + 1 })));
      eq(boxes.length, 5, `[${lang} ${width}] five sport options render`);
      ok(boxes.every(b => b.w >= 88), `[${lang} ${width}] every sport button is at least 88px wide — ${JSON.stringify(boxes.map(b => Math.round(b.w)))}`);
      ok(boxes.every(b => !b.clipped), `[${lang} ${width}] no sport label is clipped — ${JSON.stringify(boxes.filter(b => b.clipped).map(b => b.t))}`);
      ok(boxes.every(b => b.h >= 44), `[${lang} ${width}] every sport button is a real tap target`);

      if (width === 390) {
        const rows = new Set(await page.$$eval(".setup-opts--wrap .setup-opt",
          els => els.map(e => Math.round(e.getBoundingClientRect().top))));
        eq(rows.size, 2, `[${lang} 390] the sport options wrap onto two rows`);
      }

      for (const [sport, must] of [["run", C.knees], ["swim", C.shoulder], ["bike", C.knees]]) {
        await page.click(`.setup-opt[data-val="${sport}"]`);
        const aside = await page.$eval("#painAside", e => e.innerHTML);
        ok(aside.includes(must), `[${lang} ${width}] ${sport} pain aside links ${must}`);
        ok(C.doctor.test(aside), `[${lang} ${width}] ${sport} pain aside ends at a doctor`);
      }
      ok(!(await page.$eval("#painAside", e => e.innerHTML)).includes(C.achilles),
         `[${lang} ${width}] the bike aside does not offer an Achilles tool`);

      /* The three constant asides: the load warning, the routing to the other
         two tools, and the pain hand-off. Decision 4 lives in the first one. */
      ok(C.load.test(await page.$eval("#loadAside", e => e.innerHTML)),
         `[${lang} ${width}] the load warning says this is not a rest day`);
      const routing = await page.$eval("#activationAside", e => e.innerHTML);
      ok(routing.includes(C.act) && routing.includes(C.mob),
         `[${lang} ${width}] the setup screen routes to the other two tools`);

      await page.close();
    }

    /* A full walk to the done overlay on the longest routine, at phone width,
       in every language — because the finish screen is one of the two places
       the shared chrome leaks the wrong word, and it is only reachable here. */
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.route("**", r => /localhost:8099/.test(r.request().url()) ? r.continue() : r.abort());
    await page.goto("http://localhost:8099" + C.url, { waitUntil: "domcontentloaded" });
    await page.click('.setup-opt[data-val="tri"]');
    await page.click('.setup-opt[data-val="60"]');
    await page.click("#setupGo");
    await page.waitForSelector(".tool", { state: "visible" });
    await page.waitForFunction(() => !!document.querySelector(".setup-back"));

    ok(await page.isVisible(".setup-back"), `[${lang} walk] the way back to the questions exists`);
    eq((await page.textContent("#crumbLabel")).trim(), C.crumb, `[${lang} walk] the breadcrumb label was written`);

    /* The tool opens on its HOME tab, where the control is #startBtn. #mainBtn is
       the play/pause inside the ROUTINE tab and is 0x0 until that tab is shown —
       which is how this check first failed, and is why the walk starts here. */
    const startLabel = await page.textContent("#startBtn");
    ok(!C.badStart.test(startLabel), `[${lang} walk] the start button reads "${startLabel.trim()}"`);
    await page.click("#startBtn");
    await page.waitForSelector("#tab-workout.active", { timeout: 3000 }).catch(() => {});
    await page.click("#mainBtn", { timeout: 3000 });

    let guard = 0;
    while (guard++ < 120) {
      if (await page.isVisible("#doneOverlay").catch(() => false)) break;
      const restUp = await page.isVisible("#skipRestBtn").catch(() => false);
      const clicked = await page.click(restUp ? "#skipRestBtn" : "#skipBtn", { timeout: 1500 })
        .then(() => true).catch(() => false);
      if (!clicked) break;
    }
    ok(guard < 120, `[${lang} walk] the routine reaches its end rather than looping`);
    ok(await page.isVisible("#doneOverlay"), `[${lang} walk] the done overlay is reached on tri|60`);
    const doneTitle = await page.textContent("#doneOverlay .done-title").catch(() => "");
    ok(!C.badDone.test(doneTitle), `[${lang} walk] the done screen reads "${doneTitle.trim()}"`);
    const n = parseInt(await page.textContent("#statEx"), 10);
    ok(n >= 25 && n <= 32, `[${lang} walk] tri|60 is ${n} exercises`);
    eq(await page.evaluate(() => document.documentElement.scrollWidth), 390,
       `[${lang} walk] the running tool does not scroll sideways at 390px`);
    await page.close();
  }

  await browser.close();
  server.close();

  console.log(`\n${pass} checks passed, ${fails.length} failed.`);
  if (fails.length) { fails.forEach(f => console.log("  x " + f)); process.exit(1); }
  console.log("all green");
})().catch(e => { console.error("THREW:", e.message); process.exit(2); });
