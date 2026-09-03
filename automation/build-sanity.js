#!/usr/bin/env node
/**
 * build-sanity.js — template-leakage check over the BUILT site.
 *
 * Why this exists: on September 3, 2026 two Nunjucks comments rendered as
 * visible text on /members/activacion/ and Iván found them on the live page.
 * The cause is a trap specific to how the tool pages are written:
 *
 *     Almost the whole page sits inside {% raw %}, and inside a raw block a
 *     Nunjucks comment is NOT a comment. It is literal text. It ships.
 *
 * Nothing caught it. The build succeeded, the page worked, every routine
 * assertion passed, and the 390px sweep was clean — because the leak is
 * perfectly valid markup that simply says the wrong thing to a human. The only
 * check that discriminates is looking at the built HTML for delimiters that
 * should never survive a build. Same lesson as layout-check.js: the build being
 * green says nothing about what the reader sees.
 *
 * Usage (from repo root):
 *     npx @11ty/eleventy
 *     node automation/build-sanity.js
 *
 * Scope it:  BUILD_SANITY_DIR=_site/members node automation/build-sanity.js
 *
 * Exits non-zero on any finding, so it can gate a deploy later.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.BUILD_SANITY_DIR || "_site";

/* Each pattern is something that must never appear in output HTML.
 * `where` narrows the search to the visible body where a raw-block leak shows
 * up; a few of these legitimately appear inside <script> or <pre>. */
const PATTERNS = [
  { re: /\{#/g,            name: "Nunjucks comment ({# ... #})",
    note: "Almost certainly written inside {% raw %}, where comments are literal text." },
  { re: /\{%-?\s*(if|for|set|include|block|extends)\b/g, name: "Unrendered Nunjucks tag" },
  { re: /\{\{\s*[a-zA-Z_$][\w.$\[\]'\"-]*\s*(\|[^}]*)?\}\}/g, name: "Unrendered Nunjucks expression" }
];

/* Strip the places where these delimiters are legal in a shipped page:
 * inline scripts (JS template literals, regexes), <pre>/<code> samples. */
function visibleHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<pre[\s\S]*?<\/pre>/gi, " ")
    .replace(/<code[\s\S]*?<\/code>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith(".html")) out.push(p);
  }
  return out;
}

if (!fs.existsSync(ROOT)) {
  console.error("No build found at " + ROOT + " — run `npx @11ty/eleventy` first.");
  process.exit(2);
}

const files = walk(ROOT, []);
let findings = 0;

for (const file of files) {
  const visible = visibleHtml(fs.readFileSync(file, "utf8"));
  for (const { re, name, note } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(visible)) !== null) {
      findings++;
      const start = Math.max(0, m.index - 60);
      const snippet = visible.slice(start, m.index + 90).replace(/\s+/g, " ").trim();
      console.log("\n  LEAK  " + file.replace(ROOT, "") + "  —  " + name);
      console.log("        ..." + snippet + "...");
      if (note) console.log("        " + note);
    }
  }
}

console.log("\n" + (findings
  ? "FAILED — " + findings + " template leak(s) across " + files.length + " pages"
  : "PASSED — " + files.length + " pages, no template leakage"));
process.exit(findings ? 1 : 0);
