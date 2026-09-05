/* The workout-link library, resolved. Added September 5, 2026.
 *
 * Joins site/_data/workoutLinks.json (code -> library key + slot) against
 * site/_data/library.json (which owns every tool's member URL in every
 * language) and hands the template a flat, already-answered list.
 *
 * WHY A DATA FILE AND NOT TEMPLATE LOGIC: the interesting column is COVERAGE —
 * which of the three languages a given code actually resolves in. Computing it
 * needs a lookup inside a loop inside a loop, and Nunjucks' selectattr has
 * already burned this repo once (see the note at the top of
 * partials/members-library.njk, where it silently returned the whole list and
 * rendered all 13 cards under all three headings).
 *
 * The same resolution runs in TWO places and must agree in both: here, at build
 * time, for the page Iván copies links from; and in the auth service at request
 * time (automation/members-area/auth_service/app.py, destination_for). Neither
 * holds a URL of its own — both read library.json — which is the property that
 * keeps them from drifting. tests/workout-links.test.js asserts it.
 */
const links = require("./workoutLinks.json");
const library = require("./library.json");

const LANGS = ["es", "en", "pt"];

function memberUrl(lang, toolKey) {
  const live = (library[lang] || {}).live || [];
  const hit = live.find((i) => i.key === toolKey);
  return hit ? hit.memberUrl : null;
}

function toolName(toolKey) {
  const hit = ((library.es || {}).live || []).find((i) => i.key === toolKey);
  return hit ? hit.name : toolKey;
}

module.exports = function () {
  const rows = links.links.map((l) => {
    const dest = {};
    const missing = [];
    for (const lang of LANGS) {
      const url = memberUrl(lang, l.tool);
      dest[lang] = url;
      if (!url) missing.push(lang.toUpperCase());
    }
    return {
      code: l.code,
      path: "/w/" + l.code,
      tool: l.tool,
      toolName: toolName(l.tool),
      slot: l.slot,
      note: l.note || null,
      dest,
      missing,
    };
  });

  // Group by tool, preserving registry order, so the page reads as "one block
  // per artifact" rather than as 34 undifferentiated rows.
  const groups = [];
  for (const row of rows) {
    let g = groups.find((x) => x.tool === row.tool);
    if (!g) {
      g = { tool: row.tool, toolName: row.toolName, rows: [] };
      groups.push(g);
    }
    g.rows.push(row);
  }

  // The anti-drift half. A gated tool that is live in library.json and has no
  // /w/ code is a tool Iván cannot link from a workout — which is exactly the
  // failure mode that hit the inventory tables three times (cyclistcore Aug 24,
  // strength Sep 2, hombro Sep 3): the row gets added when someone audits, never
  // when the tool ships. Surfaced on the page AND asserted in the test suite.
  const coded = new Set(links.links.map((l) => l.tool));
  const uncovered = ((library.es || {}).live || [])
    .filter((i) => !coded.has(i.key))
    .map((i) => ({ key: i.key, name: i.name }));

  return { rows, groups, uncovered, count: rows.length };
};
