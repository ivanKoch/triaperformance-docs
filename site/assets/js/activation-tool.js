/* Activation tool engine — shared by every activation artifact.
   Reads window.ACTIVATION_DATA (defined inline in each tool's page):
   { title, subtitle, context, why, doneSub, workSeconds?, restSeconds?,
     phases: [{ name, exercises: [{ name, mode: "bi"|"uni"|"alt", tag?, cue?,
                video? (YouTube ID, null until available),
                variants: [{ name, mode, cue?, tag? }] }] }] }
   Timing rules: uni = full duration per side (two blocks), alt/bi = one block. */
(function () {
  const D = window.ACTIVATION_DATA;
  // UI chrome, from site/_data/activationUi.json via the partial. Falls back to
  // Spanish only so a missing file degrades to the previous behaviour rather
  // than rendering "undefined" all over a paid page.
  const U = window.ACTIVATION_UI || {};
  const t = (k, es) => U[k] || es;
  const WORK = D.workSeconds || 40;
  const REST = D.restSeconds || 15;
  // Per-exercise duration override. Deep mobility holds want longer than the
  // activation blocks in the same routine, and a single global value forced each
  // routine into one compromise — which for a 60-second hold is the difference
  // between a stretch and a gesture at one. Falls back to the routine's default.
  const secsOf = (ex) => (ex && ex.secs) || WORK;
  const MODE_LABEL = (ex) => {
    const n = secsOf(ex);
    return { bi: n + "s", uni: n + t("perSide", "s por lado"), alt: t("alternating", "alternado") + " · " + n + "s" }[ex.mode];
  };
  const CIRC = 2 * Math.PI * 52;

  // Flatten phases into a mutable exercise list (replace swaps entries in place)
  const exercises = [];
  D.phases.forEach(ph => ph.exercises.forEach(ex =>
    exercises.push(Object.assign({}, ex, { phase: ph.name }))));

  let idx = 0, side = 1, remaining = WORK, phase = "idle"; // idle | work | rest | done
  let interval = null, skipped = 0, replaced = 0;

  const $ = id => document.getElementById(id);
  const blocksOf = ex => ex.mode === "uni" ? 2 : 1;
  const totalBlocks = () => exercises.reduce((a, e) => a + blocksOf(e), 0);
  const blocksDone = () => exercises.slice(0, idx).reduce((a, e) => a + blocksOf(e), 0) + (side === 2 ? 1 : 0);
  const estMinutes = () => {
    const work = exercises.reduce((a, e) => a + secsOf(e) * blocksOf(e), 0);
    return Math.round((work + (totalBlocks() - 1) * REST) / 60);
  };

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
  document.querySelectorAll(".tool-tab").forEach(btn =>
    btn.addEventListener("click", () => goTab(btn.dataset.tab)));
  function goTab(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".tool-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === id));
    $("tab-" + id).classList.add("active");
    if (id === "list") renderList();
    if (id === "workout") updateUI();
  }

  /* ---- home ---- */
  function renderHome() {
    $("homeContent").innerHTML =
      '<span class="label">' + (D.kicker || t("kicker", "Activación")) + '</span>' +
      '<h1 class="home-title">' + D.title + '</h1>' +
      '<p class="home-sub">' + D.subtitle + '</p>' +
      '<div class="context-pill">' + D.context + ' · ≈ ' + estMinutes() + ' min</div>' +
      '<div class="why-box"><div class="why-title">' + t("why", "Por qué importa") + '</div><div class="why-text">' + D.why + '</div></div>' +
      '<div class="phase-overview">' + D.phases.map(ph =>
        '<div class="phase-row"><span class="phase-dot"></span><span class="phase-row-name">' + ph.name +
        '</span><span class="phase-row-detail">' + ph.exercises.length +
        " " + (ph.exercises.length === 1 ? t("exercise", "ejercicio") : t("exercises", "ejercicios")) + '</span></div>').join("") +
      '</div>' +
      '<button class="btn-primary start-btn" id="startBtn">' + t("startRoutine", "Empezar activación →") + '</button>';
    $("startBtn").addEventListener("click", () => {
      goTab("workout");
      if (phase === "idle") { startWork(); run(); }
    });
  }

  /* ---- engine ---- */
  function run() { if (!interval) interval = setInterval(tick, 1000); updateUI(); }
  function pause() { clearInterval(interval); interval = null; updateUI(); }

  function tick() {
    remaining--;
    if (remaining <= 3 && remaining > 0) beep(660, 0.1);
    if (remaining <= 0) {
      beep(880, 0.3); buzz([200, 100, 200]);
      if (phase === "work") endWorkBlock(); else startWork();
    }
    updateUI();
  }

  function startWork() { phase = "work"; remaining = secsOf(exercises[idx]); }

  function endWorkBlock() {
    const ex = exercises[idx];
    if (ex.mode === "uni" && side === 1) {
      side = 2; phase = "rest"; remaining = REST;
    } else {
      advance();
      if (phase !== "done") { phase = "rest"; remaining = REST; }
    }
  }

  function advance() {
    idx++; side = 1;
    if (idx >= exercises.length) finish();
  }

  function finish() {
    phase = "done";
    clearInterval(interval); interval = null;
    buzz([300, 100, 300, 100, 500]);
    $("statEx").textContent = exercises.length;
    $("statMin").textContent = "≈" + estMinutes() + "'";
    $("statSkip").textContent = skipped;
    updateUI();
  }

  /* ---- controls ---- */
  $("mainBtn").addEventListener("click", () => {
    if (phase === "done") return;
    if (interval) pause();
    else { if (phase === "idle") startWork(); run(); }
  });

  $("skipBtn").addEventListener("click", () => {
    if (phase === "idle" || phase === "done") return;
    skipped++;
    clearIfRest();
    advance();
    if (phase !== "done") { phase = "rest"; remaining = REST; }
    updateUI();
  });

  // back one exercise (or from side 2 back to side 1), restart its full block
  $("prevBtn").addEventListener("click", () => {
    if (phase === "idle" || phase === "done") return;
    if (side === 2) side = 1;
    else if (idx > 0) { idx--; side = 1; }
    startWork();
    updateUI();
  });

  $("skipRestBtn").addEventListener("click", () => {
    if (phase === "rest") { startWork(); updateUI(); }
  });

  $("repeatBtn").addEventListener("click", () => {
    idx = 0; side = 1; skipped = 0; replaced = 0;
    startWork(); run();
  });

  function clearIfRest() { /* rest state is implicit in `phase`; nothing extra to clear */ }

  /* ---- variant swap ---- */
  $("changeLink").addEventListener("click", () => {
    if (phase === "done") return;
    const ex = exercises[idx];
    if (!ex.variants || !ex.variants.length) return;
    $("variantList").innerHTML = ex.variants.map((v, i) =>
      '<button class="variant" data-i="' + i + '"><span class="v-name">' + v.name +
      '</span><span class="v-meta">' + MODE_LABEL(v) + '</span></button>').join("");
    $("variantOverlay").classList.add("open");
  });

  $("variantList").addEventListener("click", e => {
    const btn = e.target.closest(".variant");
    if (!btn) return;
    const ex = exercises[idx];
    const v = ex.variants[+btn.dataset.i];
    const old = { name: ex.name, mode: ex.mode, cue: ex.cue, tag: ex.tag };
    exercises[idx] = Object.assign({}, ex, {
      name: v.name, mode: v.mode,
      cue: v.cue || ex.cue, tag: v.tag || ex.tag,
      variants: [old].concat(ex.variants.filter(x => x !== v))
    });
    replaced++;
    side = 1;
    if (phase === "work") remaining = secsOf(exercises[idx]); // restart block; during rest keep the countdown
    $("variantOverlay").classList.remove("open");
    updateUI();
  });

  $("closeVariant").addEventListener("click", () => $("variantOverlay").classList.remove("open"));
  $("variantOverlay").addEventListener("click", e => {
    if (e.target === $("variantOverlay")) $("variantOverlay").classList.remove("open");
  });

  /* ---- workout UI ---- */
  function nextBlockInfo() {
    const ex = exercises[idx];
    if (!ex) return null;
    if (phase !== "rest" && ex.mode === "uni" && side === 1) return ex.name + " — " + t("side", "Lado") + " 2";
    const nx = exercises[idx + 1];
    return nx ? nx.name : null;
  }

  function updateUI() {
    const ex = exercises[idx];
    const tb = totalBlocks();
    $("mainBtn").textContent = phase === "idle" ? t("start", "Empezar") : (interval ? t("pause", "Pausar") : t("resume", "Reanudar"));
    $("prevBtn").disabled = phase === "idle" || phase === "done" || (idx === 0 && side === 1);
    $("skipBtn").disabled = phase === "idle" || phase === "done";
    $("restOverlay").style.display = phase === "rest" ? "flex" : "none";
    $("doneOverlay").style.display = phase === "done" ? "flex" : "none";
    $("workControls").style.display = phase === "done" ? "none" : "flex";
    if (phase === "done") { $("totalBar").style.width = "100%"; return; }

    $("phaseName").textContent = ex.phase;
    $("blockProgress").textContent = Math.min(blocksDone() + 1, tb) + " / " + tb;
    $("totalBar").style.width = (blocksDone() / tb * 100) + "%";
    /* Was hardcoded Spanish — "Ejercicio N de M" — and therefore rendered in
       Spanish on /members/en/activation/, /members/pt/ativacao/, /members/en/core/
       and /members/pt/core/ from Aug 13, 2026 until Sept 4, 2026. It is the one
       string in this file that never went through t(), which is why §29's i18n
       pass did not catch it: that pass moved the strings it could see in the
       partial and in this file's t() calls. Found by looking at a rendered
       Portuguese page, not by reading the file.
       A template rather than two keys, because the word order is not the same
       in all three languages. */
    $("exNum").textContent = t("exerciseNum", "Ejercicio {n} de {total}")
      .replace("{n}", idx + 1).replace("{total}", exercises.length);
    $("exName").textContent = ex.name;
    $("exTag").textContent = ex.phase + (ex.tag ? " · " + ex.tag : "");
    $("exSpec").textContent = MODE_LABEL(ex);
    // innerHTML, not textContent: cues carry <strong> to mark the one instruction
    // that actually makes the exercise work. The Ejercicios tab already rendered
    // them as HTML, so textContent here meant the same cue displayed correctly in
    // one tab and as raw `<strong>` tags in the other. Content is ours, not input.
    $("exCue").innerHTML = ex.cue || "";
    $("exCue").style.display = ex.cue ? "block" : "none";

    // "Cambiar ejercicio" only exists if there is something to change to. The
    // handler already no-ops without variants, which made it a control that
    // rendered, invited a tap and did nothing — first surfaced by the activation
    // matrix (Aug 13, 2026), whose v1 routines carry no variants at all. A
    // silent no-op is worse than an absent button: the athlete concludes the
    // tool is broken, mid-set.
    $("changeLink").style.display = (ex.variants && ex.variants.length) ? "" : "none";
    $("ringTime").textContent = fmt(phase === "rest" ? secsOf(ex) : remaining);
    $("ringLbl").textContent = ex.mode === "uni" ? t("side", "Lado") + " " + side : (ex.mode === "alt" ? t("alternating", "alternado") : "");
    const pct = phase === "work" ? remaining / secsOf(ex) : 1;
    $("ringArc").style.strokeDashoffset = CIRC * (1 - pct);

    const nx = nextBlockInfo();
    $("nextPreview").textContent = nx ? t("next", "Siguiente:") + " " + nx : t("lastBlock", "Último bloque");
    $("nextPreview").style.visibility = nx ? "visible" : "hidden";

    if (phase === "rest") {
      // during rest, idx/side already point at the upcoming block
      const posChange = idx > 0 && side === 1 && exercises[idx - 1].phase !== ex.phase;
      $("restLbl").textContent = posChange ? t("positionChange", "Cambio de posición →") + " " + ex.phase : t("rest", "Descanso");
      $("restTime").textContent = fmt(remaining);
      $("restNext").innerHTML = t("next", "Siguiente:") + ' <strong>' + ex.name +
        (ex.mode === "uni" ? " — " + t("side", "Lado") + " " + side : "") + "</strong>";
    }
  }

  /* ---- list ---- */
  function renderList() {
    let html = "", lastPhase = null;
    exercises.forEach((ex, i) => {
      if (ex.phase !== lastPhase) {
        if (lastPhase !== null) html += "</div>";
        html += '<div class="list-phase"><div class="list-phase-title"><span class="phase-dot"></span>' + ex.phase + "</div>";
        lastPhase = ex.phase;
      }
      html += '<div class="list-ex"><div class="list-ex-num">' + (i + 1) + '</div><div class="list-ex-content">' +
        '<div class="list-ex-name">' + ex.name + '</div>' +
        '<div class="list-ex-detail">' + MODE_LABEL(ex) + (ex.tag ? " · " + ex.tag : "") + '</div>' +
        (ex.cue ? '<div class="list-ex-cue">' + ex.cue + '</div>' : "") +
        (ex.variants && ex.variants.length
          ? '<div class="list-ex-variants">' + t("variants", "Variantes:") + " " + ex.variants.map(v => v.name).join(" · ") + '</div>' : "") +
        (ex.video
          ? '<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/' + ex.video +
            '" title="' + ex.name + '" loading="lazy" allowfullscreen></iframe></div>' : "") +
        '</div></div>';
    });
    if (lastPhase !== null) html += "</div>";
    $("listContent").innerHTML = html;
  }

  renderHome();
  updateUI();
})();
