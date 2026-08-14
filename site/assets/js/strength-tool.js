/* Strength tool engine — sets × reps with a rest timer between sets.
 *
 * Deliberately NOT the activation engine. That one counts a fixed 40 seconds
 * down and moves on, which is right for a mobility circuit and wrong for
 * strength: a countdown tells someone to keep going when the prescription is
 * eight good repetitions. Here the athlete finishes the set and taps; the only
 * thing on a clock is the rest between sets.
 *
 * Reads window.STRENGTH_DATA (built by the page, after its setup questions):
 *   { title, crumb, subtitle, context, why, doneSub,
 *     phases: [{ name, exercises: [{ name, sets, reps, rest?, tag?, cue? }] }] }
 *   - `reps` is a display string ("8-12 por pierna", "45s"), never parsed.
 *     The prescription is the coach's words, not a number this engine derives.
 *   - `rest` in seconds; 0 or absent means no timer, straight to the next set.
 * UI chrome comes from window.STRENGTH_UI (site/_data/strengthUi.json).
 */
(function () {
  const D = window.STRENGTH_DATA;
  if (!D) return;
  const U = window.STRENGTH_UI || {};
  const t = (k, es) => U[k] || es;

  const $ = (id) => document.getElementById(id);

  // Flatten phases into one list, keeping the phase name on each entry.
  const ex = [];
  D.phases.forEach((ph) => ph.exercises.forEach((e) =>
    ex.push(Object.assign({}, e, { phase: ph.name }))));

  const totalSets = ex.reduce((a, e) => a + e.sets, 0);

  let idx = 0, set = 1, phase = "idle";   // idle | work | rest | done
  let remaining = 0, interval = null, setsDone = 0, skipped = 0;

  function fmt(s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  function beep(freq, dur) {
    try {
      const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch (e) {}
  }
  function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }

  /* ---- tabs ---- */
  document.querySelectorAll(".tool-tab").forEach((b) =>
    b.addEventListener("click", () => goTab(b.dataset.tab)));
  function goTab(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.querySelectorAll(".tool-tab").forEach((b) =>
      b.classList.toggle("active", b.dataset.tab === id));
    $("tab-" + id).classList.add("active");
    if (id === "list") renderList();
    if (id === "workout") updateUI();
  }

  /* ---- home ---- */
  function renderHome() {
    $("homeContent").innerHTML =
      '<span class="label">' + (D.kicker || t("kicker", "Fuerza")) + "</span>" +
      '<h1 class="home-title">' + D.title + "</h1>" +
      '<p class="home-sub">' + D.subtitle + "</p>" +
      '<div class="context-pill">' + D.context + " · " + totalSets + " " + t("sets", "series") + "</div>" +
      (D.why ? '<div class="why-box"><div class="why-title">' + t("why", "Por qué importa") +
        '</div><div class="why-text">' + D.why + "</div></div>" : "") +
      (D.warning ? '<div class="warn-box">' + D.warning + "</div>" : "") +
      '<div class="phase-overview">' + D.phases.map((ph) =>
        '<div class="phase-row"><span class="phase-dot"></span><span class="phase-row-name">' + ph.name +
        '</span><span class="phase-row-detail">' + ph.exercises.length + " " +
        (ph.exercises.length === 1 ? t("exercise", "ejercicio") : t("exercises", "ejercicios")) +
        "</span></div>").join("") + "</div>" +
      '<button class="btn-primary start-btn" id="startBtn">' + t("startRoutine", "Empezar rutina →") + "</button>";
    $("startBtn").addEventListener("click", () => {
      goTab("workout");
      if (phase === "idle") { phase = "work"; updateUI(); }
    });
  }

  /* ---- rest timer ---- */
  function startRest(secs) {
    phase = "rest"; remaining = secs;
    clearInterval(interval);
    interval = setInterval(() => {
      remaining--;
      if (remaining <= 3 && remaining > 0) beep(660, 0.1);
      if (remaining <= 0) { beep(880, 0.3); buzz([200, 100, 200]); endRest(); }
      updateUI();
    }, 1000);
    updateUI();
  }
  function endRest() {
    clearInterval(interval); interval = null;
    phase = phase === "done" ? "done" : "work";
    updateUI();
  }

  /* ---- progression ---- */
  function completeSet() {
    if (phase !== "work") return;
    setsDone++;
    const e = ex[idx];
    if (set < e.sets) {
      set++;
      if (e.rest) startRest(e.rest); else updateUI();
    } else {
      advance(e.rest);
    }
  }

  function advance(restAfter) {
    idx++; set = 1;
    if (idx >= ex.length) return finish();
    if (restAfter) startRest(restAfter); else updateUI();
  }

  function finish() {
    phase = "done";
    clearInterval(interval); interval = null;
    buzz([300, 100, 300, 100, 500]);
    $("statEx").textContent = ex.length;
    $("statSets").textContent = setsDone;
    $("statSkip").textContent = skipped;
    updateUI();
  }

  /* ---- controls ---- */
  $("setDoneBtn").addEventListener("click", completeSet);

  $("skipBtn").addEventListener("click", () => {
    if (phase === "idle" || phase === "done") return;
    skipped++;
    clearInterval(interval); interval = null;
    advance(0);
  });

  $("prevBtn").addEventListener("click", () => {
    if (phase === "idle" || phase === "done") return;
    clearInterval(interval); interval = null;
    phase = "work";
    if (set > 1) set--;
    else if (idx > 0) { idx--; set = ex[idx].sets; }
    updateUI();
  });

  $("skipRestBtn").addEventListener("click", () => { if (phase === "rest") endRest(); });

  $("repeatBtn").addEventListener("click", () => {
    idx = 0; set = 1; setsDone = 0; skipped = 0; phase = "work";
    updateUI();
  });

  /* ---- render ---- */
  function nextLabel() {
    const e = ex[idx];
    if (!e) return null;
    if (set < e.sets || phase === "rest") {
      // during rest, idx/set already point at what is coming
      return e.name + " · " + t("set", "Serie") + " " + set;
    }
    const nx = ex[idx + 1];
    return nx ? nx.name : null;
  }

  function updateUI() {
    // Everything that must render even when idx has run past the last exercise
    // goes FIRST. `finish()` advances idx to ex.length and then calls this; with
    // the `if (!e) return` guard at the top, the done overlay was never shown —
    // the routine completed internally while the screen froze on the last set,
    // with the button dead because phase was already "done". Found by walking a
    // full routine end to end, invisible to any check that stops earlier.
    $("blockProgress").textContent = setsDone + " / " + totalSets;
    $("totalBar").style.width = (setsDone / totalSets * 100) + "%";
    $("restOverlay").style.display = phase === "rest" ? "flex" : "none";
    $("doneOverlay").style.display = phase === "done" ? "flex" : "none";
    $("workControls").style.visibility = phase === "done" ? "hidden" : "visible";

    const e = ex[idx];
    if (!e) return;   // finished — the overlay above is the whole screen now

    $("phaseName").textContent = e.phase;

    $("exNum").textContent = (idx + 1) + " / " + ex.length;
    $("exName").textContent = e.name;
    $("exTag").textContent = e.phase + (e.tag ? " · " + e.tag : "");

    $("setCounter").textContent = t("set", "Serie") + " " + set + " " + t("of", "de") + " " + e.sets;
    $("repTarget").textContent = e.reps;

    // innerHTML, not textContent: cues carry <strong> on the one instruction
    // that makes the exercise work. Same rule as the activation engine.
    $("exCue").innerHTML = e.cue || "";
    $("exCue").style.display = e.cue ? "block" : "none";

    const nx = nextLabel();
    $("nextPreview").textContent = nx ? t("next", "Siguiente:") + " " + nx : t("lastSet", "Última serie");
    $("nextPreview").style.visibility = nx ? "visible" : "hidden";

    $("prevBtn").disabled = phase === "idle" || phase === "done" || (idx === 0 && set === 1);
    $("skipBtn").disabled = phase === "idle" || phase === "done";

    if (phase === "rest") {
      $("restTime").textContent = fmt(Math.max(0, remaining));
      $("restNext").innerHTML = t("next", "Siguiente:") + " <strong>" + (nx || "") + "</strong>";
    }
  }

  /* ---- exercise list ---- */
  function renderList() {
    let html = "", last = null;
    ex.forEach((e, i) => {
      if (e.phase !== last) {
        if (last !== null) html += "</div>";
        html += '<div class="list-phase"><div class="list-phase-title"><span class="phase-dot"></span>' + e.phase + "</div>";
        last = e.phase;
      }
      html += '<div class="list-ex"><div class="list-ex-num">' + (i + 1) + '</div><div class="list-ex-content">' +
        '<div class="list-ex-name">' + e.name + "</div>" +
        '<div class="list-ex-detail">' + e.sets + " × " + e.reps + (e.tag ? " · " + e.tag : "") + "</div>" +
        (e.cue ? '<div class="list-ex-cue">' + e.cue + "</div>" : "") +
        "</div></div>";
    });
    if (last !== null) html += "</div>";
    $("listContent").innerHTML = html;
  }

  $("doneSub").textContent = D.doneSub || "";
  $("crumbLabel").textContent = D.crumb || D.title;
  renderHome();
  updateUI();
})();
