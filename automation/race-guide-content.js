#!/usr/bin/env node
/**
 * race-guide-content.js — parses the race execution guide's markdown into a
 * structured AST, keyed by language.
 *
 * Home doc:  race-execution-guide-brief.md
 * SOURCE:    race-execution-guide/guia-de-ejecucion-{es,en,pt}.md
 * Consumers: automation/build-race-guide-pages.js  (members pages)
 *            automation/build-race-guide-pdf.js    (PDFs)
 *
 * ⚠️ THERE IS NOT ONE WORD OF GUIDE COPY IN THIS FILE, and that is the whole
 * point. The three markdown files are the single authoring surface: Iván edits
 * them, both builders regenerate, and no sentence exists in two places.
 *
 * The markdown's shape IS the contract. The parser is deliberately strict and
 * throws on anything it does not recognise, because a silently dropped table is
 * the defect that ships.
 *
 * Cloned from fueling-guide-content.js, September 11, 2026. The two are
 * near-identical and deliberately separate: extracting a shared parser means
 * touching a builder that shipped the same day. ⚠️ That call is logged in
 * race-execution-guide-brief.md §13 — the THIRD long guide is where the
 * duplication stops paying and the generalisation is worth doing.
 *
 * Every scope line in the markdown is a copy of methodology.md §14, and every
 * pacing and debrief rule is a copy of §9. Move it there first, then in the
 * markdown — never here.
 */

const fs = require("fs");
const path = require("path");

const LANGS = {
  es: { md: "guia-de-ejecucion-es.md", pdf: "guia-de-ejecucion.pdf" },
  en: { md: "guia-de-ejecucion-en.md", pdf: "race-execution-guide.pdf" },
  pt: { md: "guia-de-ejecucion-pt.md", pdf: "guia-de-execucao.pdf" },
};

const SRC = path.join(__dirname, "..", "race-execution-guide");

/* The guide is: H1 title, H2 strapline, then scope + coach letter + 16 numbered
   sections + sources = 19. Verified across all three languages before the
   generators were first run. The first draft used `# Parte I/II/III` headings
   mid-document, which this parser cannot represent — it was flattened before
   any builder ran, not after. */
const SECTIONS = 19;

/* ---------------------------------------------------------------- inline */

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Markdown inline → HTML. Order matters: code first so its content is inert. */
function inline(raw) {
  let s = esc(raw);
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, t) => `<strong>${t}</strong>`);
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, (_, p, t) => `${p}<em>${t}</em>`);
  // A newline INSIDE a paragraph is a deliberate soft break — the signature
  // blocks and the contact pair. Joining them with a space printed
  // "Iván Founder & Head Coach" as one line in the fuelling build.
  s = s.replace(/\n/g, "<br>");
  return s;
}

/** Same, but stripped to plain text — for the PDF bookmark list and <title>. */
const plain = (raw) =>
  raw.replace(/\n/g, " ").replace(/`([^`]+)`/g, "$1")
     .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
     .replace(/\*\*([^*]+)\*\*/g, "$1")
     .replace(/\*([^*\n]+)\*/g, "$1")
     .trim();

/* ----------------------------------------------------------------- parse */

const isTableDivider = (l) => /^\|[\s:|-]+\|$/.test(l) && l.includes("-");
const cells = (l) => l.replace(/^\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());

function parseBlocks(lines, file) {
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    if (/^---+$/.test(line.trim())) { out.push({ t: "hr" }); i++; continue; }

    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      out.push({ t: "h" + m[1].length, x: m[2].trim() });
      i++; continue;
    }

    // blockquote — the guide uses these for the coach's own rules and the
    // worked cut-off arithmetic. Rendered as a callout, never dropped.
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "").trim()); i++; }
      out.push({ t: "quote", x: buf.filter(Boolean).join("\n") });
      continue;
    }

    // table: header row, divider, then body rows
    if (line.startsWith("|") && isTableDivider(lines[i + 1] || "")) {
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) { rows.push(cells(lines[i])); i++; }
      out.push({ t: "table", head, rows });
      continue;
    }

    // unordered list — a continuation line is indented
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && (/^[-*]\s+/.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
        if (/^[-*]\s+/.test(lines[i])) items.push(lines[i].replace(/^[-*]\s+/, "").trim());
        else items[items.length - 1] += " " + lines[i].trim();
        i++;
      }
      out.push({ t: "ul", items });
      continue;
    }

    // ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && (/^\d+\.\s+/.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
        if (/^\d+\.\s+/.test(lines[i])) items.push(lines[i].replace(/^\d+\.\s+/, "").trim());
        else items[items.length - 1] += " " + lines[i].trim();
        i++;
      }
      out.push({ t: "ol", items });
      continue;
    }

    // paragraph — runs until a blank line or a block-opening marker
    const buf = [];
    while (i < lines.length && lines[i].trim() &&
           !/^(#{1,4}\s|[-*]\s|\d+\.\s|>|\||---+$)/.test(lines[i])) {
      buf.push(lines[i].trim()); i++;
    }
    if (!buf.length) throw new Error(`${file}: parser stuck at line ${i + 1}: ${JSON.stringify(line)}`);
    out.push({ t: "p", x: buf.join("\n") });
  }
  return out;
}

/** Group the flat block list into { title, subtitle, sections:[{heading, blocks}] }. */
function structure(blocks, file) {
  let title = null, subtitle = null;
  const sections = [];
  let cur = null;

  for (const b of blocks) {
    if (b.t === "h1") {
      if (title) throw new Error(`${file}: a second H1 ("${b.x}") — this guide has exactly one, and mid-document H1s cannot be represented`);
      title = b.x; continue;
    }
    if (b.t === "h2") {
      if (!subtitle && !sections.length) { subtitle = b.x; continue; } // the strapline
      cur = { heading: b.x, blocks: [] };
      sections.push(cur);
      continue;
    }
    if (b.t === "hr") continue;                 // markdown rules are section joins
    if (!cur) continue;                          // anything before section 1 is chrome
    cur.blocks.push(b);
  }

  if (!title || !subtitle) throw new Error(`${file}: missing H1 title or H2 strapline`);
  if (sections.length !== SECTIONS) {
    throw new Error(`${file}: expected ${SECTIONS} sections, parsed ${sections.length} — the three languages must stay structurally identical`);
  }
  return { title, subtitle, sections };
}

/* ---------------------------------------------------------------- export */

const content = {};
for (const [lang, cfg] of Object.entries(LANGS)) {
  const file = path.join(SRC, cfg.md);
  const md = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("\n");
  const doc = structure(parseBlocks(md, cfg.md), cfg.md);
  content[lang] = { lang, filename: cfg.pdf, source: cfg.md, ...doc };
}

// Cross-language structural check: same section count AND same table shapes.
const shape = (c) => c.sections.map((s) =>
  s.blocks.filter((b) => b.t === "table").map((t) => `${t.head.length}x${t.rows.length}`).join(",")
).join("|");
const ref = shape(content.es);
for (const l of ["en", "pt"]) {
  if (shape(content[l]) !== ref) {
    throw new Error(`table shapes diverge between es and ${l} — a row or column was added in one language only`);
  }
}

// The stop list is the one block in this guide that is load-bearing for safety.
// It is permitted by a NARROW exception to methodology.md §11 (published
// athlete-facing guides only), so a build that silently lost it would ship a
// guide whose "cuándo parar" section is a heading with nothing under it.
for (const l of Object.keys(LANGS)) {
  const km30 = content[l].sections.find((s) => /^9\./.test(s.heading));
  if (!km30) throw new Error(`${l}: section 9 (kilometre 30) not found`);
  const warn = km30.blocks.filter((b) => (b.t === "h3" || b.t === "h4") && /⚠️/.test(b.x));
  if (!warn.length) throw new Error(`${l}: section 9 has no ⚠️ stop-list heading — the safety block was lost or renamed`);
}

module.exports = content;
module.exports.inline = inline;
module.exports.plain = plain;
module.exports.SECTIONS = SECTIONS;

if (require.main === module) {
  for (const l of Object.keys(LANGS)) {
    const c = content[l];
    const n = (t) => c.sections.reduce((a, s) => a + s.blocks.filter((b) => b.t === t).length, 0);
    console.log(`${l}: "${c.title}" — ${c.sections.length} sections, ${n("table")} tables, ${n("p")} paragraphs, ${n("quote")} quotes, ${n("ul") + n("ol")} lists`);
  }
  console.log("cross-language table shapes: identical");
  console.log("stop list present in all three languages");
}
