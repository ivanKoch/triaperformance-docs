/**
 * Race-page plan facets: intensity type (heart rate / pace) x gym.
 *
 * Every variant's grid is already in the HTML — this only toggles which one is
 * visible, so the page works with JS off (the first grid renders, the buttons
 * do nothing) and there is no template on the client to disagree with the one
 * on the server.
 *
 * THE ONLY REAL LOGIC HERE IS ABSENCE. Not every combination exists: Spanish
 * has no heart-rate + gym marathon ladder at all, and its pace + gym ladder is
 * 12 weeks only. A control that silently returns nothing is worse than no
 * control, so an unavailable option is disabled with a reason and a partial one
 * says which durations it has. Which combinations exist is read from the
 * server-rendered `data-available`, never assumed here.
 *
 * Copy comes from data-* attributes on the script tag, for the reason
 * plan-capture.js already documents: a second copy of a string in JS drifts
 * from raceUi.json the first time the wording changes.
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-race-facets]");
  if (!root) return;

  var script = document.currentScript || document.querySelector('script[src*="race-facets"]');
  var COPY = {
    unavailable: (script && script.dataset.unavailable) || "",
    weeksOnly: (script && script.dataset.weeksOnly) || "",
  };

  var available;
  try { available = JSON.parse(root.dataset.available || "[]"); }
  catch (e) { return; }
  if (!available.length) return;

  var note = document.querySelector("[data-facet-note]");
  var grids = Array.prototype.slice.call(document.querySelectorAll(".race-plan-grid[data-variant]"));
  var state = { metric: "hr", gym: false };

  function keyFor(metric, gym) { return metric + (gym ? "-gym" : ""); }
  function exists(metric, gym) { return available.indexOf(keyFor(metric, gym)) !== -1; }

  function render() {
    var key = keyFor(state.metric, state.gym);

    grids.forEach(function (g) { g.hidden = g.dataset.variant !== key; });

    root.querySelectorAll("button[data-facet]").forEach(function (b) {
      var isMetric = b.dataset.facet === "metric";
      var on = isMetric
        ? b.dataset.value === state.metric
        : (b.dataset.value === "on") === state.gym;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");

      // A gym button is disabled when the current intensity type has no such
      // ladder — the honest state, and the one that stops a click producing an
      // empty grid. Metric buttons are never disabled: every metric present has
      // at least its no-gym ladder.
      if (!isMetric) {
        var reachable = exists(state.metric, b.dataset.value === "on");
        b.disabled = !reachable;
        b.title = reachable ? "" : COPY.unavailable;
      }
    });

    var active = grids.filter(function (g) { return g.dataset.variant === key; })[0];
    if (note) {
      if (active && active.dataset.complete === "false" && COPY.weeksOnly) {
        note.textContent = COPY.weeksOnly.replace("{weeks}", (active.dataset.weeks || "").split(",").join(" y "));
        note.hidden = false;
      } else {
        note.hidden = true;
      }
    }
  }

  root.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-facet]");
    if (!b || b.disabled) return;

    if (b.dataset.facet === "metric") {
      var metric = b.dataset.value;
      // Switching intensity type can strand the gym choice — pace + gym exists
      // in Spanish, heart rate + gym does not. Fall back to the no-gym ladder
      // rather than leaving the page on a combination with no plans.
      if (!exists(metric, state.gym)) state.gym = false;
      state.metric = metric;
    } else {
      state.gym = b.dataset.value === "on";
    }
    render();
  });

  render();
})();
