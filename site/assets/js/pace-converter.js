/* Pace converter — four live, bidirectional fields plus the treadmill readout.
 *
 * There is exactly one piece of state: seconds per kilometre. Every field is a
 * view of it. That is the whole design, and it is what keeps the four inputs
 * from drifting out of agreement — the alternative (each field converting from
 * whichever other field changed last) is how these tools end up showing a pace
 * and a speed that are not the same pace.
 *
 * The field being typed in is never re-rendered while it has focus. Rewriting a
 * box under someone's cursor moves the caret and eats digits; it is the single
 * most common bug in a synced-input tool.
 *
 * Copy is read from the JSON block the partial emits, so this file contains no
 * user-facing string in any language.
 */
(function () {
  "use strict";

  var MI = 1.609344;          /* exact by definition — see _data/paceTable.js */
  var MIN_S = 120;            /* 2:00 /km — faster than any human sustains    */
  var MAX_S = 900;            /* 15:00 /km — slower than a walk              */
  var DEFAULT_S = 300;        /* 5:00 /km                                     */

  var root = document.getElementById("pc");
  if (!root) return;

  var uiNode = document.getElementById("pc-ui");
  var UI = uiNode ? JSON.parse(uiNode.textContent) : {};
  var DEC = root.getAttribute("data-dec") || ".";

  var el = {
    kmMin: document.getElementById("pc-km-min"),
    kmSec: document.getElementById("pc-km-sec"),
    miMin: document.getElementById("pc-mi-min"),
    miSec: document.getElementById("pc-mi-sec"),
    kmh: document.getElementById("pc-kmh"),
    mph: document.getElementById("pc-mph"),
    error: document.getElementById("pc-error"),
    treadKmh: document.getElementById("pc-tread-kmh"),
    treadMph: document.getElementById("pc-tread-mph"),
    reset: document.getElementById("pc-reset")
  };

  /* ---------------------------------------------------------- formatting */

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function clock(sec) {
    var t = Math.round(sec);
    return Math.floor(t / 60) + ":" + pad(t % 60);
  }

  /* Two decimals, trailing zeros dropped, localised separator. 13.33, 12.5, 20. */
  function num(v) {
    return v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "").replace(".", DEC);
  }

  /* Accepts both decimal marks, because a Spanish or Portuguese keyboard puts a
     comma where an English one puts a dot and the athlete will type whichever
     their phone gives them. */
  function parseSpeed(raw) {
    var v = parseFloat(String(raw).replace(",", ".").trim());
    return isFinite(v) && v > 0 ? v : null;
  }

  function parseClock(minEl, secEl) {
    var m = parseInt(minEl.value, 10);
    var s = parseInt(secEl.value, 10);
    if (!isFinite(m) && !isFinite(s)) return null;
    if (!isFinite(m)) m = 0;
    if (!isFinite(s)) s = 0;
    if (m < 0 || s < 0) return null;
    return m * 60 + s;
  }

  /* -------------------------------------------------------------- render */

  var STATE = DEFAULT_S;   /* the one piece of state: seconds per kilometre */

  function paint(secPerKm, skip) {
    STATE = secPerKm;
    if (skip !== "kmpace") {
      var k = Math.round(secPerKm);
      el.kmMin.value = Math.floor(k / 60);
      el.kmSec.value = pad(k % 60);
    }
    if (skip !== "mipace") {
      var m = Math.round(secPerKm * MI);
      el.miMin.value = Math.floor(m / 60);
      el.miSec.value = pad(m % 60);
    }
    var kmh = 3600 / secPerKm;
    if (skip !== "kmh") el.kmh.value = num(kmh);
    if (skip !== "mph") el.mph.value = num(kmh / MI);

    treadmill(kmh);
  }

  /* The two settings either side of the exact speed, and the pace each really
     delivers. If the exact speed IS a step (5:00/km is 12.0 km/h), say so and
     show one row rather than inventing a second. */
  function steps(speed, unit, perLabel, toSecPerKm) {
    var lo = Math.floor(speed * 10) / 10;
    var hi = Math.ceil(speed * 10) / 10;
    var out = [];
    if (lo === hi) {
      out.push({ speed: lo, exact: true });
    } else {
      out.push({ speed: lo });
      out.push({ speed: hi });
    }
    return out.map(function (o) {
      return {
        label: num(o.speed) + " " + unit,
        pace: clock(toSecPerKm(o.speed)) + " " + perLabel,
        exact: !!o.exact
      };
    });
  }

  function chips(node, rows) {
    node.innerHTML = "";
    rows.forEach(function (r) {
      var c = document.createElement("span");
      c.className = "pc-chip" + (r.exact ? " pc-chip--exact" : "");
      var b = document.createElement("strong");
      b.textContent = r.label;
      var e = document.createElement("em");
      e.textContent = r.pace;
      c.appendChild(b);
      c.appendChild(e);
      node.appendChild(c);
    });
  }

  function treadmill(kmh) {
    chips(el.treadKmh, steps(kmh, "km/h", UI.perKm, function (s) { return 3600 / s; }));
    chips(el.treadMph, steps(kmh / MI, "mph", UI.perKm, function (s) { return 3600 / (s * MI); }));
  }

  /* --------------------------------------------------------------- wiring */

  function fail(on) { el.error.hidden = !on; }

  function read(unit) {
    if (unit === "kmpace") return parseClock(el.kmMin, el.kmSec);
    if (unit === "mipace") {
      var mi = parseClock(el.miMin, el.miSec);
      return mi === null ? null : mi / MI;
    }
    var v = parseSpeed(unit === "kmh" ? el.kmh.value : el.mph.value);
    if (v === null) return null;
    return 3600 / (unit === "kmh" ? v : v * MI);
  }

  /* Nothing is reported as an error WHILE someone types. Typing "13" into the
     km/h box passes through "1", which is 60:00 per kilometre — out of range and
     completely innocent. An out-of-range value simply does not propagate; the
     message waits until they leave the field. */
  function onInput(e) {
    var unit = e.target.getAttribute("data-unit");
    var secPerKm = read(unit);
    if (secPerKm === null) return;
    if (secPerKm < MIN_S || secPerKm > MAX_S) return;
    fail(false);
    paint(secPerKm, unit);
  }

  /* focusout, not blur, and specifically for `relatedTarget`: at blur time the
     next field has not received focus yet, so repainting would rewrite the box
     the person is about to type into and move their caret. relatedTarget names
     that box before it happens, and it is excluded from the repaint. */
  function onLeave(e) {
    var unit = e.target.getAttribute("data-unit");
    var next = e.relatedTarget && e.relatedTarget.getAttribute
      ? e.relatedTarget.getAttribute("data-unit") : null;
    var s = read(unit);
    if (s === null) { paint(current(), next); fail(false); return; }
    if (s < MIN_S || s > MAX_S) { paint(current(), next); fail(true); return; }
    fail(false);
    paint(s, next);
  }

  Array.prototype.forEach.call(root.querySelectorAll(".pc-in"), function (input) {
    input.addEventListener("input", onInput);
    /* Tidy up on the way out: "7" in the seconds box becomes "07", and a field
       left half-typed or out of range snaps back to the value the tool is
       actually holding. */
    input.addEventListener("focusout", onLeave);
  });

  /* The last value the tool successfully held. Read from STATE rather than back
     off the km boxes: someone who clears both of those has emptied the only
     field pair that could have told us, and snapping to 5:00 would silently
     discard the pace they entered in mph a moment earlier. */
  function current() { return STATE; }

  el.reset.addEventListener("click", function () {
    fail(false);
    paint(DEFAULT_S, null);
    el.kmMin.focus();
  });

  paint(DEFAULT_S, null);
})();
