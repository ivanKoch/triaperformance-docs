/**
 * Client-side facet filtering for the plan catalogs. Static site, no
 * backend: every plan card is already server-rendered into the page (see
 * plan-catalog-grid.njk) so the catalog works with JS off — this script
 * only toggles which cards are visible.
 *
 * Semantics: OR within a facet group (checking two sports shows plans
 * matching either), AND across groups (checking a sport AND a difficulty
 * narrows to plans matching both) — the standard e-commerce facet pattern.
 *
 * Runs once per .plan-catalog container on the page (there's exactly one on
 * every catalog/category page). If a checkbox is pre-checked server-side
 * (the 4 sport-specific category pages preset their sport this way), the
 * page loads already filtered.
 */
(function () {
  /**
   * Dependent facet: the distance/enfoque options are tagged server-side
   * (plan-catalog-grid.njk) with data-sports listing which sport(s) each
   * value actually occurs under. With no sport checked, every option shows
   * (unfiltered, current behavior preserved). With one or more sports
   * checked, only options relevant to at least one checked sport stay
   * visible — same OR-within-a-group semantics as applyFilters. A distance
   * option hidden this way is also unchecked, so a stale filter (e.g.
   * "1900m" left checked from Swimming after switching to Running) can't
   * silently zero out the results.
   */
  function updateDependentFacets(container) {
    var checkedSports = Array.prototype.map.call(
      container.querySelectorAll('input[data-group="sport"]:checked'),
      function (cb) { return cb.value; }
    );
    container.querySelectorAll("[data-sports]").forEach(function (label) {
      var sports = (label.dataset.sports || "").split(/\s+/).filter(Boolean);
      var relevant = checkedSports.length === 0 ||
        sports.some(function (s) { return checkedSports.indexOf(s) !== -1; });
      label.hidden = !relevant;
      if (!relevant) {
        var cb = label.querySelector("input[type=checkbox]");
        if (cb) cb.checked = false;
      }
    });
  }

  function applyFilters(container) {
    var groups = {};
    container.querySelectorAll("input[type=checkbox]:checked").forEach(function (cb) {
      var g = cb.dataset.group;
      (groups[g] = groups[g] || []).push(cb.value);
    });

    var cards = container.querySelectorAll(".catalog-card");
    var visible = 0;

    cards.forEach(function (card) {
      var match = true;
      for (var g in groups) {
        if (g === "features") {
          var cardFeatures = (card.dataset.features || "").trim().split(/\s+/);
          if (!groups[g].some(function (v) { return cardFeatures.indexOf(v) !== -1; })) {
            match = false;
            break;
          }
        } else {
          var cardVal = card.dataset[g === "weeksbucket" ? "weeksbucket" : g];
          if (groups[g].indexOf(cardVal) === -1) {
            match = false;
            break;
          }
        }
      }
      card.hidden = !match;
      if (match) visible++;
    });

    var countEl = container.querySelector("[data-count]");
    if (countEl) {
      var suffix = countEl.textContent.replace(/^[\d.,]+\s*/, "");
      countEl.textContent = visible + " " + suffix;
    }
    var emptyEl = container.querySelector("[data-empty]");
    var gridEl = container.querySelector("[data-grid]");
    if (emptyEl && gridEl) {
      emptyEl.hidden = visible !== 0;
      gridEl.hidden = visible === 0;
    }
  }

  document.querySelectorAll("[data-catalog]").forEach(function (container) {
    // Preset facets (sport-specific category pages) narrow the distance
    // options before the first render, not just after the first change event.
    updateDependentFacets(container);

    container.addEventListener("change", function (e) {
      if (e.target && e.target.dataset && e.target.dataset.group === "sport") {
        updateDependentFacets(container);
      }
      applyFilters(container);
    });
    var resetBtn = container.querySelector("[data-reset]");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        container.querySelectorAll("input[type=checkbox]").forEach(function (cb) { cb.checked = false; });
        updateDependentFacets(container);
        applyFilters(container);
      });
    }
    // Preset facets (sport-specific category pages) filter on load.
    if (container.querySelector("input[type=checkbox]:checked")) applyFilters(container);
  });
})();
