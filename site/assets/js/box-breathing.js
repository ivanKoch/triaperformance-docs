/* Box breathing — 4 in · 4 hold · 4 out · 4 hold.
 *
 * Deliberately NOT built on the activation-tool engine. That engine beeps,
 * vibrates and counts down loudly, which is right for a warm-up and wrong for a
 * wind-down: this tool exists to calm a nervous system down, usually at night,
 * usually in the dark. Everything here is the quiet version of a decision that
 * tool made the other way.
 *
 * Timing comes from performance.now(), not from an accumulating setInterval, so
 * a backgrounded tab or a dropped frame cannot make the cycle drift out of sync
 * with the athlete's actual breathing.
 */
(function () {
  "use strict";

  const root = document.getElementById("bb");
  if (!root) return;
  const T = JSON.parse(document.getElementById("bb-copy").textContent);

  const PHASE = 4;                 // seconds per side of the box
  const CYCLE = PHASE * 4;
  const $ = (id) => document.getElementById(id);

  let minutes = 5, cycles = 0, running = false, startedAt = 0, raf = null;
  let sound = false, wakeLock = null, audioCtx = null;
  let lastPhase = -1;

  /* ---------------------------------------------------------------- geometry */
  // The dot walks the perimeter anticlockwise from bottom-left, one side per
  // phase. Position is derived from elapsed time rather than animated with CSS
  // so the dot and the countdown can never disagree.
  const BOX = { x: 30, y: 30, w: 140 };
  function pointAt(phase, t) {
    const { x, y, w } = BOX;
    switch (phase) {
      case 0: return [x, y + w - w * t];        // inhale  — up the left side
      case 1: return [x + w * t, y];            // hold    — across the top
      case 2: return [x + w, y + w * t];        // exhale  — down the right side
      default: return [x + w - w * t, y + w];   // hold    — back across the bottom
    }
  }

  /* ------------------------------------------------------------------ audio */
  // A soft sine, short and low. Off by default: an unexpected tone at 10pm is
  // the opposite of what this is for. On, it lets the athlete keep their eyes
  // closed, which is the better way to do the practice.
  function tone(freq) {
    if (!sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.06, audioCtx.currentTime + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.45);
      o.start(); o.stop(audioCtx.currentTime + 0.5);
    } catch (e) { /* audio is a nicety; never let it break the session */ }
  }

  /* -------------------------------------------------------------- wake lock */
  async function holdScreen() {
    try { wakeLock = await navigator.wakeLock.request("screen"); } catch (e) {}
  }
  function releaseScreen() {
    try { wakeLock && wakeLock.release(); } catch (e) {}
    wakeLock = null;
  }
  document.addEventListener("visibilitychange", () => {
    if (running && document.visibilityState === "visible" && !wakeLock) holdScreen();
  });

  /* ------------------------------------------------------------------ frame */
  function frame(now) {
    const elapsed = (now - startedAt) / 1000;
    const total = cycles * CYCLE;

    if (elapsed >= total) return finish();

    const inCycle = elapsed % CYCLE;
    const phase = Math.floor(inCycle / PHASE);
    const t = (inCycle % PHASE) / PHASE;

    const [px, py] = pointAt(phase, t);
    $("bbDot").setAttribute("cx", px);
    $("bbDot").setAttribute("cy", py);

    // The traced outline: how much of the perimeter has been walked this cycle.
    const per = BOX.w * 4;
    $("bbTrace").style.strokeDasharray = per;
    $("bbTrace").style.strokeDashoffset = per - per * (inCycle / CYCLE);

    // The square breathes with you: grows through the inhale, holds its size
    // through the hold, shrinks through the exhale, stays small through the last
    // hold. The shape is doing what the athlete is doing.
    const scale = phase === 0 ? 0.86 + 0.14 * t
                : phase === 1 ? 1
                : phase === 2 ? 1 - 0.14 * t
                : 0.86;
    $("bbFill").style.transform = "scale(" + scale + ")";

    if (phase !== lastPhase) {
      lastPhase = phase;
      $("bbPhase").textContent = T.phases[phase];
      tone(phase === 0 ? 396 : phase === 2 ? 288 : 342);
    }
    $("bbCount").textContent = Math.ceil(PHASE - (inCycle % PHASE));

    // Session progress, deliberately a hairline rather than a clock. Knowing
    // exactly how long is left is a reason to keep checking.
    $("bbProgress").style.width = (elapsed / total * 100) + "%";

    raf = requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------- control */
  function start() {
    cycles = Math.round((minutes * 60) / CYCLE);   // whole cycles only
    running = true; lastPhase = -1;
    startedAt = performance.now();
    root.classList.add("bb--running");
    $("bbSetup").hidden = true; $("bbDone").hidden = true; $("bbSession").hidden = false;
    holdScreen();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    releaseScreen();
    root.classList.remove("bb--running");
    $("bbSession").hidden = true; $("bbSetup").hidden = false;
  }

  function finish() {
    running = false;
    cancelAnimationFrame(raf);
    releaseScreen();
    root.classList.remove("bb--running");
    $("bbSession").hidden = true; $("bbDone").hidden = false;
  }

  document.querySelectorAll(".bb-min").forEach((btn) => {
    btn.addEventListener("click", () => {
      minutes = Number(btn.dataset.min);
      document.querySelectorAll(".bb-min").forEach((b) =>
        b.setAttribute("aria-pressed", String(b === btn)));
    });
  });

  $("bbSound").addEventListener("click", () => {
    sound = !sound;
    $("bbSound").setAttribute("aria-pressed", String(sound));
    $("bbSound").textContent = sound ? T.soundOn : T.soundOff;
    if (sound) tone(342);   // also unlocks the audio context on iOS
  });

  $("bbStart").addEventListener("click", start);
  $("bbStop").addEventListener("click", stop);
  $("bbAgain").addEventListener("click", () => { $("bbDone").hidden = true; $("bbSetup").hidden = false; });
})();
