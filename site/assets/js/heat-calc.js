/* heat-calc.js — WBGT → penalización → ritmo. ES / EN / PT.
 *
 * Model, stated once and owned by heat-guide-brief.md §4:
 *   WBGT  = 0,567·Ta + 0,393·e + 3,94        (Australian BoM; e from dew point)
 *           No solar and no wind term, so this approximates a SHADED WBGT and
 *           is a floor, not a central estimate. Every race here is run in sun.
 *   pena  = 0,3–0,4 % per °C of WBGT above 15 °C   (Mantzios 2022)
 *           × 2–3 for mid-pack                      (Ely 2007)
 *           × 0,5–0,7 if acclimated — the softest of the three, labelled as
 *           an estimate on the page rather than presented as a coefficient.
 *
 * 5 and 10 km return a REFUSAL, not a number. No published field equivalent
 * exists below half marathon and extrapolating down would be inventing
 * precision. That refusal is deliberate; do not replace it with a figure.
 *
 * NO READER-FACING STRING LIVES IN THIS FILE. Every one comes from
 * window.HEAT_UI, which the partial fills from site/_data/heatUi.json — the
 * same shape activation-tool and strength-tool already use. That includes the
 * DECIMAL SEPARATOR: `U.dec` is "," in Spanish and Portuguese and "." in
 * English, and n() routes every figure through it, so no number is written out
 * in any language file either.
 */
(function () {
  'use strict';
  var root = document.getElementById('hc');
  if (!root) return;
  var U = window.HEAT_UI || {};
  var $ = function (id) { return document.getElementById(id); };
  var mode = 'dew', level = 'A';

  /* Band colours stay here: they are the zone model's, not copy. The NAMES are
     copy and come from U.bands. */
  var BAND_MAX = [18, 23, 28, 99];
  var BAND_COL = ['#1d7a4c', '#9a7a12', '#c2410c', '#7f1d1d'];
  function band(w) {
    for (var i = 0; i < BAND_MAX.length; i++) {
      if (w < BAND_MAX[i]) return { name: (U.bands || [])[i] || '', col: BAND_COL[i] };
    }
    return { name: (U.bands || [])[3] || '', col: BAND_COL[3] };
  }
  function t(s, map) {
    s = s || '';
    for (var k in map) { if (map.hasOwnProperty(k)) s = s.split('{' + k + '}').join(map[k]); }
    return s;
  }
  function dewFromRh(ta, rh) {
    rh = Math.min(100, Math.max(1, rh));
    var g = 17.27 * ta / (237.3 + ta) + Math.log(rh / 100);
    return 237.3 * g / (17.27 - g);
  }
  function n(x, d) { d = d === undefined ? 1 : d; return x.toFixed(d).replace('.', U.dec || ','); }
  function mmss(s) { var m = Math.floor(s / 60), x = Math.round(s - m * 60); if (x === 60) { m++; x = 0; } return m + ':' + (x < 10 ? '0' : '') + x; }
  function hm(s) { var h = Math.floor(s / 3600), m = Math.round((s - h * 3600) / 60); if (m === 60) { h++; m = 0; } return h + 'h' + (m < 10 ? '0' : '') + m; }

  function render() {
    var ta = parseFloat($('hcTa').value), hv = parseFloat($('hcHum').value);
    var dist = parseFloat($('hcDist').value);
    var goal = (parseInt($('hcGh').value || 0, 10) * 3600) + (parseInt($('hcGm').value || 0, 10) * 60);
    var acc = $('hcAcc').checked, tri = $('hcTri').checked;
    var out = $('hcOut');
    if (isNaN(ta) || isNaN(hv) || !goal) { out.innerHTML = '<div class="hc-note">' + (U.incomplete || '') + '</div>'; return; }

    var td = mode === 'dew' ? hv : dewFromRh(ta, hv);
    var e = 6.11 * Math.pow(10, 7.5 * td / (237.3 + td));
    var wbgt = 0.567 * ta + 0.393 * e + 3.94;
    var b = band(wbgt), over = Math.max(0, wbgt - 15);
    var lo = level === 'A' ? 0.003 : 0.006, hi = level === 'A' ? 0.004 : 0.012;
    var pLo = over * lo, pHi = over * hi;
    if (acc) { pLo *= 0.5; pHi *= 0.7; }

    var h = '<div class="hc-verdict"><div class="hc-verdict-top" style="background:' + b.col + '"></div><div class="hc-verdict-body">';
    h += '<div class="hc-wbgtline"><span class="hc-wbgtval">' + n(wbgt) + ' °C</span>'
       + '<span class="hc-small">' + (U.wbgtLabel || '') + '</span>'
       + '<span class="hc-band" style="background:' + b.col + '">' + b.name + '</span></div>';

    if (dist <= 10) {
      h += '</div></div><div class="hc-refuse"><span class="label hc-label-heat">' + (U.refuseEyebrow || '') + '</span>'
        + '<h3>' + (U.refuseTitle || '') + '</h3>'
        + '<p>' + (U.refuseP1 || '') + '</p>'
        + '<p>' + (U.refuseP2 || '') + '</p>'
        + '<p>' + (U.refuseP3 || '') + '</p></div>';
      out.innerHTML = h; return;
    }

    var tLo = goal * (1 + pLo), tHi = goal * (1 + pHi);
    var pGoal = goal / dist, pLoS = tLo / dist, pHiS = tHi / dist;

    h += '<div class="hc-headline">'
      + '<div class="hc-stat"><span class="hc-v">' + n(pLo * 100) + ' – ' + n(pHi * 100) + '%</span><span class="hc-k">' + (U.statPenalty || '') + '</span></div>'
      + '<div class="hc-stat"><span class="hc-v">' + mmss(pLoS) + ' – ' + mmss(pHiS) + '</span><span class="hc-k">' + t(U.statPace, { goal: mmss(pGoal) }) + '</span></div>'
      + '<div class="hc-stat"><span class="hc-v">' + hm(tLo) + ' – ' + hm(tHi) + '</span><span class="hc-k">' + t(U.statTime, { goal: hm(goal) }) + '</span></div>'
      + '</div>';

    if (over <= 0) {
      h += '<div class="hc-note">' + (U.noteOptimal || '') + '</div>';
    } else {
      h += '<div class="hc-note"><strong>'
        + t(U.notePaceHead, { lo: Math.round(pLoS - pGoal), hi: Math.round(pHiS - pGoal) })
        + '</strong><span>' + (U.notePaceBody || '') + '</span></div>';
    }
    if (acc) { h += '<div class="hc-note">' + (U.noteAcc || '') + '</div>'; }
    if (tri) { h += '<div class="hc-note hc-note--heat">' + (U.noteTri || '') + '</div>'; }
    if (wbgt >= 28) { h += '<div class="hc-note hc-note--heat">' + (U.noteExtreme || '') + '</div>'; }
    h += '</div></div>';

    var th = U.tableHead || ['', '', ''];
    h += '<div class="hc-tablewrap"><table><thead><tr><th scope="col">' + th[0] + '</th><th scope="col">' + th[1] + '</th><th scope="col">' + th[2] + '</th></tr></thead><tbody>';
    [wbgt + 2, wbgt + 4].forEach(function (w) {
      var o = Math.max(0, w - 15), a = o * lo, c = o * hi;
      if (acc) { a *= 0.5; c *= 0.7; }
      h += '<tr><td>' + n(w) + ' °C</td><td>' + n(a * 100) + ' – ' + n(c * 100) + '%</td><td>' + mmss(goal * (1 + a) / dist) + ' – ' + mmss(goal * (1 + c) / dist) + '</td></tr>';
    });
    h += '</tbody></table></div>';
    h += '<p class="hc-small">' + (U.tableNote || '') + '</p>';
    /* English only: this tool is metric and a US runner thinks in min/mile.
       One sentence pointing at a converter that already exists, rather than a
       unit switch nobody asked for. Absent from es/pt, so it renders nothing. */
    if (U.paceUnitNote) { h += '<p class="hc-small">' + U.paceUnitNote + '</p>'; }
    out.innerHTML = h;
  }

  ['hcTa', 'hcHum', 'hcDist', 'hcGh', 'hcGm', 'hcAcc', 'hcTri'].forEach(function (id) {
    $(id).addEventListener('input', render);
    $(id).addEventListener('change', render);
  });
  $('hcDew').addEventListener('click', function () {
    if (mode === 'dew') return;
    mode = 'dew';
    $('hcDew').setAttribute('aria-pressed', 'true'); $('hcRh').setAttribute('aria-pressed', 'false');
    $('hcHumLab').textContent = U.dewLabel || '';
    $('hcHum').value = n(dewFromRh(parseFloat($('hcTa').value) || 25, parseFloat($('hcHum').value) || 70));
    render();
  });
  $('hcRh').addEventListener('click', function () {
    if (mode === 'rh') return;
    mode = 'rh';
    $('hcRh').setAttribute('aria-pressed', 'true'); $('hcDew').setAttribute('aria-pressed', 'false');
    $('hcHumLab').textContent = U.rhLabel || '';
    var ta = parseFloat($('hcTa').value) || 25, td = parseFloat($('hcHum').value) || 21;
    var rh = 100 * Math.pow(10, 7.5 * td / (237.3 + td) - 7.5 * ta / (237.3 + ta));
    $('hcHum').value = Math.round(Math.min(100, Math.max(1, rh)));
    render();
  });
  $('hcLvlA').addEventListener('click', function () { level = 'A'; $('hcLvlA').setAttribute('aria-pressed', 'true'); $('hcLvlB').setAttribute('aria-pressed', 'false'); render(); });
  $('hcLvlB').addEventListener('click', function () { level = 'B'; $('hcLvlB').setAttribute('aria-pressed', 'true'); $('hcLvlA').setAttribute('aria-pressed', 'false'); render(); });

  var chips = [].slice.call(root.querySelectorAll('.hc-chip'));
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', 'true');
      if (mode === 'rh') { $('hcDew').click(); }
      $('hcTa').value = c.dataset.ta; $('hcHum').value = c.dataset.td;
      render();
    });
  });

  render();
})();
