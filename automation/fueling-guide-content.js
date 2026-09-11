#!/usr/bin/env node
/**
 * fueling-guide-content.js — parses the fuelling guide's markdown into a
 * structured AST, keyed by language.
 *
 * Home doc:  fueling-guide-brief.md
 * SOURCE:    fueling-guide/kit-de-combustible-{es,en,pt}.md
 * Consumers: automation/build-fueling-guide-pages.js  (members pages)
 *            automation/build-fueling-guide-pdf.js    (PDFs)
 *
 * ⚠️ THERE IS NOT ONE WORD OF GUIDE COPY IN THIS FILE, and that is the whole
 * point. The three markdown files are the single authoring surface: Iván edits
 * them, both builders regenerate, and no sentence exists in two places. The
 * predecessor guide's failure mode was a number living in eight files; this
 * design makes the equivalent impossible for prose as well.
 *
 * It also means the markdown's shape IS the contract. The parser is deliberately
 * strict and throws on anything it does not recognise, because a silently
 * dropped table is the defect that ships.
 *
 * Every fuelling figure in the markdown is a copy of methodology.md §8. Move it
 * there first, then in the markdown — never here.
 */

const fs = require("fs");
const path = require("path");

const LANGS = {
  es: { md: "kit-de-combustible-es.md", pdf: "kit-de-combustible.pdf" },
  en: { md: "kit-de-combustible-en.md", pdf: "the-fuel-kit.pdf" },
  pt: { md: "kit-de-combustible-pt.md", pdf: "kit-de-combustivel.pdf" },
};

const SRC = path.join(__dirname, "..", "fueling-guide");

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
  // A newline INSIDE a paragraph is a deliberate soft break. Only three exist
  // in the guide — the two signature blocks and the contact pair — and joining
  // them with a space printed "Iván Founder & Head Coach" as one line.
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
           !/^(#{1,4}\s|[-*]\s|\d+\.\s|\||---+$)/.test(lines[i])) {
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
    if (b.t === "h1") { title = b.x; continue; }
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
  if (sections.length !== 16) {
    throw new Error(`${file}: expected 16 sections, parsed ${sections.length} — the three languages must stay structurally identical`);
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

module.exports = content;
module.exports.inline = inline;
module.exports.plain = plain;

if (require.main === module) {
  for (const l of Object.keys(LANGS)) {
    const c = content[l];
    const n = (t) => c.sections.reduce((a, s) => a + s.blocks.filter((b) => b.t === t).length, 0);
    console.log(`${l}: "${c.title}" — ${c.sections.length} sections, ${n("table")} tables, ${n("p")} paragraphs, ${n("ul") + n("ol")} lists`);
  }
  console.log("cross-language table shapes: identical");
}
