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
 * SCOPE: internal links only. External links belong to somebody else's server
 * and would make this test a network call; protocol-relative and mailto:/tel:
 * links are not paths.
 *
 * WIDENED September 4, 2026, after a hand audit found two whole classes this
 * file could not see, both of them live on the site at the time:
 *
 *   1. ABSOLUTE OWN-DOMAIN LINKS. `https://triaperformance.com/members/aquiles/`
 *      in a public blog article. Skipped here because it starts with `https:`,
 *      even though it is the same internal link with a hostname glued on.
 *   2. FRAGMENTS. Four plan-category pages had a "Ver planes" button pointing at
 *      `#5k` / `#sprint` / `#running` / `#4-semanas` — anchors deleted in the
 *      July 30 catalog refactor. The page returns 200, the button does nothing.
 *      And the members nav shipped an FAQ item pointing at `#faq` on the EN and
 *      PT pages, where no FAQ section existed.
 *
 * The lesson is the same one as the URL check itself: a link that resolves is
 * not a link that works, and a check scoped to what broke last time only ever
 * catches what broke last time.
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

/** Anchor ids a page actually defines. */
const idCache = new Map();
function idsIn(fsPath) {
  if (!idCache.has(fsPath)) {
    const html = fs.readFileSync(fsPath, "utf8");
    idCache.set(
      fsPath,
      new Set([
        ...[...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]),
        ...[...html.matchAll(/\bname="([^"]+)"/g)].map((m) => m[1]),
      ])
    );
  }
  return idCache.get(fsPath);
}

/** The file a root-relative path is served from, or null. */
function fileFor(p) {
  let fsPath = path.join(SITE, decodeURIComponent(p).replace(/^\/+/, ""));
  if (!fs.existsSync(fsPath)) return null;
  if (fs.statSync(fsPath).isDirectory()) fsPath = path.join(fsPath, "index.html");
  return fs.existsSync(fsPath) ? fsPath : null;
}

/** Newest mtime under a tree, so a stale build can be detected. */
function newestMtime(dir) {
  let newest = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    const m = entry.isDirectory() ? newestMtime(full) : fs.statSync(full).mtimeMs;
    if (m > newest) newest = m;
  }
  return newest;
}

if (!fs.existsSync(SITE)) {
  console.error("  FAIL _site/ not built — run `npm run build` first");
  process.exitCode = 1;
} else if (newestMtime(path.join(__dirname, "..", "site")) > newestMtime(SITE)) {
  // A guard that silently checks a stale build is worse than no guard: it
  // reports PASS about a site nobody is serving. This has now cost time twice —
  // once reporting four already-fixed links, once reporting green while five
  // dead anchors were live. Refuse to run rather than answer about the wrong
  // bytes.
  console.error(
    "  FAIL _site/ is older than site/ — run `npm run build` first.\n" +
      "       (This test reads the built HTML. A stale _site/ makes every\n" +
      "        result below a statement about a site that is not deployed.)"
  );
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

  test("no page links its own domain with an absolute URL", () => {
    // An own-domain absolute URL is an internal link wearing a hostname. It
    // skips this file's root-relative check, it breaks on a staging domain, and
    // it is how a gated /members/ page ended up linked from a public article.
    const bad = [];
    for (const file of files) {
      const html = fs.readFileSync(path.join(SITE, file), "utf8");
      for (const m of html.matchAll(
        /href="https?:\/\/(?:www\.)?triaperformance\.com([^"]*)"/g
      )) {
        // Canonical, hreflang and og:url tags are SUPPOSED to be absolute; they
        // are <link>/<meta>, not <a href>, so match only anchors.
        const before = html.slice(Math.max(0, m.index - 200), m.index);
        if (/<(?:link|meta)\b[^>]*$/.test(before)) continue;
        bad.push(`${m[0]}  (in /${file})`);
      }
    }
    if (bad.length) {
      throw new Error(
        `${bad.length} absolute own-domain link(s) — write them root-relative:\n       ` +
          bad.slice(0, 20).join("\n       ")
      );
    }
  });

  test("every #fragment link points at an id that exists on the target page", () => {
    const broken = [];
    for (const file of files) {
      const full = path.join(SITE, file);
      const html = fs.readFileSync(full, "utf8");
      for (const m of html.matchAll(/href="([^"]+)"/g)) {
        const raw = m[1];
        if (!raw.includes("#")) continue;
        let [base, frag] = [raw.slice(0, raw.indexOf("#")), raw.slice(raw.indexOf("#") + 1)];
        if (!frag || frag === "top") continue;
        if (/^https?:\/\//.test(base)) {
          const own = base.match(/^https?:\/\/(?:www\.)?triaperformance\.com(\/.*)?$/);
          if (!own) continue;
          base = own[1] || "/";
        } else if (base.startsWith("//") || /^(mailto|tel):/.test(base)) {
          continue;
        }
        const targetFile = base === "" ? full : fileFor(base.split("?")[0]);
        // A missing PAGE is the first test's job, not this one's.
        if (!targetFile) continue;
        if (!idsIn(targetFile).has(frag)) {
          broken.push(`#${frag} on ${base || "this page"}  (linked from /${file})`);
        }
      }
    }
    if (broken.length) {
      const unique = [...new Set(broken.map((b) => b.split("  (")[0]))];
      throw new Error(
        `${unique.length} dead anchor(s):\n       ` + broken.slice(0, 20).join("\n       ")
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

  console.log(`  ${passed}/4 internal-link checks passed`);
}
