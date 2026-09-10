#!/usr/bin/env node
/**
 * THE PUBLISH GATE (part 2 of 2: what only exists after a build).
 *
 *     node automation/race-page-check.js          # check _site
 *     node automation/race-page-check.js --quiet  # only failures
 *
 * Exit code 1 on any failure, so it can gate a deploy.
 *
 * WHY THIS EXISTS. Nineteen race pages built from one template is, structurally,
 * what a search engine calls a doorway set: the same headings with one token
 * swapped. Part 1 (site/_data/races.js) refuses to publish a race whose data is
 * missing or copied from another city. This half checks the things that are only
 * true of the rendered page — that hreflang actually resolves, that the schema
 * says what the page says, that the title survived the 60-character clamp, and
 * that the same plan costs the same in three languages.
 *
 * IT CHECKS THE OUTPUT, NOT THE INTENTION. Every one of these has already been
 * wrong once in this repo while the source looked correct: a `.plan-chip` class
 * that no loaded stylesheet defined, a members page that shipped Spanish-only
 * while its own brief claimed three languages, a view whose "fixed" note
 * disagreed with the runtime. Reading the built file is the only check that
 * cannot be satisfied by a good intention.
 */

const fs = require("fs");
const path = require("path");

const REPO = path.dirname(__dirname);
const SITE = path.join(REPO, "_site");
const QUIET = process.argv.includes("--quiet");

const failures = [];
const notes = [];
function fail(page, msg) { failures.push(`${page}: ${msg}`); }

/** Decode the handful of entities that appear in this content. Comparing schema
 *  to DOM is the whole point of the exercise, so the comparison has to see the
 *  same characters the reader does. */
function unescapeHtml(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

function ldBlocks(html) {
  const out = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    try { out.push(JSON.parse(m[1])); }
    catch (e) { out.push({ __broken: e.message }); }
  }
  return out;
}

// --- locate the built race pages from the data, not by globbing, so a page that
// --- failed to build at all is a failure rather than an absence nobody noticed.
const races = require(path.join(SITE, "..", "site", "_data", "races.js"))();
if (!races.all.length) {
  console.log("No race pages in the build. Nothing to check.");
  process.exit(0);
}

const byId = {};
for (const p of races.all) (byId[p.id] = byId[p.id] || []).push(p);

for (const page of races.all) {
  const file = path.join(SITE, page.url, "index.html");
  const label = page.url;

  if (!fs.existsSync(file)) { fail(label, "page is in the data but was not built"); continue; }
  const html = fs.readFileSync(file, "utf8");

  // 1. hreflang: one per language this race declares, and each target must
  //    actually exist on disk. A dangling alternate is worse than none.
  for (const sibling of byId[page.id]) {
    const re = new RegExp(`hreflang="${sibling.lang}" href="[^"]*${sibling.url.replace(/\//g, "\\/")}"`);
    if (!re.test(html)) fail(label, `hreflang for "${sibling.lang}" missing or pointing elsewhere`);
    if (!fs.existsSync(path.join(SITE, sibling.url, "index.html"))) {
      fail(label, `hreflang points at ${sibling.url}, which was not built`);
    }
  }
  if (!/hreflang="x-default"/.test(html)) fail(label, "no x-default");

  // 2. Title: the clamp appends an ellipsis when a title overruns 60 characters.
  //    A truncated title is a title nobody wrote.
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  if (!title) fail(label, "no <title>");
  if (title.includes("…")) fail(label, `title was truncated by the 60-char clamp: "${title}"`);
  if (page.year && !title.includes(String(page.year))) {
    fail(label, `race has a confirmed date but the title carries no year: "${title}"`);
  }

  // 3. Breadcrumb: four nodes. One that stops at the hub hides the page from
  //    sitelinks and tells the reader nothing about where they are.
  const crumb = (html.match(/<p class="breadcrumb">([\s\S]*?)<\/p>/) || [])[1] || "";
  // ⚠️ Strip the tags BEFORE splitting. The first version of this line split the
  // raw HTML on "/" — which is also inside every href — so it counted five or
  // more nodes on a three-node crumb and could never fail. A check that cannot
  // fail is worse than no check: it reports green and buys false confidence.
  const nodes = unescapeHtml(crumb.replace(/<[^>]*>/g, "|"))
    .split("/").map((x) => x.replace(/\|/g, "").trim()).filter(Boolean).length;
  if (nodes < 4) fail(label, `breadcrumb has ${nodes} nodes, expected 4`);

  // 4. H1 appears exactly once.
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fail(label, `${h1s} <h1> elements, expected exactly 1`);

  // 5. Schema must say what the page says.
  const blocks = ldBlocks(html);
  const broken = blocks.filter((b) => b.__broken);
  if (broken.length) fail(label, `invalid JSON-LD: ${broken[0].__broken}`);

  const faqLd = blocks.find((b) => b["@type"] === "FAQPage");
  const faqDl = (html.match(/race-faq-list[^>]*>([\s\S]*?)<\/dl>/) || [])[1];
  if (faqDl) {
    if (!faqLd) fail(label, "visible FAQ with no FAQPage JSON-LD");
    else {
      const dom = [...faqDl.matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)]
        .map((m) => [unescapeHtml(m[1]).trim(), unescapeHtml(m[2]).trim()]);
      const sch = (faqLd.mainEntity || [])
        .map((q) => [String(q.name).trim(), String((q.acceptedAnswer || {}).text || "").trim()]);
      if (dom.length !== sch.length) {
        fail(label, `FAQ mismatch: ${dom.length} visible, ${sch.length} in schema`);
      } else {
        dom.forEach(([q, a], i) => {
          if (q !== sch[i][0]) fail(label, `FAQ question ${i + 1} differs between DOM and schema`);
          if (a !== sch[i][1]) fail(label, `FAQ answer ${i + 1} differs between DOM and schema`);
        });
      }
    }
  } else if (faqLd) {
    fail(label, "FAQPage JSON-LD with no visible FAQ — that is the penalty case, not the safe one");
  }

  const evLd = blocks.find((b) => b["@type"] === "SportsEvent");
  if (page.nextEditionDate && !evLd) fail(label, "confirmed date but no SportsEvent JSON-LD");
  if (evLd && evLd.startDate !== page.nextEditionDate) {
    fail(label, `SportsEvent startDate ${evLd.startDate} != data ${page.nextEditionDate}`);
  }
  if (!page.nextEditionDate && evLd) {
    fail(label, "SportsEvent emitted without a confirmed date");
  }

  // 6. Hero image files referenced must exist in the build.
  for (const m of html.matchAll(/\/assets\/images\/races\/([^"?\s]+)/g)) {
    if (!fs.existsSync(path.join(SITE, "assets", "images", "races", m[1]))) {
      fail(label, `hero image ${m[1]} is referenced but not in the build`);
    }
  }
}

// 7. Ladder SHAPE across languages — not price.
//
// Grok's template proposed failing a page when "plan family/price differs by
// language". Half of that is right and half contradicts a standing decision:
// price in this business is a purchasing-power lever, so the Portuguese
// marathon ladder costs US$ 24/36 against US$ 49.99/59.99 in Spanish and
// English ON PURPOSE (pricing-and-positioning.md). A check that flags it would
// cry wolf on every run until someone silenced the whole script.
//
// What IS worth failing is the ladder's SHAPE: the three language siblings of
// one race are an hreflang cluster, so a reader who switches language should
// find the same offer structure — same difficulties, same durations — even at
// a different price. A missing cell in one language is a broken translation of
// the offer, not a local decision.
const shapeByLang = {};
const plans = require(path.join(REPO, "site", "_data", "plans.js"))();
for (const lang of ["es", "en", "pt"]) {
  shapeByLang[lang] = new Set();
  for (const p of plans.byLanguage[lang]) {
    if (p.sport !== "Running" || !["42 km", "21 km"].includes(p.distance)) continue;
    if (p.metric !== "hr" || p.strength || p.weightLoss) continue;
    shapeByLang[lang].add(`${p.distance}/${p.difficulty}/${p.weeks}w`);
  }
}
const langsWithRaces = [...new Set(races.all.map((p) => p.lang))];
const distances = [...new Set(races.all.map((p) => p.distance === "42k" ? "42 km" : "21 km"))];
for (const lang of langsWithRaces) {
  for (const other of langsWithRaces) {
    if (lang >= other) continue;
    for (const cell of shapeByLang[lang]) {
      if (!distances.includes(cell.split("/")[0])) continue;
      if (!shapeByLang[other].has(cell)) {
        fail(`ladder/${other}`, `${cell} exists in ${lang} but not in ${other} — the offer differs by language`);
      }
    }
  }
}

// --- report
if (notes.length && !QUIET) {
  console.log(`\n⚠️  ${notes.length} note(s):`);
  for (const n of notes) console.log(`   ${n}`);
}
if (failures.length) {
  console.log(`\n🚫 ${failures.length} failure(s):`);
  for (const f of failures) console.log(`   ${f}`);
  console.log("\nRace pages did not pass. Nothing about this is advisory — fix or unpublish.");
  process.exit(1);
}
if (!QUIET) {
  console.log(`\n✅ ${races.all.length} race page(s) passed: hreflang, title, breadcrumb, schema/DOM, images.`);
  if (races.blocked && races.blocked.length) {
    console.log(`   (${races.blocked.length} race(s) blocked earlier by the data gate and correctly not built.)`);
  }
}
