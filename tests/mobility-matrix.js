/* Verification for /members/movilidad/ — the post-exercise mobility matrix.
   Home doc: mobility-brief.md.

   Runs against the BUILT page, not the source, so it also proves the Nunjucks
   raw block survived intact. Extracts the two IIFEs and evaluates them in a
   fake DOM just complete enough for the setup script to attach its handlers.

   node tests/mobility-matrix.js            (after: npx @11ty/eleventy) */

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const PAGE = "_site/members/movilidad/index.html";
let pass = 0;
const fails = [];
function ok(cond, msg) { if (cond) pass++; else fails.push(msg); }
function eq(a, b, msg) { ok(a === b, msg + " — got " + JSON.stringify(a) + ", want " + JSON.stringify(b)); }

if (!fs.existsSync(PAGE)) {
  console.error("MISSING " + PAGE + " — run `npx @11ty/eleventy` first.");
  process.exit(2);
}
const html = fs.readFileSync(PAGE, "utf8");

/* ---------------------------------------------------------------- 1. BUILD */
ok(!/\{%|\{\{|\{#/.test(html), "1.1 no surviving Nunjucks delimiter in the built page");
ok(html.includes('data-val="tri"'), "1.2 the five sport buttons rendered");
ok(html.includes("setup-opts--wrap"), "1.3 the sport group carries the wrap modifier");
ok(html.includes("colchoneta y una pared"), "1.4 the equipment promise is on the page");

/* Pull the two scripts out and run them against a minimal DOM. */
const start = html.indexOf("window.MOBILITY_MATRIX");
/* The FIRST closing tag after the matrix, not the last in the document: the
   base layout appends analytics scripts after this one. */
const end = html.indexOf("</script>", start);
ok(start > 0 && end > start, "1.5 the matrix script is present in the built page");
const src = html.slice(start, end);

const handlers = [];
function el(id) {
  return { id, hidden: false, innerHTML: "", textContent: "", className: "",
           dataset: {}, style: {}, classList: { add() {}, remove() {} },
           setAttribute() {}, getAttribute() { return null; },
           addEventListener(t, f) { handlers.push({ id, t, f }); },
           querySelectorAll() { return []; }, prepend() {}, appendChild() {} };
}
const document = {
  _els: {},
  getElementById(id) { return this._els[id] || (this._els[id] = el(id)); },
  querySelectorAll() { return []; }, querySelector() { return el("tool"); },
  createElement() { return el("created"); },
  body: { appendChild() {} }
};
const sandbox = { window: {}, document, console };
sandbox.window.document = document;
vm.createContext(sandbox);
try { vm.runInContext(src, sandbox); } catch (e) { fails.push("1.6 script threw: " + e.message); }
const M = sandbox.window.MOBILITY_MATRIX;
ok(!!M, "1.6 MOBILITY_MATRIX evaluated");
if (!M) { console.log("EARLY EXIT — the matrix script did not evaluate:"); fails.forEach(f => console.log("  x " + f)); process.exit(1); }

const SPORTS = ["run", "bike", "swim", "tri", "all"];
const MINS = ["10", "20", "30"];

/* ------------------------------------------------------- 2. ALL 15 ROUTINES */
const built = {};
SPORTS.forEach(s => MINS.forEach(m => {
  let r = null;
  try { r = M.build(s, m); } catch (e) { fails.push("2.x build(" + s + "," + m + ") threw: " + e.message); }
  if (r) { built[s + "|" + m] = r; pass++; }
}));
eq(Object.keys(built).length, 15, "2.1 fifteen routines build");

/* Unknown inputs must throw rather than silently produce a broken routine. */
let threwSport = false, threwMins = false;
try { M.build("nope", "10"); } catch (e) { threwSport = true; }
try { M.build("run", "45"); } catch (e) { threwMins = true; }
ok(threwSport, "2.2 an unknown sport throws");
ok(threwMins, "2.3 an unknown duration throws (45 is the recovery-day tool, not this one)");

/* ------------------------------------------------------------- 3. INTEGRITY */
Object.entries(built).forEach(([key, r]) => {
  const ex = r.phases.flatMap(p => p.exercises);
  const names = ex.map(e => e.name);
  eq(new Set(names).size, names.length, "3.1 " + key + " has no duplicated exercise");
  ok(ex.every(e => e.cue && e.cue.length > 40), "3.2 " + key + " every exercise carries a real cue");
  ok(ex.every(e => ["uni", "bi", "alt"].includes(e.mode)), "3.3 " + key + " every mode is valid");
  ok(ex.every(e => e.secs > 0), "3.4 " + key + " every exercise has an explicit hold");
  ok(r.title && r.subtitle && r.why && r.doneSub, "3.5 " + key + " carries all its copy");
  eq(r.restSeconds, 10, "3.6 " + key + " rest is 10s, not the engine default of 15");
});

/* The additive design: 20 must contain all of 10, and 30 all of 20. That is the
   whole structure — if it ever stops being true, the tiers have been hand-
   edited into three separate routines. */
SPORTS.forEach(s => {
  const n10 = built[s + "|10"].phases.flatMap(p => p.exercises).map(e => e.name);
  const n20 = built[s + "|20"].phases.flatMap(p => p.exercises).map(e => e.name);
  const n30 = built[s + "|30"].phases.flatMap(p => p.exercises).map(e => e.name);
  ok(n10.every(n => n20.includes(n)), "3.7 " + s + ": 20min contains all of 10min");
  ok(n20.every(n => n30.includes(n)), "3.8 " + s + ": 30min contains all of 20min");
});

/* The close has to be last, and only in the tiers that have one. */
SPORTS.forEach(s => {
  eq(built[s + "|10"].phases.some(p => p.name === "Cierre"), false, "3.9 " + s + ": 10min has no closing block");
  const p20 = built[s + "|20"].phases;
  const p30 = built[s + "|30"].phases;
  eq(p20[p20.length - 1].name, "Cierre", "3.10 " + s + ": 20min ends on the closing block");
  eq(p30[p30.length - 1].name, "Cierre", "3.11 " + s + ": 30min ends on the closing block");
  eq(p20[p20.length - 1].exercises.map(e => e.name).join("|"), "Piernas en la pared",
     "3.12 " + s + ": 20min closes on legs up the wall");
  eq(p30[p30.length - 1].exercises.map(e => e.name).join("|"), "Piernas en la pared|Respiración de cierre",
     "3.13 " + s + ": 30min closes on the wall then the breathing");
});


/* ------------------------------------------------------------- 4. DURATION
   The engine's own formula, copied exactly from activation-tool.js estMinutes():
   work + (totalBlocks - 1) * REST, where uni counts as two blocks. If this
   drifts from the engine the numbers reported to Iván are fiction. */
function minutes(r) {
  const ex = r.phases.flatMap(p => p.exercises);
  const blocks = ex.reduce((a, e) => a + (e.mode === "uni" ? 2 : 1), 0);
  const work = ex.reduce((a, e) => a + e.secs * (e.mode === "uni" ? 2 : 1), 0);
  return (work + (blocks - 1) * r.restSeconds) / 60;
}
const TARGET = { "10": [8.5, 11.5], "20": [18, 22], "30": [27.5, 32] };
const table = [];
SPORTS.forEach(s => MINS.forEach(m => {
  const mins = minutes(built[s + "|" + m]);
  const [lo, hi] = TARGET[m];
  table.push([s + "|" + m, mins.toFixed(1)]);
  ok(mins >= lo && mins <= hi, "4.x " + s + "|" + m + " lands in band — " + mins.toFixed(1) + " min, want " + lo + "-" + hi);
}));

/* --------------------------------------------------------------- 5. CLINICAL
   The three reversals of the source doc, asserted rather than trusted. These
   are the checks that matter: each of the three looks completely normal on the
   page, which is exactly why a reviewer reading for fluency would let it back
   in. Same reasoning as the sleeper-stretch assertions on the shoulder tool. */
const allText = JSON.stringify(M.library).toLowerCase();

ok(!/sleeper/.test(allText), "5.1 no sleeper stretch, in any wording");
ok(!/rotaci[oó]n interna/.test(allText), "5.2 no passive internal-rotation stretch for the shoulder");
ok(!/marco de (la )?(una )?puerta|umbral/.test(allText), "5.3 no doorframe pec stretch");
ok(!/camello/.test(allText.replace(/gato-camello/g, "")), "5.4 no camel pose (gato-camello is a different exercise)");
ok(!/agresiv/.test(allText), "5.5 nothing is prescribed aggressively");
ok(!/\brana\b|drag[oó]n alado|yin/.test(allText), "5.6 no Yin work — that is the recovery-day tool");

/* The cross-body stretch must carry the cue that makes it safe, not just exist. */
const cb = M.library.crossBody.cue.toLowerCase();
ok(/om[oó]plato|esc[aá]pula/.test(cb) && /se vaya adelante/.test(cb),
   "5.7 the cross-body cue carries the scapula-depression instruction");

/* The IT band correction has to say WHY, or the next pass restores the roller. */
ok(/cintilla iliotibial no se estira/.test(M.library.itCross.cue.toLowerCase()),
   "5.8 the IT band cue states that the band itself does not lengthen");

/* Box breathing is linked, not rebuilt. */
ok(/\/members\/respiracion\//.test(M.library.breathClose.cue), "5.9 the close links out to the breathing tool");
ok(!/caja/.test(M.library.breathClose.cue.toLowerCase().replace(/respiraci[oó]n en caja/g, "")),
   "5.10 box breathing is not reimplemented here");

/* Every sport hands off somewhere for pain. methodology.md §11. */
SPORTS.forEach(s => {
  ok(/\/members\/(rodillas|aquiles|hombro)\//.test(M.pain[s]), "5.11 " + s + " pain aside points at a real tool");
  ok(/m[eé]dic/.test(M.pain[s]), "5.12 " + s + " pain aside ends at a doctor, not at a routine");
});

/* Swimming must not be upper-body only — that was the source's gap. */
const swimNames = built["swim|10"].phases.flatMap(p => p.exercises).map(e => e.name).join(" ").toLowerCase();
ok(/tobillo|empeine/.test(swimNames), "5.13 the swim 10-minute core includes leg work");

/* --------------------------------------------------- 6. EQUIPMENT HONESTY
   The promise is a mat and a wall. No base exercise may REQUIRE a roller, a
   ball, a towel or a doorframe — those exist only as variants. */
const ALLOWED_TAGS = new Set(["Sin equipo", "Pared"]);
Object.entries(built).forEach(([key, r]) => {
  r.phases.flatMap(p => p.exercises).forEach(e => {
    ok(ALLOWED_TAGS.has(e.tag), "6.1 " + key + ": '" + e.name + "' needs only mat or wall — tag is '" + e.tag + "'");
  });
});
/* And the roller/ball work still has to BE there, as variants. */
const variantTags = new Set();
Object.values(M.library).forEach(e => (e.variants || []).forEach(v => variantTags.add(v.tag)));
ok(variantTags.has("Rodillo"), "6.2 roller work is preserved as variants");
ok(variantTags.has("Pelota"), "6.3 ball work is preserved as variants");
const withVariants = Object.values(M.library).filter(e => (e.variants || []).length).length;
ok(withVariants >= 6, "6.4 at least six exercises offer an alternative — got " + withVariants);


/* ------------------------------------------------- 8. TOOL-SPECIFIC CHROME
   The engine's default chrome comes from activationUi.json, which is keyed by
   language and says "Empezar activación →" / "Activación completa". On a
   mobility page that is simply wrong copy, and it is wrong in the two places
   an athlete actually reads: the button they press to start and the screen
   they see when they finish. */
ok(!/activaci[oó]n/i.test(M.ui.startRoutine), "8.1 the start button does not say activación");
ok(!/activaci[oó]n/i.test(M.doneTitle), "8.2 the done screen does not say activación");
/* The done title is markup, not an engine string — assert the id it is written
   into actually exists in the built page, because an override addressed at a
   missing element fails silently and looks like it worked. */
ok(/id="doneTitle"/.test(html), "8.4 the partial exposes an id for the done title");
SPORTS.forEach(s => MINS.forEach(m => {
  eq(built[s + "|" + m].kicker, "Movilidad", "8.3 " + s + "|" + m + " kicker is Movilidad");
}));

/* --------------------------------------------------------------- 7. REPORT */
console.log("\nDURATIONS (engine formula, rest 10s)\n");
const byS = {};
table.forEach(([k, v]) => { const [s, m] = k.split("|"); (byS[s] = byS[s] || {})[m] = v; });
console.log("sport   10min   20min   30min");
SPORTS.forEach(s => console.log(s.padEnd(8) + MINS.map(m => (byS[s][m] + "'").padEnd(8)).join("")));

console.log("\n" + pass + " checks passed, " + fails.length + " failed.");
if (fails.length) { console.log("\nFAILURES:"); fails.forEach(f => console.log("  ✗ " + f)); process.exit(1); }
console.log("✓ all green");
