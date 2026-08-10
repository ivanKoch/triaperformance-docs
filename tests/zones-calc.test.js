/**
 * Fixture tests for the zone math. Run: `npm test`
 *
 * These exist for one reason above all others: a pace zone table that has been
 * computed by MULTIPLYING instead of dividing looks completely plausible. The
 * numbers are still paces, still ascend, still bracket a believable range —
 * they are just all wrong, and wrong in a direction that puts easy zones faster
 * than threshold. No visual check catches it. An assertion does.
 *
 * Deliberately dependency-free (node's assert only) so it runs anywhere without
 * an install step, same reasoning as the stdlib-only backfill script.
 */

const assert = require("assert");
const path = require("path");
const Z = require(path.join(__dirname, "..", "site", "assets", "js", "zones-calc.js"));
const zones = require(path.join(__dirname, "..", "site", "_data", "zones.js"));

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ok   " + name);
  } catch (e) {
    console.error("  FAIL " + name + "\n       " + e.message);
    process.exitCode = 1;
  }
}

console.log("\nzone math\n");

/* ---------------------------------------------------------------- time I/O */

test("toSeconds converts minute+second inputs", () => {
  assert.strictEqual(Z.toSeconds(4, 30), 270);
  assert.strictEqual(Z.toSeconds("2", "50"), 170);
  assert.strictEqual(Z.toSeconds("", ""), 0);
});

test("formatPace pads seconds and rounds to the nearest second", () => {
  assert.strictEqual(Z.formatPace(275.86), "4:36");
  assert.strictEqual(Z.formatPace(245), "4:05");
  assert.strictEqual(Z.formatPace(0), "—");
});

/* -------------------------------------------------------------------- swim */

test("CSS matches Iván's worked example: 6:00 / 2:50 -> 1:35 per 100m", () => {
  const v = Z.css(Z.toSeconds(6, 0), Z.toSeconds(2, 50));
  assert.strictEqual(v, 95);
  assert.strictEqual(Z.formatPace(v), "1:35");
});

test("CSS shortcut is identical to the standard 200/(t400-t200) m/s form", () => {
  const t400 = 372, t200 = 176;
  const shortcut = Z.css(t400, t200);
  const viaVelocity = 100 / (200 / (t400 - t200)); // m/s -> seconds per 100m
  assert.ok(Math.abs(shortcut - viaVelocity) < 1e-9,
    `shortcut ${shortcut} vs velocity form ${viaVelocity}`);
});

test("CSS rejects an invalid pair where the 400 is not slower than the 200", () => {
  assert.strictEqual(Z.css(300, 300), null);
  assert.strictEqual(Z.css(300, 320), null);
});

/* --------------------------------------------------------- threshold power */

test("FTP multipliers: 30' = 100%, 20' = 95%, 2x8' = 90%", () => {
  assert.strictEqual(Z.thresholdPower(250, 1.0), 250);
  assert.strictEqual(Z.thresholdPower(250, 0.95), 238);
  assert.strictEqual(Z.thresholdPower(295, 0.90), 266); // avg of a 300 / 290 pair
});

test("running power from the 30' takes the average as-is, like pace", () => {
  const run30 = zones.protocols.running.find((p) => p.id === "30min");
  assert.strictEqual(run30.powerFactor, 1.0);
  assert.ok(run30.yields.includes("rftp"));
  assert.ok(run30.yields.includes("pace"));
});

/* ------------------------------------------- THE INVERSION GUARD (the point) */

test("pace zones sit on the correct side of threshold", () => {
  const threshold = Z.toSeconds(4, 0); // 240 s/km
  const table = zones.tables.running.pace;
  const rows = Z.buildZones(threshold, table, "pace");
  const byZone = Object.fromEntries(rows.map((r) => [r.zone, r]));

  // Z2 is 76-87% of threshold VELOCITY, i.e. slower running: bigger seconds.
  assert.ok(byZone["2"].low > threshold,
    `Z2 fast end ${byZone["2"].low}s should be SLOWER than threshold ${threshold}s — zones are inverted`);

  // Z4 is 102-115%: faster running, smaller seconds.
  assert.ok(byZone["4"].high < threshold,
    `Z4 slow end ${byZone["4"].high}s should be FASTER than threshold ${threshold}s — zones are inverted`);

  // The naive bug, stated explicitly so its signature is on record.
  const naive = threshold * 0.76;
  assert.ok(naive < threshold && byZone["2"].low > threshold,
    "multiplying pace by the percentage would place Z2 faster than threshold");
});

test("pace bands are ordered fast-to-slow and never cross", () => {
  const rows = Z.buildZones(Z.toSeconds(4, 0), zones.tables.running.pace, "pace");
  rows.forEach((r) => assert.ok(r.low < r.high, `zone ${r.zone}: low ${r.low} >= high ${r.high}`));
});

test("a known pace band computes exactly: Z2 off a 4:00/km threshold", () => {
  const rows = Z.buildZones(240, zones.tables.running.pace, "pace");
  const z2 = rows.find((r) => r.zone === "2");
  assert.strictEqual(z2.display, "4:36 – 5:16"); // 240/0.87 and 240/0.76
});

/* -------------------------------------------------------------- rate zones */

test("heart-rate zones multiply: LTHR 160, Z2 at 81-90%", () => {
  const rows = Z.buildZones(160, zones.tables.running.lthr, "rate");
  const z2 = rows.find((r) => r.zone === "2");
  assert.strictEqual(z2.display, "130 – 144");
});

test("power zones multiply: FTP 250, cycling Z2 at 70-83%", () => {
  const rows = Z.buildZones(250, zones.tables.cycling.ftp, "rate");
  const z2 = rows.find((r) => r.zone === "2");
  assert.strictEqual(z2.display, "175 – 208");
});

/* ------------------------------------------------------ the data itself */

test("all six tables exist with seven zones each, in model order", () => {
  const expected = { running: ["lthr", "pace", "rftp"], cycling: ["ftp", "lthr"], swimming: ["cv"] };
  assert.deepStrictEqual(zones.metricsBySport, expected);
  for (const sport in zones.tables) {
    for (const metric in zones.tables[sport]) {
      const t = zones.tables[sport][metric];
      assert.strictEqual(t.length, 7, `${sport}/${metric} has ${t.length} zones`);
      assert.deepStrictEqual(t.map((r) => r.zone), ["1", "2", "X", "3", "Y", "4", "5"]);
    }
  }
});

test("running and cycling share one LTHR table (decision 10)", () => {
  assert.deepStrictEqual(zones.tables.running.lthr, zones.tables.cycling.lthr);
});

test("every zone is a real band — floor below ceiling, no zero-width rows", () => {
  for (const sport in zones.tables) {
    for (const metric in zones.tables[sport]) {
      zones.tables[sport][metric].forEach((r) => {
        assert.ok(r.ceiling > r.floor, `${sport}/${metric} zone ${r.zone} has no width`);
      });
    }
  }
});

test("bands are contiguous — no gap between one zone's ceiling and the next zone's floor", () => {
  for (const sport in zones.tables) {
    for (const metric in zones.tables[sport]) {
      const t = zones.tables[sport][metric];
      for (let i = 1; i < t.length; i++) {
        assert.strictEqual(t[i].floor, t[i - 1].ceiling,
          `${sport}/${metric}: zone ${t[i].zone} starts at ${t[i].floor} but ${t[i - 1].zone} ends at ${t[i - 1].ceiling}`);
      }
    }
  }
});


/* ------------------------------------------- end-to-end, per sport/protocol */
/* These walk the same decision path the UI takes (zones-ui.js calculate()) and
   assert the numbers an athlete would actually read. Primitives being right does
   not prove the wiring is: picking the wrong table for a metric, or the wrong
   protocol multiplier, produces a page that renders perfectly and lies. */

function proto(sport, id) {
  return zones.protocols[sport].find((p) => p.id === id);
}
function band(rows, zone) { return rows.find((r) => r.zone === zone).display; }

test("E2E swimming: 6:00 / 2:50 -> CSS 1:35, Z2 by pace", () => {
  const cv = Z.css(Z.toSeconds(6, 0), Z.toSeconds(2, 50));
  const rows = Z.buildZones(cv, zones.tables.swimming.cv, "pace");
  assert.strictEqual(Z.formatPace(cv), "1:35");
  assert.strictEqual(band(rows, "2"), "1:44 – 1:53"); // 95/0.91 and 95/0.84
  assert.ok(rows.find((r) => r.zone === "2").low > cv, "Z2 must be slower than CSS");
});

test("E2E cycling 30': power taken at 100%, HR window is the final 20", () => {
  const p = proto("cycling", "30min");
  assert.strictEqual(p.powerFactor, 1.0);
  assert.strictEqual(p.hrWindow, 20);
  assert.strictEqual(Z.thresholdPower(250, p.powerFactor), 250);
  assert.strictEqual(band(Z.buildZones(250, zones.tables.cycling.ftp, "rate"), "2"), "175 – 208");
});

test("E2E cycling 20': power at 95%, HR window is the final FIFTEEN (decision 14)", () => {
  const p = proto("cycling", "20min");
  assert.strictEqual(p.powerFactor, 0.95);
  assert.strictEqual(p.hrWindow, 15, "the 20' test reads HR over 15 minutes, not 20");
  assert.strictEqual(Z.thresholdPower(250, p.powerFactor), 238);
});

test("E2E cycling 2x8': power at 90% and NO heart-rate zones", () => {
  const p = proto("cycling", "2x8min");
  assert.strictEqual(p.powerFactor, 0.90);
  assert.strictEqual(p.hrWindow, null, "2x8 must not offer HR zones — blocks are too short to stabilise");
  assert.deepStrictEqual(p.yields, ["ftp"]);
  assert.strictEqual(Z.thresholdPower(295, p.powerFactor), 266);
});

test("E2E running 30': three metrics off one test, each on its own table", () => {
  const p = proto("running", "30min");
  const pace = Z.toSeconds(4, 0);
  assert.strictEqual(band(Z.buildZones(pace, zones.tables.running.pace, "pace"), "2"), "4:36 – 5:16");
  assert.strictEqual(band(Z.buildZones(160, zones.tables.running.lthr, "rate"), "2"), "130 – 144");
  assert.strictEqual(Z.thresholdPower(300, p.powerFactor), 300);
  assert.strictEqual(band(Z.buildZones(300, zones.tables.running.rftp, "rate"), "2"), "228 – 264");
});

test("running offers exactly one protocol (decision 15)", () => {
  assert.strictEqual(zones.protocols.running.length, 1);
  assert.strictEqual(zones.protocols.running[0].id, "30min");
});

test("no protocol can yield a metric that has no zone table behind it", () => {
  for (const sport in zones.protocols) {
    zones.protocols[sport].forEach((p) => {
      p.yields.forEach((m) => {
        assert.ok(zones.tables[sport][m],
          `${sport}/${p.id} claims to yield "${m}" but there is no ${sport}.${m} table in zones.csv`);
      });
    });
  }
});

console.log("\n" + passed + " passed" + (process.exitCode ? " — WITH FAILURES" : "") + "\n");
