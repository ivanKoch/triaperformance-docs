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
 *   - `hold` (seconds, optional): the prescription is a duration, not a count.
 *     Adds a countdown the ATHLETE starts — it does not run on its own and it
 *     does not advance the set. Added September 8, 2026: `reps: "45s"` on the
 *     wall sit told someone to hold for 45 seconds and then left them to count
 *     it themselves, on the one page (`/members/rodillas/`) whose whole point is
 *     that the dose is the treatment.
 *   - `holdMax` (seconds, optional): the top of a RANGE. "20-30s" is
 *     hold: 20, holdMax: 30 — the clock counts down from 30 and marks 20 with
 *     its own softer beep, so the minimum dose is signalled and the extra ten
 *     seconds stay available. Absent means the prescription is a single number.
 *     ⚠️ Do not collapse a range to one figure to simplify this: picking the
 *     floor stops people short of a dose they were asked for, and picking the
 *     ceiling turns a permission into an obligation. The coach wrote a range.
 *   - `holdSides` (1 or 2, default 1): a per-side hold runs twice, the button
 *     re-arming as "Side 2" in between, so "30s por lado" is two timed holds
 *     rather than one number the athlete has to double in their head.
 *   - `work` (seconds, optional): estimate ONLY, for the time-to-completion
 *     figure on the home screen. Never displayed, never counted down.
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

  // Hold timer state. Separate interval from the rest timer on purpose: a hold
  // runs DURING a set and a rest runs between them, and one variable for both
  // would make "stop the rest" and "stop the hold" the same instruction.
  let holdDoneSides = 0, holdRemaining = 0, holdInterval = null, holdMinMet = false;
  const sidesOf = (e) => (e && e.holdSides) || 1;
  const holdCeil = (e) => (e && (e.holdMax || e.hold)) || 0;
  const holdRanged = (e) => !!e && holdCeil(e) > e.hold;
  const holdRunning = () => !!holdInterval;

  /* Estimated time to completion (September 8, 2026).
     Exact for timed work and for rest. ESTIMATED for rep-based sets, which have
     no true duration — this engine deliberately never counts reps, so a set of
     "8-12 por pierna" is assumed at EST_SET_SECONDS. That is a stated
     assumption, not a measurement, which is why the figure is always prefixed
     "≈" and rounded to the minute. Rest is counted after every set except the
     last of the routine, matching what advance()/finish() actually do. */
  const EST_SET_SECONDS = 40;
  function estMinutes() {
    let total = 0;
    ex.forEach((e, i) => {
      // A ranged hold is estimated at its midpoint — the floor would promise a
      // routine nobody finishes that fast, the ceiling one nobody reaches.
      const per = e.hold
        ? ((e.hold + holdCeil(e)) / 2) * sidesOf(e)
        : (e.work || EST_SET_SECONDS);
      total += e.sets * per;
      const rests = e.sets - (i === ex.length - 1 ? 1 : 0);
      total += (e.rest || 0) * Math.max(0, rests);
    });
    return Math.max(1, Math.round(total / 60));
  }

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
      '<div class="context-pill">' + D.context + " · " + totalSets + " " + t("sets", "series") +
        " · ≈ " + estMinutes() + " min</div>" +
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

  /* ---- hold timer ---- */
  function resetHold() {
    clearInterval(holdInterval); holdInterval = null;
    holdDoneSides = 0; holdMinMet = false;
    holdRemaining = holdCeil(ex[idx]);
  }

  function sideDone(e) {
    holdDoneSides++;
    holdMinMet = false;
    holdRemaining = holdDoneSides < sidesOf(e) ? holdCeil(e) : 0;
  }

  function toggleHold() {
    const e = ex[idx];
    if (!e || !e.hold || phase !== "work") return;
    if (holdRunning()) {
      clearInterval(holdInterval); holdInterval = null;
      // Stopping AFTER the minimum counts the side; stopping before it re-arms.
      // That is the difference between finishing a range early and bailing, and
      // it is the only place this tool takes a view on whether a rep counted.
      if (holdMinMet) sideDone(e); else holdRemaining = holdCeil(e);
      return updateUI();
    }
    if (holdDoneSides >= sidesOf(e)) holdDoneSides = 0;   // "Repetir" after every side
    holdMinMet = false;
    holdRemaining = holdCeil(e);
    holdInterval = setInterval(() => {
      holdRemaining--;
      if (holdRanged(e) && !holdMinMet && holdCeil(e) - holdRemaining >= e.hold) {
        holdMinMet = true; beep(760, 0.12); buzz(60);   // minimum dose reached
      }
      if (holdRemaining <= 3 && holdRemaining > 0) beep(660, 0.1);
      if (holdRemaining <= 0) {
        beep(880, 0.3); buzz([200, 100, 200]);
        clearInterval(holdInterval); holdInterval = null;
        sideDone(e);
      }
      updateUI();
    }, 1000);
    updateUI();
  }

  /* ---- progression ---- */
  function completeSet() {
    if (phase !== "work") return;
    setsDone++;
    const e = ex[idx];
    if (set < e.sets) {
      set++;
      resetHold();
      if (e.rest) startRest(e.rest); else updateUI();
    } else {
      advance(e.rest);
    }
  }

  function advance(restAfter) {
    idx++; set = 1;
    resetHold();
    if (idx >= ex.length) return finish();
    if (restAfter) startRest(restAfter); else updateUI();
  }

  function finish() {
    phase = "done";
    clearInterval(interval); interval = null;
    clearInterval(holdInterval); holdInterval = null;
    buzz([300, 100, 300, 100, 500]);
    $("statEx").textContent = ex.length;
    $("statSets").textContent = setsDone;
    $("statSkip").textContent = skipped;
    updateUI();
  }

  /* ---- controls ---- */
  $("setDoneBtn").addEventListener("click", completeSet);
  if ($("holdBtn")) $("holdBtn").addEventListener("click", toggleHold);

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
    resetHold();
    updateUI();
  });

  $("skipRestBtn").addEventListener("click", () => { if (phase === "rest") endRest(); });

  $("repeatBtn").addEventListener("click", () => {
    idx = 0; set = 1; setsDone = 0; skipped = 0; phase = "work";
    resetHold();
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

    // Hold timer: present only where the prescription is a duration, and hidden
    // during rest so the screen never shows two clocks at once.
    if ($("holdBlock")) {
      const showHold = !!e.hold && phase === "work";
      $("holdBlock").hidden = !showHold;
      if (showHold) {
        const sides = sidesOf(e), done = holdDoneSides >= sides;
        const secLbl = holdRanged(e) ? e.hold + "-" + holdCeil(e) + "s" : e.hold + "s";
        $("holdTime").textContent = done ? "✓" : fmt(holdRemaining || holdCeil(e));
        $("holdTime").classList.toggle("hold-complete", done);
        $("holdTime").classList.toggle("hold-live", holdRunning() && !holdMinMet);
        $("holdTime").classList.toggle("hold-min-met", holdRunning() && holdMinMet);
        $("holdBtn").textContent =
          holdRunning() ? (holdMinMet ? t("holdOk", "Listo ✓") : t("holdStop", "Detener"))
          : done ? t("holdAgain", "Repetir")
          : sides > 1
            ? t("holdSide", "Lado {n} · {t}").replace("{n}", holdDoneSides + 1).replace("{t}", secLbl)
            : t("holdStart", "Iniciar {t}").replace("{t}", secLbl);
      }
    }

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
