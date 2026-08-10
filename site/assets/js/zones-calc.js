/**
 * Zone math for the training-zones calculator.
 *
 * Pure functions, no DOM. Loaded by the browser as `window.ZonesCalc` and by
 * tests/zones-calc.test.js under Node, so the arithmetic that ships is the
 * arithmetic that was tested.
 *
 * ---------------------------------------------------------------------------
 * THE ONE THING THAT MATTERS HERE: percentages apply to VELOCITY, not to pace.
 *
 * Pace is time per distance, so it moves opposite to speed. Multiplying a
 * 4:00/km pace by 76% gives 3:02/km — FASTER than threshold, for a zone that is
 * supposed to be slower. The whole chart inverts, and it inverts plausibly: the
 * numbers still look like paces, still ascend, still bracket a believable
 * range. Nobody spots it by eye.
 *
 * Because velocity = distance / time, a zone at p% of threshold velocity is at
 * (threshold_time / p) per unit distance. So we DIVIDE. Same for swim pace.
 * Power and heart rate are rates already, so those MULTIPLY.
 *
 * This distinction is the reason tests/zones-calc.test.js exists.
 * ---------------------------------------------------------------------------
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ZonesCalc = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /** "4" + "30" -> 270 seconds. Tolerates blanks and stray whitespace. */
  function toSeconds(minutes, seconds) {
    var m = parseInt(minutes, 10) || 0;
    var s = parseInt(seconds, 10) || 0;
    return m * 60 + s;
  }

  /** 275.9 -> "4:36". Rounds to the nearest second: sub-second pace precision
   *  is false confidence on a number derived from a 30-minute field test. */
  function formatPace(totalSeconds) {
    if (!isFinite(totalSeconds) || totalSeconds <= 0) return "—";
    var t = Math.round(totalSeconds);
    var m = Math.floor(t / 60);
    var s = t % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  /**
   * Critical swim speed from a 400m and a 200m time trial.
   * CSS (seconds per 100m) = (t400 - t200) / 2.
   * Exactly equivalent to the standard 200 / (t400 - t200) m/s expressed as
   * pace — an identity, not an approximation.
   */
  function css(t400Seconds, t200Seconds) {
    var delta = t400Seconds - t200Seconds;
    if (!(delta > 0)) return null; // 400 must be slower than the 200, or the test is invalid
    return delta / 2;
  }

  /**
   * Threshold from a test result.
   *   protocol.powerFactor — 1.0 for the 30', 0.95 for the 20', 0.90 for 2x8'.
   *   For 2x8' the caller passes the average of both blocks.
   * Applies to power (FTP, running power) identically; running power from the
   * 30' is the 30' average, same as pace.
   */
  function thresholdPower(averageWatts, powerFactor) {
    var w = parseFloat(averageWatts);
    if (!(w > 0)) return null;
    return Math.round(w * (powerFactor == null ? 1 : powerFactor));
  }

  /** A rate-based zone band: power or heart rate. Percentages multiply. */
  function rateBand(threshold, floorPct, ceilingPct) {
    return {
      low: Math.round(threshold * floorPct / 100),
      high: Math.round(threshold * ceilingPct / 100),
    };
  }

  /**
   * A pace-based zone band. Percentages DIVIDE — see the header comment.
   * Returns seconds per unit distance, `low` = the faster (smaller) number.
   */
  function paceBand(thresholdPaceSeconds, floorPct, ceilingPct) {
    var atFloor = thresholdPaceSeconds / (floorPct / 100);     // slower
    var atCeiling = thresholdPaceSeconds / (ceilingPct / 100); // faster
    return { low: atCeiling, high: atFloor };
  }

  /**
   * Build a full seven-row zone table.
   *   table   — rows from data/zones.csv: [{ zone, floor, ceiling }, ...]
   *   kind    — "pace" or "rate"
   * Bands are rendered exactly as the CSV gives them, floor to ceiling, with no
   * open ends (decision 9): Z1 has a real floor and Z5 a real ceiling.
   */
  function buildZones(threshold, table, kind) {
    return table.map(function (row) {
      var band = kind === "pace"
        ? paceBand(threshold, row.floor, row.ceiling)
        : rateBand(threshold, row.floor, row.ceiling);
      return {
        zone: row.zone,
        floorPct: row.floor,
        ceilingPct: row.ceiling,
        low: band.low,
        high: band.high,
        display: kind === "pace"
          ? formatPace(band.low) + " – " + formatPace(band.high)
          : band.low + " – " + band.high,
      };
    });
  }

  return {
    toSeconds: toSeconds,
    formatPace: formatPace,
    css: css,
    thresholdPower: thresholdPower,
    rateBand: rateBand,
    paceBand: paceBand,
    buildZones: buildZones,
  };
});
