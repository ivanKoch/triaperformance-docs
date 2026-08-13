/**
 * Training-zones calculator — the UI controller.
 *
 * All arithmetic lives in zones-calc.js, which is unit-tested under Node
 * (tests/zones-calc.test.js). This file only reads inputs, calls that, and
 * renders. Keeping the split means the maths that ships is the maths that was
 * proven — nothing here recomputes a zone.
 *
 * Zone percentages and every string arrive in the #zc-data JSON block, built
 * from data/zones.csv and _data/zonesUi.json. Nothing is hardcoded here.
 */
(function () {
  "use strict";

  var root = document.getElementById("zc");
  var dataEl = document.getElementById("zc-data");
  if (!root || !dataEl || !window.ZonesCalc) return;

  var Z = window.ZonesCalc;
  var D = JSON.parse(dataEl.textContent);
  var UI = D.ui;

  var state = { sport: null, protocol: null };

  function $(id) { return document.getElementById(id); }
  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ------------------------------------------------------------ field HTML */

  function timeField(id, label, note) {
    return '<div class="zc-field"><label for="' + id + '-m">' + esc(label) + "</label>" +
      '<div class="zc-time">' +
      '<input type="number" id="' + id + '-m" min="0" max="359" inputmode="numeric" placeholder="0">' +
      "<span>" + esc(UI.fields.minutes) + "</span>" +
      '<input type="number" id="' + id + '-s" min="0" max="59" inputmode="numeric" placeholder="00">' +
      "<span>" + esc(UI.fields.seconds) + "</span></div>" +
      (note ? '<p class="zc-note">' + esc(note) + "</p>" : "") + "</div>";
  }

  function numberField(id, label, note) {
    return '<div class="zc-field"><label for="' + id + '">' + esc(label) + "</label>" +
      '<input type="number" id="' + id + '" min="0" inputmode="numeric">' +
      (note ? '<p class="zc-note">' + esc(note) + "</p>" : "") + "</div>";
  }

  /** The protocol object for the current sport+selection. */
  function currentProtocol() {
    var list = D.protocols[state.sport] || [];
    if (!state.protocol) return list[0] || null;
    for (var i = 0; i < list.length; i++) if (list[i].id === state.protocol) return list[i];
    return list[0] || null;
  }

  function renderInputs() {
    var p = currentProtocol();
    var detail = UI.protocolDetail[state.sport];
    $("zc-protocol-detail").innerHTML =
      "<h3>" + esc(detail.title) + "</h3>" + detail.body.map(function (b) { return "<p>" + b + "</p>"; }).join("");

    var html = "";
    if (state.sport === "swimming") {
      html += timeField("zc-t400", UI.fields.t400);
      html += timeField("zc-t200", UI.fields.t200);
    } else if (state.sport === "running") {
      html += timeField("zc-pace", UI.fields.avgPace, UI.fields.avgPaceNote);
      html += numberField("zc-hr", UI.fields.avgHr.replace("{n}", p.hrWindow), UI.fields.avgHrNote);
      html += numberField("zc-pw", UI.fields.avgPower, UI.fields.avgPowerNote);
    } else {
      var powerLabel = p.blocks ? UI.fields.avgPowerBlocks : UI.fields.avgPower;
      html += numberField("zc-pw", powerLabel, UI.fields.avgPowerNote);
      // 2x8' yields power only. Rendering an HR field we would then ignore is
      // worse than omitting it — the athlete is told why, in the results.
      if (p.hrWindow) {
        html += numberField("zc-hr", UI.fields.avgHr.replace("{n}", p.hrWindow), UI.fields.avgHrNote);
      }
    }
    $("zc-fields").innerHTML = html;
  }

  /* --------------------------------------------------------------- reading */

  function readTime(id) {
    var m = $(id + "-m"), s = $(id + "-s");
    if (!m || !s) return 0;
    if (m.value === "" && s.value === "") return 0;
    return Z.toSeconds(m.value, s.value);
  }

  function readNumber(id) {
    var el = $(id);
    if (!el || el.value === "") return null;
    var v = parseFloat(el.value);
    return v > 0 ? v : null;
  }

  /* ------------------------------------------------------------- rendering */

  function thresholdCard(key, value, unit) {
    return '<div class="zc-threshold-card"><span class="zc-k">' + esc(UI.thresholdLabels[key]) +
      '</span><span class="zc-v">' + esc(value) +
      (unit ? ' <span class="zc-u">' + esc(unit) + "</span>" : "") + "</span></div>";
  }

  function zoneTable(metric, threshold, kind) {
    var table = D.tables[state.sport === "swimming" ? "swimming" : state.sport][metric];
    var rows = Z.buildZones(threshold, table, kind);
    var html = '<h3 class="zc-table-title">' + esc(UI.tableTitles[metric]) + "</h3>" +
      '<p class="zc-table-sub">' + esc(UI.tableSubs[metric]) + "</p>" +
      '<table class="zc-table"><thead><tr><th>' + esc(UI.columns.zone) + "</th><th>" +
      esc(UI.columns.pct) + "</th><th>" + esc(UI.columns.range) + "</th></tr></thead><tbody>";

    rows.forEach(function (r) {
      var special = r.zone === "X" || r.zone === "Y";
      html += "<tr" + (special ? ' class="zc-special"' : "") + '><td class="zc-z">' +
        esc(r.zone) + " · " + esc(UI.zoneNames[r.zone]) + "</td>" +
        '<td class="zc-pct">' + r.floorPct + "–" + r.ceilingPct + "%</td>" +
        "<td>" + esc(r.display) + "</td></tr>";
      if (special && UI.zoneNotes[r.zone]) {
        // .zc-zone-note, not .zc-pct: the latter is nowrap (correct for
        // "100–102%", fatal for a full sentence — it blew the table past its
        // container). See the note in zones-calculator.css.
        html += '<tr class="zc-special"><td colspan="3" class="zc-zone-note">' + esc(UI.zoneNotes[r.zone]) + "</td></tr>";
      }
    });
    return html + "</tbody></table>";
  }

  /* ------------------------------------------------------------ calculate */

  function calculate() {
    var err = $("zc-error");
    hide(err);
    var p = currentProtocol();
    var cards = "", tables = "", metricCount = 0;

    if (state.sport === "swimming") {
      var t400 = readTime("zc-t400"), t200 = readTime("zc-t200");
      if (!t400 || !t200) return fail(UI.errors.swimMissing);
      var cv = Z.css(t400, t200);
      if (cv === null) return fail(UI.errors.swimOrder);
      cards += thresholdCard("cv", Z.formatPace(cv), UI.units.cv);
      tables += zoneTable("cv", cv, "pace");
      metricCount = 1;
    } else {
      var hr = readNumber("zc-hr");
      var pw = readNumber("zc-pw");
      var pace = state.sport === "running" ? readTime("zc-pace") : 0;

      if (state.sport === "running" && pace) {
        cards += thresholdCard("pace", Z.formatPace(pace), UI.units.pace);
        tables += zoneTable("pace", pace, "pace");
        metricCount++;
      }
      if (pw) {
        var key = state.sport === "running" ? "rftp" : "ftp";
        var threshold = Z.thresholdPower(pw, p.powerFactor);
        cards += thresholdCard(key, threshold, UI.units.power);
        tables += zoneTable(key, threshold, "rate");
        metricCount++;
      }
      if (hr && p.hrWindow) {
        cards += thresholdCard("lthr", Math.round(hr), UI.units.hr);
        tables += zoneTable("lthr", Math.round(hr), "rate");
        metricCount++;
      }
      if (!metricCount) return fail(UI.errors.nothing);
    }

    $("zc-threshold").innerHTML = cards;
    $("zc-tables").innerHTML = tables;

    // The priority note only means something when two numbers could disagree.
    if (metricCount > 1) show($("zc-priority")); else hide($("zc-priority"));

    // Say plainly why there are no HR zones, rather than leaving a gap.
    if (state.sport === "cycling" && p.blocks) {
      $("zc-tables").insertAdjacentHTML("beforeend", '<p class="zc-help">' + esc(UI.onlyPowerNote) + "</p>");
    }

    $("zc-tp").innerHTML = UI.tpSteps[state.sport].map(function (s) { return "<li>" + s + "</li>"; }).join("");

    hide($("zc-step-sport"));
    hide($("zc-step-protocol"));
    hide($("zc-step-input"));
    show($("zc-step-results"));
    if (root.getAttribute("data-capture") !== "no") show($("zc-capture"));
    $("zc-step-results").scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  function fail(msg) {
    var err = $("zc-error");
    err.textContent = msg;
    show(err);
    return false;
  }

  /* ----------------------------------------------------------------- flow */

  function pickSport(sport) {
    state.sport = sport;
    state.protocol = null;
    Array.prototype.forEach.call(root.querySelectorAll("[data-sport]"), function (b) {
      if (b.hasAttribute("aria-pressed")) b.setAttribute("aria-pressed", String(b.dataset.sport === sport));
    });
    // Cycling is the only sport with a protocol choice — running has exactly one
    // and swimming's test is fixed, so showing a single-option step would read
    // as a decision the athlete has to make.
    if (sport === "cycling") {
      show($("zc-step-protocol"));
      hide($("zc-step-input"));
    } else {
      hide($("zc-step-protocol"));
      renderInputs();
      show($("zc-step-input"));
    }
    hide($("zc-step-results"));
    hide($("zc-capture"));
  }

  function pickProtocol(id) {
    state.protocol = id;
    Array.prototype.forEach.call(root.querySelectorAll("[data-protocol]"), function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.protocol === id));
    });
    renderInputs();
    show($("zc-step-input"));
  }

  root.addEventListener("click", function (e) {
    var sportBtn = e.target.closest("[data-sport]");
    if (sportBtn && sportBtn.classList.contains("zc-choice")) return pickSport(sportBtn.dataset.sport);
    var protoBtn = e.target.closest("[data-protocol]");
    if (protoBtn) return pickProtocol(protoBtn.dataset.protocol);
  });

  $("zc-go").addEventListener("click", calculate);

  $("zc-again").addEventListener("click", function () {
    hide($("zc-step-results"));
    hide($("zc-capture"));
    show($("zc-step-sport"));
    if (state.sport === "cycling") show($("zc-step-protocol"));
    show($("zc-step-input"));
    $("zc-step-input").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  /* -------------------------------------------------------------- capture */

  var sendBtn = $("zc-send");
  if (sendBtn) {
    sendBtn.addEventListener("click", function () {
      var email = ($("zc-email").value || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $("zc-email").focus(); return; }
      sendBtn.disabled = true;
      hide($("zc-capture-error"));

      /* PLACEHOLDER ENDPOINT. /api/zone-workouts does not exist yet — the lead
         backend is specified in plan-lead-pipeline-runbook.md and its Caddy
         route pattern is already deployed for /api/plan-lead. Wire this to the
         real webhook before launch; until then the request 404s and the catch
         below shows the error rather than a false confirmation. Deliberately
         NOT faking success: a thank-you for an email nobody received is the
         same class of bug as a placeholder note shipping as copy. */
      fetch("/api/zone-workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, sport: state.sport, protocol: state.protocol, lang: document.documentElement.lang })
      })
        .then(function (r) { if (!r.ok) throw new Error("bad status " + r.status); })
        .then(function () {
          hide($("zc-capture-form"));
          show($("zc-capture-thanks"));
          var set = root.querySelector('.zc-plan-set[data-sport="' + state.sport + '"]');
          if (set) set.hidden = false;
          show($("zc-plans"));
        })
        .catch(function () {
          sendBtn.disabled = false;
          show($("zc-capture-error"));
        });
    });
  }

  /* ------------------------------------------------------------ preselect */

  var pre = root.getAttribute("data-preselect");
  if (pre) pickSport(pre);
})();
