/* heat-calc.js — WBGT → penalización → ritmo.
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
 */
(function () {
  'use strict';
  var root = document.getElementById('hc');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var mode = 'dew', level = 'A';

  var BANDS = [
    { max: 18, name: 'Riesgo bajo',      col: '#1d7a4c' },
    { max: 23, name: 'Riesgo moderado',  col: '#9a7a12' },
    { max: 28, name: 'Riesgo alto',      col: '#c2410c' },
    { max: 99, name: 'Riesgo extremo',   col: '#7f1d1d' }
  ];
  function band(w) { for (var i = 0; i < BANDS.length; i++) { if (w < BANDS[i].max) return BANDS[i]; } return BANDS[3]; }
  function dewFromRh(ta, rh) {
    rh = Math.min(100, Math.max(1, rh));
    var g = 17.27 * ta / (237.3 + ta) + Math.log(rh / 100);
    return 237.3 * g / (17.27 - g);
  }
  function n(x, d) { d = d === undefined ? 1 : d; return x.toFixed(d).replace('.', ','); }
  function mmss(s) { var m = Math.floor(s / 60), x = Math.round(s - m * 60); if (x === 60) { m++; x = 0; } return m + ':' + (x < 10 ? '0' : '') + x; }
  function hm(s) { var h = Math.floor(s / 3600), m = Math.round((s - h * 3600) / 60); if (m === 60) { h++; m = 0; } return h + 'h' + (m < 10 ? '0' : '') + m; }

  function render() {
    var ta = parseFloat($('hcTa').value), hv = parseFloat($('hcHum').value);
    var dist = parseFloat($('hcDist').value);
    var goal = (parseInt($('hcGh').value || 0, 10) * 3600) + (parseInt($('hcGm').value || 0, 10) * 60);
    var acc = $('hcAcc').checked, tri = $('hcTri').checked;
    var out = $('hcOut');
    if (isNaN(ta) || isNaN(hv) || !goal) { out.innerHTML = '<div class="hc-note">Completa las condiciones y tu objetivo.</div>'; return; }

    var td = mode === 'dew' ? hv : dewFromRh(ta, hv);
    var e = 6.11 * Math.pow(10, 7.5 * td / (237.3 + td));
    var wbgt = 0.567 * ta + 0.393 * e + 3.94;
    var b = band(wbgt), over = Math.max(0, wbgt - 15);
    var lo = level === 'A' ? 0.003 : 0.006, hi = level === 'A' ? 0.004 : 0.012;
    var pLo = over * lo, pHi = over * hi;
    if (acc) { pLo *= 0.5; pHi *= 0.7; }

    var h = '<div class="hc-verdict"><div class="hc-verdict-top" style="background:' + b.col + '"></div><div class="hc-verdict-body">';
    h += '<div class="hc-wbgtline"><span class="hc-wbgtval">' + n(wbgt) + ' °C</span>'
       + '<span class="hc-small">WBGT estimado a la sombra</span>'
       + '<span class="hc-band" style="background:' + b.col + '">' + b.name + '</span></div>';

    if (dist <= 10) {
      h += '</div></div><div class="hc-refuse"><span class="label hc-label-heat">Sin datos publicados</span>'
        + '<h3>Para 5 y 10 km no te puedo dar un número</h3>'
        + '<p>El coeficiente que usa esta calculadora se midió sobre maratón, media maratón y marcha atlética. <strong>No existe un análisis equivalente de campo para 5 y 10 km</strong>, y extrapolarlo hacia abajo sería inventar precisión.</p>'
        + '<p>Lo que sí sabemos de las carreras cortas es peor que un número: <strong>producen diez veces más golpes de calor que un maratón.</strong> Una carrera de 11,3 km a 23 °C y 70% de humedad — más suave que cualquiera de las de la costa — generó 274 casos en 18 años de registros. La explicación de los propios autores es que la distancia es lo bastante corta como para que nadie afloje.</p>'
        + '<p><strong>Qué hacer igual:</strong> el WBGT de arriba es válido y la banda de riesgo también. Sal por sensación de esfuerzo, no por ritmo, y acepta que el primer kilómetro te va a parecer demasiado lento.</p></div>';
      out.innerHTML = h; return;
    }

    var tLo = goal * (1 + pLo), tHi = goal * (1 + pHi);
    var pGoal = goal / dist, pLoS = tLo / dist, pHiS = tHi / dist;

    h += '<div class="hc-headline">'
      + '<div class="hc-stat"><span class="hc-v">' + n(pLo * 100) + ' – ' + n(pHi * 100) + '%</span><span class="hc-k">Más lento de lo que rendirías en fresco</span></div>'
      + '<div class="hc-stat"><span class="hc-v">' + mmss(pLoS) + ' – ' + mmss(pHiS) + '</span><span class="hc-k">Ritmo realista por km (objetivo: ' + mmss(pGoal) + ')</span></div>'
      + '<div class="hc-stat"><span class="hc-v">' + hm(tLo) + ' – ' + hm(tHi) + '</span><span class="hc-k">Tiempo estimado (objetivo: ' + hm(goal) + ')</span></div>'
      + '</div>';

    if (over <= 0) {
      h += '<div class="hc-note"><strong>Estás dentro del rango óptimo.</strong> Entre 7,5 y 15 °C de WBGT el rendimiento no se penaliza por temperatura. Corre tu plan.</div>';
    } else {
      h += '<div class="hc-note"><strong>Sal ' + Math.round(pLoS - pGoal) + ' a ' + Math.round(pHiS - pGoal) + ' segundos por kilómetro más lento de tu objetivo, desde el primer kilómetro.</strong>'
        + '<span>El error clásico no es salir rápido a propósito: es salir al ritmo planificado porque en el kilómetro 2 todavía se siente cómodo. El calor no te cobra cuando lo sientes, te cobra después.</span></div>';
    }
    if (acc) {
      h += '<div class="hc-note"><strong>Estás contando con el bloque de aclimatación.</strong> Si no lo completaste — 5 a 7 exposiciones como mínimo, o 2 sesiones semanales de mantenimiento si lo hiciste hace más de una semana — desmarca la casilla y usa el número de arriba.</div>';
    }
    if (tri) {
      h += '<div class="hc-note hc-note--heat"><strong>En un trote de triatlón esta estimación es optimista.</strong> Llegas con horas de calor acumulado, con el glucógeno gastado y a la hora más caliente del día. Es el escenario con el margen más amplio de todos.</div>';
    }
    if (wbgt >= 28) {
      h += '<div class="hc-note hc-note--heat"><strong>Por encima de 28 °C de WBGT el ritmo deja de ser el tema principal.</strong> Lleva tu propio plan de enfriamiento, no dependas del hielo del puesto de avituallamiento, y ten claras las señales de alarma antes de largar.</div>';
    }
    h += '</div></div>';

    h += '<div class="hc-tablewrap"><table><thead><tr><th scope="col">Si el WBGT sube a</th><th scope="col">Penalización</th><th scope="col">Ritmo</th></tr></thead><tbody>';
    [wbgt + 2, wbgt + 4].forEach(function (w) {
      var o = Math.max(0, w - 15), a = o * lo, c = o * hi;
      if (acc) { a *= 0.5; c *= 0.7; }
      h += '<tr><td>' + n(w) + ' °C</td><td>' + n(a * 100) + ' – ' + n(c * 100) + '%</td><td>' + mmss(goal * (1 + a) / dist) + ' – ' + mmss(goal * (1 + c) / dist) + '</td></tr>';
    });
    h += '</tbody></table></div>';
    h += '<p class="hc-small">El WBGT de una carrera sube durante la mañana. Estas dos filas son el mismo cálculo dos y cuatro grados más arriba, que es aproximadamente lo que se mueve entre las 7 y las 10 de la mañana en la costa.</p>';
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
    $('hcHumLab').textContent = 'Punto de rocío';
    $('hcHum').value = n(dewFromRh(parseFloat($('hcTa').value) || 25, parseFloat($('hcHum').value) || 70));
    render();
  });
  $('hcRh').addEventListener('click', function () {
    if (mode === 'rh') return;
    mode = 'rh';
    $('hcRh').setAttribute('aria-pressed', 'true'); $('hcDew').setAttribute('aria-pressed', 'false');
    $('hcHumLab').textContent = 'Humedad relativa';
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
