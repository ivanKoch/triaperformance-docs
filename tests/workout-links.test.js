/**
 * Workout-link registry checks. Added September 5, 2026.
 *
 * WHY THIS EXISTS
 * A /w/ link pasted into a TrainingPeaks workout is FROZEN: a published plan is
 * a static snapshot, so every future application of that plan carries the link
 * exactly as it was pasted. A code that resolves to nothing cannot be fixed by
 * editing the workout — only by editing the registry, and only if somebody
 * notices. So the registry is checked at build time, not in production.
 *
 * The second assertion is the one that matters more over time. A gated tool that
 * is live in library.json with NO /w/ code is a tool Iván cannot link from a
 * workout, and that failure has a track record here: cyclistcore (Aug 24),
 * strength (Sep 2) and hombro (Sep 3) all shipped without their inventory rows,
 * three times in eleven days, because the row gets added when someone audits
 * rather than when the tool ships. This makes the fourth instance fail the build.
 *
 * Runs against the SOURCE data files plus the BUILT output, so `npm run build`
 * must have run first — the destination has to be a page that really exists,
 * not a path that merely reads correctly.
 */

const fs = require("fs");
const path = require("path");

const links = require("../site/_data/workoutLinks.json");
const library = require("../site/_data/library.json");
const resolve = require("../site/_data/workoutLinkTable.js");

const SITE = path.join(__dirname, "..", "_site");
const LANGS = ["es", "en", "pt"];

let failures = 0;
function check(name, ok, detail) {
  if (ok) return;
  failures++;
  console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`);
}

console.log("workout-links.test.js");

// ---------------------------------------------------------------------------
// 1. Codes are unique and URL-safe.
// ---------------------------------------------------------------------------
const seen = new Set();
for (const l of links.links) {
  check(`duplicate code "${l.code}"`, !seen.has(l.code));
  seen.add(l.code);
  check(
    `code "${l.code}" is not URL-safe`,
    /^[a-z0-9]+(-[a-z0-9]+)*$/.test(l.code),
    "lowercase, digits and single hyphens only — it gets typed by hand into TrainingPeaks"
  );
  check(`code "${l.code}" has no slot label`, typeof l.slot === "string" && l.slot.length > 0);
}

// ---------------------------------------------------------------------------
// 2. Every code names a tool that is LIVE in library.json (Spanish is the
//    reference language: everything ships there first).
// ---------------------------------------------------------------------------
const esKeys = new Set((library.es.live || []).map((i) => i.key));
for (const l of links.links) {
  check(
    `code "${l.code}" points at tool "${l.tool}"`,
    esKeys.has(l.tool),
    "no live library.json entry with that key"
  );
}

// ---------------------------------------------------------------------------
// 3. Every destination the registry can produce is a page that really exists in
//    the build. This is what catches a library.json memberUrl that was renamed
//    without its page, and vice versa.
// ---------------------------------------------------------------------------
const built = fs.existsSync(SITE);
check("_site/ exists", built, "run `npm run build` first");
if (built) {
  const table = resolve();
  for (const row of table.rows) {
    for (const lang of LANGS) {
      const url = row.dest[lang];
      if (!url) continue; // legitimately absent — recovery is ES-only today
      const file = path.join(SITE, url.replace(/^\/|\/$/g, ""), "index.html");
      check(
        `"${row.code}" → ${lang.toUpperCase()} ${url}`,
        fs.existsSync(file),
        "no built page at that path"
      );
    }
  }

  // The admin page itself must build, or Iván has nowhere to copy from.
  check(
    "/admin/enlaces/ builds",
    fs.existsSync(path.join(SITE, "admin", "enlaces", "index.html"))
  );
}

// ---------------------------------------------------------------------------
// 4. THE ANTI-DRIFT ASSERTION. Every live tool has at least one code.
// ---------------------------------------------------------------------------
const covered = new Set(links.links.map((l) => l.tool));
for (const item of library.es.live || []) {
  check(
    `tool "${item.key}" (${item.name}) has no /w/ code`,
    covered.has(item.key),
    "add one to site/_data/workoutLinks.json — a tool with no code cannot be linked from a workout"
  );
}

// ---------------------------------------------------------------------------
// 5. Slot vocabulary drift. Not a hard failure — a new slot is legitimate — but
//    a near-duplicate of an existing one is how a controlled vocabulary rots.
// ---------------------------------------------------------------------------
const slots = [...new Set(links.links.map((l) => l.slot))].sort();
console.log(`  ${links.links.length} codes · ${covered.size} tools · ${slots.length} distinct slots`);

if (failures) {
  console.error(`\n✗ workout-links: ${failures} failure(s)`);
  process.exit(1);
}
console.log("  ✓ all workout-link checks passed");
