/**
 * Internal-link and image-alt checks, run against the REAL built HTML.
 *
 * WHY THIS EXISTS
 * Ahrefs' Sept 1, 2026 crawl found two 404s and 59 linked images with no alt
 * text. Both were authored, not deployed, faults: two blog articles linked
 * `/calculadora-de-zonas/cycling/` (the EN path segment inside an ES URL) and
 * one linked `/coaching/`, a page that has never existed — the nav's Coaching
 * entry is the homepage anchor `/#coaching`. Nothing in the build objected.
 *
 * The writer agent invents internal links; it has no whitelist of real URLs and
 * giving it one would not help, because the URL set changes with the build. The
 * build itself is the only thing that knows which paths exist, so the check
 * belongs here rather than in the prompt. It turns "a broken link is found by a
 * crawler weeks later" into "a broken link fails the build".
 *
 * Runs against _site/, so `npm run build` must have run first — same contract
 * as zones-ui.test.js, and the same reason: the thing being tested is what
 * Caddy will serve, not what a template says.
 *
 * SCOPE, deliberately narrow: root-relative links only. External links belong
 * to somebody else's server and would make this test a network call; protocol-
 * relative and mailto:/tel: links are not paths.
 */

const fs = require("fs");
const path = require("path");

const SITE = path.join(__dirname, "..", "_site");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ok   " + name);
  } catch (e) {
    console.error("  FAIL " + name + "\n       " + (e && e.message));
    process.exitCode = 1;
  }
}

/** Every built .html file, as paths relative to _site. */
function pages(dir = SITE, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) pages(full, out);
    else if (entry.name.endsWith(".html")) out.push(path.relative(SITE, full));
  }
  return out;
}

/** Does this root-relative path resolve to something the site actually serves? */
function resolves(p) {
  const fsPath = path.join(SITE, decodeURIComponent(p).replace(/^\/+/, ""));
  if (fs.existsSync(fsPath)) {
    return fs.statSync(fsPath).isDirectory()
      ? fs.existsSync(path.join(fsPath, "index.html"))
      : true;
  }
  return false;
}

if (!fs.existsSync(SITE)) {
  console.error("  FAIL _site/ not built — run `npm run build` first");
  process.exitCode = 1;
} else {
  const files = pages();

  test("every root-relative internal link resolves to a built page or asset", () => {
    const broken = [];
    for (const file of files) {
      const html = fs.readFileSync(path.join(SITE, file), "utf8");
      for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const raw = m[1];
        if (!raw.startsWith("/") || raw.startsWith("//")) continue;
        const target = raw.split("#")[0].split("?")[0];
        if (!target || target === "/") continue;
        if (!resolves(target)) broken.push(`${target}  (linked from /${file})`);
      }
    }
    if (broken.length) {
      // Unique targets, so one bad URL repeated across a listing reads as one
      // problem rather than thirty.
      const unique = [...new Set(broken.map((b) => b.split("  (")[0]))];
      throw new Error(
        `${unique.length} broken internal target(s):\n       ` +
          broken.slice(0, 20).join("\n       ")
      );
    }
  });

  test("every <img> carries a non-empty alt attribute", () => {
    const bad = [];
    for (const file of files) {
      const html = fs.readFileSync(path.join(SITE, file), "utf8");
      for (const m of html.matchAll(/<img\b[^>]*>/g)) {
        const tag = m[0];
        if (!/\salt\s*=/.test(tag) || /\salt\s*=\s*(""|'')/.test(tag)) {
          bad.push(`/${file}: ${tag.slice(0, 100)}`);
        }
      }
    }
    if (bad.length) {
      throw new Error(
        `${bad.length} image(s) without alt text:\n       ` +
          bad.slice(0, 20).join("\n       ")
      );
    }
  });

  console.log(`  ${passed}/2 internal-link checks passed`);
}
