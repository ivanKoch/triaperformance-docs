/**
 * Training-zone model, loaded from data/zones.csv at build time.
 *
 * WHY THIS EXISTS: the zone percentages had two homes and they disagreed. Three
 * published articles (ES/EN/PT) printed one seven-zone table applied to both
 * velocity and LTHR; the real model is SIX tables, one per sport-and-metric, and
 * they differ on nearly every row — Zone 2's floor alone runs from 70% (bike FTP)
 * to 84% (swim critical velocity). An athlete reading the article and then using
 * the calculator would have got two different sets of zones.
 *
 * data/zones.csv is now the single owner. This file exposes it to the templates
 * so the calculator AND the article tables render from the same numbers, which
 * makes a future divergence structurally impossible rather than merely
 * discouraged. Do not hand-type these percentages anywhere else.
 * (Established August 10, 2026 — see zones-calculator-brief.md §2.)
 *
 * Update, August 12, 2026 — the article half of that promise is now real. The
 * `zoneTable` shortcode in .eleventy.js renders the tables straight from here,
 * and the four articles carry `{% zoneTable "running" %}` instead of typed rows.
 * TWO CORRECTIONS to the note above: it was FOUR articles, not three (the ES
 * Norwegian-method piece carried the same table with different prose and no
 * calculator CTA, so it was invisible to a search for the CTA); and the tables
 * now print one column PER METRIC rather than one column labelled as covering
 * all of them. That last part was the substantive error — running Z1 is 60-76%
 * by pace and 72-81% by heart rate, so a single column was never a stale number,
 * it was a claim this model does not make.
 *
 * Shape:
 *   zones.tables.running.pace = [{ zone: "1", floor: 60, ceiling: 76 }, ...]
 *   zones.order                = ["1","2","X","3","Y","4","5"]
 *   zones.metricsBySport       = { running: ["lthr","pace","rftp"], ... }
 *   zones.protocols            = the test protocols and their arithmetic
 */

const fs = require("fs");
const path = require("path");

const CSV = path.join(__dirname, "..", "..", "data", "zones.csv");

/* Zone order is fixed and NOT alphabetical: X sits between 2 and 3 (upper half
   of zone 2, marathon pace) and Y between 3 and 4 (bottom of zone 4). Sorting
   these as strings puts X and Y at the end, which reads as two bonus zones
   tacked on rather than two bands carved out of the middle. */
const ZONE_ORDER = ["1", "2", "X", "3", "Y", "4", "5"];

function load() {
  const text = fs.readFileSync(CSV, "utf8").trim();
  const [head, ...lines] = text.split("\n");
  const cols = head.split(",").map((c) => c.trim());
  const tables = {};

  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = line.split(",").map((c) => c.trim());
    const row = Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
    const { sport, metric, zone } = row;
    const floor = parseFloat(row.floor_pct);
    const ceiling = parseFloat(row.ceiling_pct);

    if (!sport || !metric || !zone) continue;
    if (!Number.isFinite(floor) || !Number.isFinite(ceiling)) {
      throw new Error(`zones.csv: non-numeric percentage on ${sport}/${metric}/${zone}`);
    }
    if (ceiling <= floor) {
      throw new Error(
        `zones.csv: ${sport}/${metric} zone ${zone} has ceiling ${ceiling} <= floor ${floor}. ` +
        `A zone with no width would render as an empty band.`
      );
    }
    (tables[sport] = tables[sport] || {});
    (tables[sport][metric] = tables[sport][metric] || []).push({ zone, floor, ceiling });
  }

  /* Every table must carry all seven zones. A missing row would silently drop a
     band from an athlete's chart — the kind of error that looks like a design
     choice rather than a bug. */
  for (const sport in tables) {
    for (const metric in tables[sport]) {
      const t = tables[sport][metric];
      t.sort((a, b) => ZONE_ORDER.indexOf(a.zone) - ZONE_ORDER.indexOf(b.zone));
      const got = t.map((z) => z.zone).join(",");
      if (got !== ZONE_ORDER.join(",")) {
        throw new Error(`zones.csv: ${sport}/${metric} has zones [${got}], expected [${ZONE_ORDER}]`);
      }
    }
  }

  const metricsBySport = {};
  for (const sport in tables) metricsBySport[sport] = Object.keys(tables[sport]).sort();

  const count = Object.values(tables).reduce((n, m) => n + Object.keys(m).length, 0);
  console.log(`[zones] ${count} zone tables loaded — ` +
    Object.entries(metricsBySport).map(([s, m]) => `${s}: ${m.join("/")}`).join(" · "));

  return { tables, order: ZONE_ORDER, metricsBySport, protocols: PROTOCOLS };
}

/**
 * Test protocols and the arithmetic that turns a raw result into a threshold.
 *
 * Decisions 12, 14 and 15 (zones-calculator-brief.md):
 *   - Cycling offers three protocols; running offers exactly one (the 30').
 *   - 2x8' yields power only — that limitation is stated to the athlete rather
 *     than hidden, because an athlete who did it and expected HR zones needs to
 *     know why they are not there.
 *   - The 20' bike test takes LTHR from its final FIFTEEN minutes, not twenty.
 *     This is deliberate and specific to that protocol.
 *   - Running power from the 30' test works exactly like pace: the 30' average
 *     IS the estimate, no multiplier.
 *
 * `yields` maps to the metric keys in the CSV, so a protocol can never offer a
 * metric with no zone table behind it.
 */
const PROTOCOLS = {
  cycling: [
    {
      id: "30min",
      minutes: 30,
      yields: ["ftp", "lthr"],
      powerFactor: 1.0,   // the 30' average IS the FTP estimate
      hrWindow: 20,       // average HR of the final 20 minutes
      recommended: true,
    },
    {
      id: "20min",
      minutes: 20,
      yields: ["ftp", "lthr"],
      powerFactor: 0.95,
      hrWindow: 15,       // final FIFTEEN minutes — specific to this protocol
    },
    {
      id: "2x8min",
      minutes: 8,
      blocks: 2,
      yields: ["ftp"],    // power only, and we say so
      powerFactor: 0.90,
      hrWindow: null,
    },
  ],
  running: [
    {
      id: "30min",
      minutes: 30,
      yields: ["pace", "lthr", "rftp"],
      powerFactor: 1.0,   // same as pace: the 30' average is the estimate
      hrWindow: 20,
      recommended: true,
    },
  ],
  swimming: [
    {
      id: "400-200",
      yields: ["cv"],
      // CSS in seconds per 100m = (t400 - t200) / 2.
      // Algebraically identical to the standard 200 / (t400 - t200) m/s form
      // converted to pace — an exact identity, not an approximation.
      formula: "css",
    },
  ],
};

module.exports = load();
