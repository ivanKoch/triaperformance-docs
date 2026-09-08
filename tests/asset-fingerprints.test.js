/**
 * Every /assets/js and /assets/css reference in served HTML must carry a ?v=
 * fingerprint.
 *
 * 🚨 Why this exists (September 8, 2026). Caddy serves those two directories with
 * `Cache-Control: public, max-age=31536000, immutable`. An unfingerprinted URL is
 * therefore pinned in every visitor's browser for a YEAR, with no way to bust it
 * short of renaming the file — which is exactly what `.eleventy.js`'s `v` filter
 * says in its own docstring, and why that filter was changed from fail-open to
 * fail-loud in August.
 *
 * 🔑 The filter guards what passes THROUGH it. The 24 setup-first tool pages build
 * their `<script>` element in page JavaScript, inside a `{% raw %}` block Nunjucks
 * never processes, so every one of them shipped a bare URL and none of it could
 * ever reach the filter. **A guard is only a guard for the path it sits on** —
 * and the more filters a repo adds, the more confidently it stops looking.
 *
 * It surfaced the worst way available: an engine change shipped, the markup went
 * live, and the deployed page ran the previous month's JavaScript. New toggle
 * visible, doing nothing. The build was clean and every other test passed.
 *
 * This check reads the SERVED HTML, which is the only place the two halves —
 * what the template asked for and what the page actually requests — are both
 * visible at once.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const SITE = path.join(__dirname, "..", "_site");

/* Matches a real asset REQUEST — quoted, as an attribute value or a JS string —
   and deliberately not a mention inside a comment, which is how the fix for the
   original defect documents itself on all 24 pages. */
const REF = /["'](\/assets\/(?:js|css)\/[A-Za-z0-9._/-]+\.(?:js|css))(\?v=[a-f0-9]+)?["']/g;

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ok   " + name); }
  catch (e) { console.error("  FAIL " + name + "\n       " + (e && e.message)); process.exitCode = 1; }
}

function pages(dir = SITE, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) pages(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

if (!fs.existsSync(SITE)) {
  console.error("  FAIL _site/ missing — run `npm run build` first");
  process.exitCode = 1;
} else {
  const all = pages();

  test("every asset URL the served HTML requests carries a ?v= fingerprint", () => {
    const bare = [];
    for (const file of all) {
      const html = fs.readFileSync(file, "utf8");
      let m;
      REF.lastIndex = 0;
      while ((m = REF.exec(html))) {
        if (!m[2]) bare.push(`${m[1]}  (on /${path.relative(SITE, file)})`);
      }
    }
    if (bare.length) {
      const unique = [...new Set(bare.map((b) => b.split("  (")[0]))];
      assert.fail(
        `${unique.length} unfingerprinted asset URL(s) across ${bare.length} page(s) — ` +
        `Caddy pins these for a year:\n       ` + bare.slice(0, 20).join("\n       ")
      );
    }
  });

  test("every fingerprinted asset URL points at a file that was built", () => {
    const missing = [];
    for (const file of all) {
      const html = fs.readFileSync(file, "utf8");
      let m;
      REF.lastIndex = 0;
      while ((m = REF.exec(html))) {
        if (!fs.existsSync(path.join(SITE, m[1].replace(/^\//, "")))) {
          missing.push(`${m[1]}  (on /${path.relative(SITE, file)})`);
        }
      }
    }
    assert.strictEqual(missing.length, 0, "asset requested but not built:\n       " + missing.slice(0, 10).join("\n       "));
  });

  // The regression this file was written for, asserted by name rather than only
  // by the sweep above: these two engines are requested from page JS, which is
  // the one path the `v` filter cannot see.
  test("both routine engines are requested with a fingerprint from page JS", () => {
    for (const engine of ["activation-tool.js", "strength-tool.js"]) {
      const hits = all.filter((f) =>
        new RegExp('TP_ENGINE_SRC = "/assets/js/' + engine.replace(".", "\\.") + '\\?v=[a-f0-9]+"')
          .test(fs.readFileSync(f, "utf8")));
      assert.ok(hits.length > 0, engine + " is not published fingerprinted on any page");
    }
  });

  console.log("  " + passed + "/3 asset-fingerprint checks passed");
}
