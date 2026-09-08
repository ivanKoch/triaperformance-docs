/**
 * Behavioural tests for the two routine engines, run against the REAL built
 * pages in _site/ — same rule as zones-ui.test.js: the thing under test is what
 * Caddy will serve, not what a template renders in isolation.
 *
 * Why this file exists (September 8, 2026). Both engines were changed on the
 * same day, and both changes are about WHEN a clock runs — the hardest thing to
 * verify by reading, and the exact class of bug this repo has repeatedly found
 * only by walking a routine end to end (`strength-tool.js`'s done overlay, the
 * activation engine's Spanish "Ejercicio N de M" on four translated pages).
 * Twenty-five paid pages sit on these two files.
 *
 * The clock is faked. Every assertion about a countdown is made by advancing
 * simulated seconds, so a test that says "45 seconds later" costs nothing and
 * cannot be flaky.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "_site");

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

/* ------------------------------------------------------------------ clock */
/* Replaces the window's timers with a controllable one. Installed BEFORE the
   engine is injected, so the engine's setInterval closes over this and not
   jsdom's. `tick(n)` runs every callback that would have fired in n seconds. */
function installClock(w) {
  let now = 0, seq = 0;
  const timers = new Map();
  w.setInterval = (fn, ms) => { const i = ++seq; timers.set(i, { fn, ms, next: now + ms }); return i; };
  w.setTimeout = (fn, ms) => { const i = ++seq; timers.set(i, { fn, ms, next: now + ms, once: true }); return i; };
  w.clearInterval = (i) => timers.delete(i);
  w.clearTimeout = (i) => timers.delete(i);
  return function tick(seconds) {
    const end = now + seconds * 1000;
    for (let guard = 0; guard < 100000; guard++) {
      let pick = null;
      for (const entry of timers) if (entry[1].next <= end && (!pick || entry[1].next < pick[1].next)) pick = entry;
      if (!pick) break;
      now = pick[1].next;
      if (pick[1].once) timers.delete(pick[0]); else pick[1].next = now + pick[1].ms;
      pick[1].fn();
    }
    now = end;
  };
}

/** Load a built page. Scripts run; external <script src> are neutralised. */
function load(relPath, opts) {
  const file = path.join(SITE, relPath, "index.html");
  if (!fs.existsSync(file)) throw new Error("not built: " + relPath + " — run `npm run build` first");
  let html = fs.readFileSync(file, "utf8");
  // Every external script goes: local engines are injected by hand below (after
  // the fake clock is in place), third-party tags would reach the network.
  html = html.replace(/<script[^>]*\ssrc="[^"]*"[^>]*><\/script>/g, "");
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true,
    url: "https://triaperformance.com/" + relPath + "/"
  });
  const w = dom.window;
  // jsdom gaps that every real browser fills. Stubbed so a missing API cannot
  // throw inside an unrelated handler on the same click and mask a real failure.
  w.HTMLElement.prototype.scrollIntoView = function () {};
  if (!w.matchMedia) w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  if (opts && opts.autoChain !== undefined) {
    try { w.localStorage.setItem("tp.routine.autoChain", opts.autoChain ? "1" : "0"); } catch (e) {}
  }
  return w;
}

function injectEngine(w, name) {
  const src = fs.readFileSync(path.join(ROOT, "site", "assets", "js", name + ".js"), "utf8");
  const s = w.document.createElement("script");
  s.textContent = src;
  w.document.body.appendChild(s);
}

const $ = (w, id) => w.document.getElementById(id);
const txt = (w, id) => ($(w, id) ? $(w, id).textContent.trim() : null);
const shown = (w, id) => {
  const el = $(w, id);
  return !!el && !el.hidden && el.style.display !== "none";
};

/* ================================================================ STRENGTH */
/* /members/rodillas/ — the page the feedback was about. Two setup questions,
   then the engine is built from the answers. */
function knees(opts) {
  const w = load("members/rodillas", opts);
  const tick = installClock(w);
  $(w, "setupGo").click();                     // defaults: home x roller
  assert.ok(w.STRENGTH_DATA, "setup did not build STRENGTH_DATA");
  injectEngine(w, "strength-tool");
  return { w: w, tick: tick };
}

/** Walk forward with the skip button until the named exercise is on screen. */
function skipTo(w, name) {
  $(w, "startBtn").click();
  for (let i = 0; i < 60; i++) {
    if (txt(w, "exName") === name) return;
    $(w, "skipBtn").click();
  }
  throw new Error('never reached "' + name + '" (stopped at "' + txt(w, "exName") + '")');
}

test("strength: home states an estimated time to completion", () => {
  const { w } = knees();
  const pill = w.document.querySelector(".context-pill").textContent;
  assert.ok(/≈\s*\d+\s*min/.test(pill), "no estimate in the context pill: " + pill);
  const mins = Number(pill.match(/≈\s*(\d+)\s*min/)[1]);
  assert.ok(mins >= 15 && mins <= 90, "implausible estimate for a knee routine: " + mins);
});

test("strength: the estimate counts timed work, rep-work and rest", () => {
  const { w } = knees();
  const ex = [];
  w.STRENGTH_DATA.phases.forEach((p) => p.exercises.forEach((e) => ex.push(e)));
  let expected = 0;
  ex.forEach((e, i) => {
    const ceil = e.holdMax || e.hold;
    const per = e.hold ? ((e.hold + ceil) / 2) * (e.holdSides || 1) : 40;
    expected += e.sets * per;
    expected += (e.rest || 0) * Math.max(0, e.sets - (i === ex.length - 1 ? 1 : 0));
  });
  const mins = Number(w.document.querySelector(".context-pill").textContent.match(/≈\s*(\d+)/)[1]);
  assert.strictEqual(mins, Math.max(1, Math.round(expected / 60)));
});

test("strength: a 45s isometric gets a timer, and it does not start itself", () => {
  const { w, tick } = knees();
  skipTo(w, "Sentadilla isométrica en pared");
  assert.ok(shown(w, "holdBlock"), "no hold timer on the wall sit");
  assert.strictEqual(txt(w, "holdTime"), "0:45");
  assert.strictEqual(txt(w, "holdBtn"), "Iniciar 45s");
  tick(10);
  assert.strictEqual(txt(w, "holdTime"), "0:45", "the hold timer started on its own");
});

test("strength: the hold counts down, completes, and does NOT complete the set", () => {
  const { w, tick } = knees();
  skipTo(w, "Sentadilla isométrica en pared");
  const before = txt(w, "setCounter");
  $(w, "holdBtn").click();
  tick(20);
  assert.strictEqual(txt(w, "holdTime"), "0:25");
  assert.strictEqual(txt(w, "holdBtn"), "Detener");
  tick(25);
  assert.strictEqual(txt(w, "holdTime"), "✓");
  assert.strictEqual(txt(w, "holdBtn"), "Repetir");
  assert.strictEqual(txt(w, "setCounter"), before,
    "the hold advanced the set — the athlete decides when a set is done, not the clock");
});

test("strength: a ranged per-side hold counts to the ceiling and marks the floor", () => {
  const { w, tick } = knees();
  skipTo(w, "Plancha copenhague (modificada)");
  assert.strictEqual(txt(w, "holdBtn"), "Lado 1 · 20-30s");
  assert.strictEqual(txt(w, "holdTime"), "0:30", "a range must count down from its ceiling");
  $(w, "holdBtn").click();
  tick(19);
  assert.strictEqual(txt(w, "holdBtn"), "Detener", "20s minimum announced early");
  tick(1);
  assert.strictEqual(txt(w, "holdBtn"), "Listo ✓", "20s minimum not announced");
  $(w, "holdBtn").click();                       // stop after the minimum = side counted
  assert.strictEqual(txt(w, "holdBtn"), "Lado 2 · 20-30s");
});

test("strength: bailing BEFORE the minimum re-arms the same side", () => {
  const { w, tick } = knees();
  skipTo(w, "Plancha copenhague (modificada)");
  $(w, "holdBtn").click();
  tick(8);
  $(w, "holdBtn").click();
  assert.strictEqual(txt(w, "holdBtn"), "Lado 1 · 20-30s", "an aborted hold counted as a side");
  assert.strictEqual(txt(w, "holdTime"), "0:30");
});

test("strength: rep-based exercises get no timer", () => {
  const { w } = knees();
  skipTo(w, "Sentadilla búlgara");
  assert.ok(!shown(w, "holdBlock"), "a reps prescription was given a clock");
});

test("strength: moving off an exercise resets its hold", () => {
  const { w, tick } = knees();
  skipTo(w, "Sentadilla isométrica en pared");
  $(w, "holdBtn").click();
  tick(20);
  $(w, "prevBtn").click();
  $(w, "skipBtn").click();
  assert.strictEqual(txt(w, "holdTime"), "0:45", "a hold survived leaving the exercise");
});

/* ============================================================== ACTIVATION */
/* /members/core/ defines its routine inline, so it exercises the partial's
   default path with no setup UI in the way. */
function core(opts) {
  const w = load("members/core", opts);
  const tick = installClock(w);
  injectEngine(w, "activation-tool");
  return { w: w, tick: tick };
}

test("activation: home states an estimated time to completion", () => {
  const { w } = core();
  assert.ok(/≈\s*\d+\s*min/.test(w.document.querySelector(".context-pill").textContent));
});

test("activation: the routine opens PAUSED on exercise 1 with its cue visible", () => {
  const { w, tick } = core({ autoChain: false });
  $(w, "startBtn").click();
  assert.ok($(w, "tab-workout").classList.contains("active"));
  assert.strictEqual(txt(w, "mainBtn"), "Empezar");
  assert.ok(txt(w, "exCue").length > 0, "no cue on screen at the moment the athlete must read it");
  const t0 = txt(w, "ringTime");
  tick(8);
  assert.strictEqual(txt(w, "ringTime"), t0, "the countdown started before the athlete did");
});

test("activation: tapping start runs the block; pausing says Reanudar, not Empezar", () => {
  const { w, tick } = core({ autoChain: false });
  $(w, "startBtn").click();
  const t0 = txt(w, "ringTime");
  $(w, "mainBtn").click();
  assert.strictEqual(txt(w, "mainBtn"), "Pausar");
  tick(5);
  assert.notStrictEqual(txt(w, "ringTime"), t0);
  $(w, "mainBtn").click();
  assert.strictEqual(txt(w, "mainBtn"), "Reanudar");
});

test("activation: manual mode has no rest countdown between blocks", () => {
  const { w, tick } = core({ autoChain: false });
  $(w, "startBtn").click();
  const firstNum = txt(w, "exNum");
  $(w, "mainBtn").click();
  tick(400);                       // far past any single block
  assert.notStrictEqual(txt(w, "exNum"), firstNum, "the routine never advanced");
  assert.ok(!shown(w, "restOverlay"), "a rest countdown ran in manual mode");
  assert.strictEqual(txt(w, "mainBtn"), "Empezar", "the next block started itself");
});

test("activation: the Auto switch persists and restores hands-free chaining", () => {
  const a = core({ autoChain: false });
  assert.strictEqual($(a.w, "autoToggle").getAttribute("aria-pressed"), "false");
  $(a.w, "autoToggle").click();
  assert.strictEqual($(a.w, "autoToggle").getAttribute("aria-pressed"), "true");
  assert.strictEqual(a.w.localStorage.getItem("tp.routine.autoChain"), "1");

  const b = core({ autoChain: true });
  assert.strictEqual($(b.w, "autoToggle").getAttribute("aria-pressed"), "true");
  $(b.w, "startBtn").click();
  assert.strictEqual(txt(b.w, "mainBtn"), "Pausar", "auto mode did not start the routine");
});

test("activation: the rest screen carries the next exercise's cue", () => {
  const { w, tick } = core({ autoChain: true });
  $(w, "startBtn").click();
  for (let i = 0; i < 400 && !shown(w, "restOverlay"); i++) tick(1);
  assert.ok(shown(w, "restOverlay"), "never reached a rest");
  assert.ok(txt(w, "restCue").length > 0, "the rest screen still shows a name and no instruction");
});

test("activation: a routine can be walked to the end and shows the done screen", () => {
  const { w, tick } = core({ autoChain: true });
  $(w, "startBtn").click();
  tick(3600);
  assert.ok(shown(w, "doneOverlay"), "the routine never finished");
  assert.ok(Number(txt(w, "statEx")) > 0);
});

console.log("\n" + passed + " routine-engine assertions passed");
