/**
 * Tests for the pace converter, run against the REAL built HTML.
 *
 * Two things are being proved and they fail differently:
 *   1. the arithmetic — a converter that is wrong is worse than no converter,
 *      because it looks authoritative and nobody re-checks it;
 *   2. the wiring — four fields that are each individually correct but do not
 *      update one another is a blank tool, and it passes every maths test.
 *
 * Runs against _site/, so `npm run build` must have run first. Same reasoning as
 * zones-ui.test.js: the thing under test is what Caddy will serve, not what the
 * templates would render in-process.
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

function load(relPath) {
  const file = path.join(SITE, relPath, "index.html");
  if (!fs.existsSync(file)) throw new Error("not built: " + relPath + " — run `npm run build` first");
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/<script src="\/assets\/js\/pace-converter\.js[^"]*"><\/script>/g,
    () => "<script>" +
      fs.readFileSync(path.join(__dirname, "..", "site", "assets", "js", "pace-converter.js"), "utf8") +
      "</script>");
  html = html.replace(/<script[^>]*src="https?:\/\/[^"]*"[^>]*><\/script>/g, "");
  return new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    // The site's nav script calls matchMedia on every click that reaches the
    // document. jsdom does not implement it, so without this stub a passing
    // assertion still prints a TypeError from an unrelated component and buries
    // the real output. Stubbed, not silenced — the nav is not under test here.
    beforeParse(w) {
      w.matchMedia = () => ({
        matches: false, media: "", addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {}
      });
    }
  }).window;
}

const val = (w, id) => w.document.getElementById(id).value;

function type(w, id, value) {
  const el = w.document.getElementById(id);
  el.value = String(value);
  el.dispatchEvent(new w.Event("input", { bubbles: true }));
}

function setPaceKm(w, m, s) {
  w.document.getElementById("pc-km-min").value = String(m);
  type(w, "pc-km-sec", s);
}

/* ------------------------------------------------------------ arithmetic */

test("loads showing 5:00 /km, and every other field agrees with it", () => {
  const w = load("conversor-de-ritmo");
  assert.strictEqual(val(w, "pc-km-min"), "5");
  assert.strictEqual(val(w, "pc-km-sec"), "00");
  // 300 s × 1.609344 = 482.8 s = 8:03 per mile
  assert.strictEqual(val(w, "pc-mi-min") + ":" + val(w, "pc-mi-sec"), "8:03");
  assert.strictEqual(val(w, "pc-kmh"), "12");      // 3600 / 300
  assert.strictEqual(val(w, "pc-mph"), "7,46");    // 12 / 1.609344, es separator
});

test("a pace typed in min/km reaches all three other fields", () => {
  const w = load("conversor-de-ritmo");
  setPaceKm(w, 4, 30);
  // 270 s × 1.609344 = 434.52 s, which rounds to 7:15 per mile; 3600/270 = 13.33 km/h
  assert.strictEqual(val(w, "pc-mi-min") + ":" + val(w, "pc-mi-sec"), "7:15");
  assert.strictEqual(val(w, "pc-kmh"), "13,33");
  assert.strictEqual(val(w, "pc-mph"), "8,28");
});

test("the conversion runs backwards from mile pace", () => {
  const w = load("conversor-de-ritmo");
  w.document.getElementById("pc-mi-min").value = "8";
  type(w, "pc-mi-sec", "00");
  // 480 s / 1.609344 = 298.3 s = 4:58 per km
  assert.strictEqual(val(w, "pc-km-min") + ":" + val(w, "pc-km-sec"), "4:58");
});

test("the conversion runs backwards from km/h and from mph", () => {
  const w = load("conversor-de-ritmo");
  type(w, "pc-kmh", "12,5");                       // comma — the es keyboard
  assert.strictEqual(val(w, "pc-km-min") + ":" + val(w, "pc-km-sec"), "4:48");

  const x = load("conversor-de-ritmo");
  type(x, "pc-mph", "7.0");                        // dot, on a Spanish page
  // 7 mph = 11.265 km/h = 319.6 s/km = 5:20
  assert.strictEqual(val(x, "pc-km-min") + ":" + val(x, "pc-km-sec"), "5:20");
});

test("a comma is accepted on the English page and a dot on the Spanish one", () => {
  // The decimal mark someone types comes from their keyboard, not from the page
  // they happen to be reading. Rejecting either one reads as a broken field.
  const en = load("en/pace-converter");
  type(en, "pc-kmh", "12,5");
  assert.strictEqual(val(en, "pc-km-min") + ":" + val(en, "pc-km-sec"), "4:48");
  assert.strictEqual(val(en, "pc-mph"), "7.77", "en must render with a dot");
});

/* ------------------------------------------------------------- treadmill */

test("the treadmill readout gives the two settings either side, with real paces", () => {
  const w = load("conversor-de-ritmo");
  setPaceKm(w, 4, 30);                             // 13.333 km/h — no such setting
  const chips = w.document.querySelectorAll("#pc-tread-kmh .pc-chip");
  assert.strictEqual(chips.length, 2, "expected the settings below and above");
  assert.strictEqual(chips[0].querySelector("strong").textContent, "13,3 km/h");
  assert.strictEqual(chips[0].querySelector("em").textContent, "4:31 / km");
  assert.strictEqual(chips[1].querySelector("strong").textContent, "13,4 km/h");
  assert.strictEqual(chips[1].querySelector("em").textContent, "4:29 / km");
});

test("a pace that IS a treadmill setting shows one chip, not an invented second", () => {
  const w = load("conversor-de-ritmo");
  setPaceKm(w, 5, 0);                              // 12.0 km/h exactly
  const chips = w.document.querySelectorAll("#pc-tread-kmh .pc-chip");
  assert.strictEqual(chips.length, 1);
  assert.ok(chips[0].classList.contains("pc-chip--exact"));
});

test("the mph settings are steps of the mph dial, not a converted km/h step", () => {
  // A US treadmill moves in 0.1 mph. Rounding the km/h step and converting it
  // would print speeds that machine cannot be set to.
  const w = load("conversor-de-ritmo");
  setPaceKm(w, 4, 30);                             // 8.285 mph
  const chips = w.document.querySelectorAll("#pc-tread-mph .pc-chip");
  assert.strictEqual(chips[0].querySelector("strong").textContent, "8,2 mph");
  assert.strictEqual(chips[1].querySelector("strong").textContent, "8,3 mph");
});

/* -------------------------------------------------------------- guards */

test("nothing is reported as an error while someone is still typing", () => {
  // "13" passes through "1", which is 60:00 per kilometre. Flashing an error at
  // the first keystroke of a valid entry is the bug this guards.
  const w = load("conversor-de-ritmo");
  type(w, "pc-kmh", "1");
  assert.strictEqual(w.document.getElementById("pc-error").hidden, true);
  assert.strictEqual(val(w, "pc-km-min"), "5", "an out-of-range value must not propagate");
});

test("leaving a field out of range explains itself and snaps back", () => {
  const w = load("conversor-de-ritmo");
  setPaceKm(w, 4, 30);
  const el = w.document.getElementById("pc-kmh");
  el.value = "1";
  el.dispatchEvent(new w.Event("focusout", { bubbles: true }));
  assert.strictEqual(w.document.getElementById("pc-error").hidden, false);
  assert.strictEqual(val(w, "pc-km-min") + ":" + val(w, "pc-km-sec"), "4:30");
});

test("clearing both km boxes does not discard a pace entered elsewhere", () => {
  // STATE, not the km boxes, is the tool's memory. Reading it back off the boxes
  // would snap to 5:00 here and silently lose what the athlete just entered.
  const w = load("conversor-de-ritmo");
  type(w, "pc-mph", "8");                          // 12.8748 km/h = 279.6 s = 4:40 /km
  const kmMin = w.document.getElementById("pc-km-min");
  kmMin.value = "";
  w.document.getElementById("pc-km-sec").value = "";
  kmMin.dispatchEvent(new w.Event("focusout", { bubbles: true }));
  assert.strictEqual(val(w, "pc-km-min") + ":" + val(w, "pc-km-sec"), "4:40");
});

test("the reset link goes back to 5:00 /km", () => {
  const w = load("conversor-de-ritmo");
  setPaceKm(w, 3, 30);
  w.document.getElementById("pc-reset").dispatchEvent(new w.Event("click", { bubbles: true }));
  assert.strictEqual(val(w, "pc-km-min") + ":" + val(w, "pc-km-sec"), "5:00");
});

/* --------------------------------------------------- the built-in table */

test("the reference table is in the HTML, not drawn by JS", () => {
  // It is this page's only indexable content. A table rendered client-side is a
  // page with a hero and nothing else as far as a crawler is concerned.
  const html = fs.readFileSync(path.join(SITE, "conversor-de-ritmo", "index.html"), "utf8");
  assert.ok(html.includes("<th scope=\"row\">3:00</th>"), "3:00 row missing from the served HTML");
  assert.ok(html.includes("<th scope=\"row\">8:00</th>"), "8:00 row missing from the served HTML");
  const rows = (html.match(/<th scope="row">/g) || []).length;
  assert.strictEqual(rows, 21, "expected 21 rows, 3:00 to 8:00 every 15 seconds");
});

test("the table and the tool agree — no second implementation of the maths", () => {
  const w = load("conversor-de-ritmo");
  const rows = w.document.querySelectorAll(".pc-table tbody tr");
  rows.forEach((row) => {
    const cells = row.querySelectorAll("th, td");
    const [m, s] = cells[0].textContent.split(":").map(Number);
    setPaceKm(w, m, s);
    assert.strictEqual(
      val(w, "pc-mi-min") + ":" + val(w, "pc-mi-sec").padStart(2, "0"),
      cells[1].textContent,
      "table and tool disagree on the mile pace for " + cells[0].textContent
    );
  });
});

/* ------------------------------------------------- all three languages */

test("every language and both skins load and convert", () => {
  ["conversor-de-ritmo", "en/pace-converter", "pt/conversor-de-ritmo",
   "members/conversor-de-ritmo", "members/en/pace-converter", "members/pt/conversor-de-ritmo"
  ].forEach((url) => {
    const w = load(url);
    setPaceKm(w, 4, 0);
    assert.strictEqual(val(w, "pc-mi-min") + ":" + val(w, "pc-mi-sec"), "6:26", url);
    assert.ok(w.document.querySelectorAll("#pc-tread-kmh .pc-chip").length >= 1, url);
  });
});

test("the members copies are dark and drop the public cross-sell", () => {
  ["members/conversor-de-ritmo", "members/en/pace-converter", "members/pt/conversor-de-ritmo"
  ].forEach((url) => {
    const w = load(url);
    assert.ok(w.document.getElementById("pc").classList.contains("pc--dark"), url + " is not dark");
    assert.strictEqual(w.document.querySelector(".pc-cross"), null, url + " still has the cross-sell");
  });
  const pub = load("conversor-de-ritmo");
  assert.ok(pub.document.querySelector(".pc-cross"), "the public page must keep the cross-link");
});

console.log("\n" + passed + " passed" + (process.exitCode ? " — WITH FAILURES" : "") + "\n");
