/**
 * DOM smoke tests for the zones calculator UI, run against the REAL built HTML.
 *
 * zones-calc.test.js proves the arithmetic. This proves the wiring: that the
 * page a visitor loads actually reaches that arithmetic and renders it. Those
 * are different failures — correct maths behind a step that never reveals
 * itself is a blank page, and it passes every maths test.
 *
 * Runs against _site/, so `npm run build` must have run first. Deliberately
 * reads built output rather than rendering templates in-process: the thing
 * being tested is what Caddy will serve.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

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

/** Load a built page with scripts executing, and return its window. */
function load(relPath) {
  const file = path.join(SITE, relPath, "index.html");
  if (!fs.existsSync(file)) throw new Error("not built: " + relPath + " — run `npm run build` first");
  let html = fs.readFileSync(file, "utf8");

  // Inline the two local scripts. JSDOM's resource loader would need a server
  // and network; the point here is the behaviour, not the transport.
  html = html.replace(/<script src="\/assets\/js\/(zones-calc|zones-ui)\.js[^"]*"><\/script>/g,
    (_, name) => "<script>" +
      fs.readFileSync(path.join(__dirname, "..", "site", "assets", "js", name + ".js"), "utf8") +
      "</script>");
  // Strip the third-party analytics/tracking tags — irrelevant here and they
  // would try to hit the network.
  html = html.replace(/<script[^>]*src="https?:\/\/[^"]*"[^>]*><\/script>/g, "");

  const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true });
  // jsdom has no layout engine, so scrollIntoView is simply absent. Every real
  // browser has it; stubbing here keeps a jsdom gap from throwing inside a
  // handler and masking a genuine failure further down the same click.
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  return dom.window;
}

function setTime(w, id, m, s) {
  w.document.getElementById(id + "-m").value = String(m);
  w.document.getElementById(id + "-s").value = String(s);
}
function setNum(w, id, v) { w.document.getElementById(id).value = String(v); }
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
function visible(w, id) { const e = w.document.getElementById(id); return e && !e.hidden; }
function text(w, id) { return w.document.getElementById(id).textContent.replace(/\s+/g, " ").trim(); }

console.log("\nzones calculator UI (against built _site)\n");

/* ------------------------------------------------------------------ swim */

test("swim page pre-selects its sport and skips the protocol step", () => {
  const w = load("calculadora-de-zonas/natacion");
  assert.strictEqual(w.document.getElementById("zc").dataset.preselect, "swimming");
  assert.ok(!visible(w, "zc-step-protocol"), "swimming has one fixed test — no protocol choice to make");
  assert.ok(visible(w, "zc-step-input"), "inputs should be showing immediately");
  assert.ok(w.document.getElementById("zc-t400-m"), "400m minute field missing");
  assert.ok(w.document.getElementById("zc-t200-s"), "200m second field missing");
});

test("swim: 6:00 / 2:50 renders CSS 1:35 and a seven-row zone table", () => {
  const w = load("calculadora-de-zonas/natacion");
  setTime(w, "zc-t400", 6, 0);
  setTime(w, "zc-t200", 2, 50);
  click(w, w.document.getElementById("zc-go"));

  assert.ok(visible(w, "zc-step-results"), "results step never revealed");
  assert.ok(text(w, "zc-threshold").includes("1:35"), "CSS not shown: " + text(w, "zc-threshold"));
  assert.strictEqual(w.document.querySelectorAll("#zc-tables .zc-table tbody tr.zc-special").length > 0, true,
    "Zone X / Y should be visually marked");
  const zoneCells = [...w.document.querySelectorAll("#zc-tables .zc-table tbody td.zc-z")].map((td) => td.textContent);
  assert.strictEqual(zoneCells.length, 7, "expected 7 zone rows, got " + zoneCells.length);
  assert.ok(zoneCells[2].startsWith("X"), "X must sit third, between Z2 and Z3 — got " + zoneCells[2]);
});

test("swim rejects a 400 that is not slower than the 200, instead of computing nonsense", () => {
  const w = load("calculadora-de-zonas/natacion");
  setTime(w, "zc-t400", 2, 30);
  setTime(w, "zc-t200", 2, 50);
  click(w, w.document.getElementById("zc-go"));
  assert.ok(visible(w, "zc-error"), "no error shown for an impossible pair");
  assert.ok(!visible(w, "zc-step-results"), "results must not render from an invalid test");
});

/* --------------------------------------------------------------- cycling */

test("cycling page shows the protocol step with all three tests", () => {
  const w = load("calculadora-de-zonas/ciclismo");
  assert.ok(visible(w, "zc-step-protocol"), "cycling is the only sport with a protocol choice");
  const ids = [...w.document.querySelectorAll("[data-protocol]")].map((b) => b.dataset.protocol);
  assert.deepStrictEqual(ids, ["30min", "20min", "2x8min"]);
});

test("cycling 2x8' offers no HR field and says why in the results", () => {
  const w = load("calculadora-de-zonas/ciclismo");
  click(w, w.document.querySelector('[data-protocol="2x8min"]'));
  assert.ok(!w.document.getElementById("zc-hr"), "2x8 must not render a heart-rate field it would ignore");
  setNum(w, "zc-pw", 295);
  click(w, w.document.getElementById("zc-go"));
  assert.ok(text(w, "zc-threshold").includes("266"), "FTP should be 90% of 295 = 266");
  assert.ok(text(w, "zc-tables").toLowerCase().includes("solo sirve para potencia"),
    "the athlete must be told why there are no HR zones");
});

test("cycling 30' with both numbers renders two tables and the priority note", () => {
  const w = load("calculadora-de-zonas/ciclismo");
  click(w, w.document.querySelector('[data-protocol="30min"]'));
  setNum(w, "zc-pw", 250);
  setNum(w, "zc-hr", 160);
  click(w, w.document.getElementById("zc-go"));
  assert.strictEqual(w.document.querySelectorAll("#zc-tables .zc-table").length, 2, "expected power + HR tables");
  assert.ok(visible(w, "zc-priority"), "priority note should appear when two metrics could disagree");
  assert.ok(text(w, "zc-threshold").includes("250"), "FTP at 100% of a 30' 250W");
});

test("cycling 20' takes HR over the final 15 minutes, per decision 14", () => {
  const w = load("calculadora-de-zonas/ciclismo");
  click(w, w.document.querySelector('[data-protocol="20min"]'));
  const label = w.document.querySelector('label[for="zc-hr"]').textContent;
  assert.ok(/15/.test(label), "HR field should ask for the final 15 minutes, got: " + label);
});

/* --------------------------------------------------------------- running */

test("running skips the protocol step and offers all three metrics", () => {
  const w = load("calculadora-de-zonas/running");
  assert.ok(!visible(w, "zc-step-protocol"), "running has exactly one protocol");
  assert.ok(w.document.getElementById("zc-pace-m"), "pace field missing");
  assert.ok(w.document.getElementById("zc-hr"), "HR field missing");
  assert.ok(w.document.getElementById("zc-pw"), "running power field missing");
});

test("running 4:00/km renders Z2 slower than threshold — the inversion guard, in the page", () => {
  const w = load("calculadora-de-zonas/running");
  setTime(w, "zc-pace", 4, 0);
  click(w, w.document.getElementById("zc-go"));
  const rows = [...w.document.querySelectorAll("#zc-tables .zc-table tbody tr")];
  const z2 = rows.find((r) => (r.querySelector("td.zc-z") || {}).textContent?.startsWith("2"));
  assert.ok(z2, "no Z2 row rendered");
  assert.ok(/4:36 – 5:16/.test(z2.textContent),
    "Z2 must read 4:36 – 5:16, i.e. SLOWER than the 4:00 threshold. Got: " + z2.textContent.trim());
});

/* ----------------------------------------------------------- hub + gating */

test("the hub renders the picker with no sport pre-selected", () => {
  const w = load("calculadora-de-zonas");
  assert.strictEqual(w.document.getElementById("zc").dataset.preselect, "");
  assert.ok(visible(w, "zc-step-sport"));
  assert.ok(!visible(w, "zc-step-input"), "inputs should wait for a sport");
  click(w, w.document.querySelector('.zc-choice[data-sport="running"]'));
  assert.ok(visible(w, "zc-step-input"), "picking a sport should reveal the inputs");
});

test("public pages show the email capture after a result; the members copy never does", () => {
  const pub = load("calculadora-de-zonas/running");
  setTime(pub, "zc-pace", 4, 0);
  click(pub, pub.document.getElementById("zc-go"));
  assert.ok(visible(pub, "zc-capture"), "public page should offer the workouts after the result");

  const mem = load("members/calculadora-de-zonas");
  assert.strictEqual(mem.document.getElementById("zc").dataset.capture, "no");
  assert.strictEqual(mem.document.getElementById("zc-capture"), null,
    "members already paid — no capture block should exist in their copy at all");
  assert.ok(mem.document.getElementById("zc").classList.contains("zc--dark"),
    "members-area interactive tools are dark (brand-guidelines.md §7.1)");
  // And it must still work.
  click(mem, mem.document.querySelector('.zc-choice[data-sport="running"]'));
  setTime(mem, "zc-pace", 4, 0);
  click(mem, mem.document.getElementById("zc-go"));
  assert.ok(visible(mem, "zc-step-results"), "the members copy must calculate too");
});

test("clicking inside a plan card does not get mistaken for a sport choice", () => {
  // Both the sport buttons and the hidden plan sets carry data-sport. A naive
  // delegated handler would treat a click in a plan card as picking a sport and
  // reset the whole tool.
  const w = load("calculadora-de-zonas/running");
  setTime(w, "zc-pace", 4, 0);
  click(w, w.document.getElementById("zc-go"));
  const planSet = w.document.querySelector('.zc-plan-set[data-sport="cycling"]');
  if (planSet) {
    click(w, planSet);
    assert.ok(visible(w, "zc-step-results"), "results were reset by a click inside a plan set");
  }
});

console.log("\n" + passed + " passed" + (process.exitCode ? " — WITH FAILURES" : "") + "\n");
