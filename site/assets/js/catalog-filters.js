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
  /* Queries run from `document`, not from the container, because an open panel
   * is temporarily re-parented into the <body>-level portal (see setupChips).
   * Safe because every catalog page has exactly one `[data-catalog]`. */
  function allBoxes(sel) { return document.querySelectorAll(sel || "input[type=checkbox][data-group]"); }

  function updateDependentFacets(container) {
    var checkedSports = Array.prototype.map.call(
      allBoxes('input[data-group="sport"]:checked'),
      function (cb) { return cb.value; }
    );
    document.querySelectorAll("[data-sports]").forEach(function (label) {
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
    allBoxes("input[type=checkbox][data-group]:checked").forEach(function (cb) {
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

  /* ---------------------------------------------------------------------
   * Mobile chip bar (≤800px). The facet sidebar becomes a horizontal row of
   * chips pinned under the nav, each opening a dropdown panel. Progressive
   * enhancement only: the markup, the checkboxes and applyFilters() above are
   * identical on both layouts, so there is exactly one source of filter state
   * and nothing to keep in sync. Everything below only changes what's visible.
   * ------------------------------------------------------------------- */
  var mq = window.matchMedia("(max-width: 800px)");

  /* The nav's height varies by language and shifts once webfonts land, so the
   * bar's sticky offset is measured rather than hardcoded. CSS holds a
   * close-enough fallback for the pre-script paint. The panels no longer need
   * measuring — they're positioned against `.facets` itself now, not the
   * viewport, so the browser does that arithmetic. */
  function measure(container) {
    var nav = document.querySelector(".site-nav-sticky");
    container.style.setProperty("--nav-h", (nav ? nav.offsetHeight : 0) + "px");
  }

  function updateBadges(container) {
    var total = 0;
    container.querySelectorAll("[data-facet-group]").forEach(function (group) {
      // The group's panel may currently be living in the portal.
      var panel = group.querySelector("[data-facet-panel]") ||
        document.querySelector('.facet-portal [data-facet-panel][data-owner="' + group.dataset.owner + '"]');
      var n = panel ? panel.querySelectorAll("input[type=checkbox]:checked").length : 0;
      total += n;
      var badge = group.querySelector("[data-facet-badge]");
      if (badge) {
        badge.textContent = n;
        badge.hidden = n === 0;
      }
      group.classList.toggle("has-active", n > 0);
    });
    var reset = container.querySelector("[data-reset]");
    if (reset) reset.hidden = mq.matches && total === 0;
  }

  /* Anchor the panel just under the bar, but never outside the viewport. The
   * bar is only pinned once you've scrolled to it; before that it can sit at
   * the very bottom of the screen, and a panel hung off it opens below the
   * fold. Clamped to the nav at the top and to half the viewport at the
   * bottom, the panel is always reachable wherever the bar happens to be. */
  function panelTop(container) {
    var nav = document.querySelector(".site-nav-sticky");
    var navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
    var facets = container.querySelector(".facets");
    var barBottom = facets ? facets.getBoundingClientRect().bottom : navBottom;
    return Math.round(Math.max(Math.max(navBottom, 0),
                               Math.min(barBottom, window.innerHeight * 0.5)));
  }

  /* Panels are moved into a <body>-level portal while open and put back on
   * close, so exactly one copy of each checkbox exists at all times. */
  function portalEl() {
    var el = document.querySelector(".facet-portal");
    if (!el) {
      el = document.createElement("div");
      el.className = "facet-portal";
      document.body.appendChild(el);
    }
    return el;
  }

  function closePanels(container) {
    container.querySelectorAll("[data-facet-group]").forEach(function (group) {
      group.classList.remove("is-open");
      var toggle = group.querySelector("[data-facet-toggle]");
      if (toggle && mq.matches) toggle.setAttribute("aria-expanded", "false");
      // Reclaim this group's panel from the portal, if it's the open one.
      var panel = document.querySelector('.facet-portal [data-facet-panel][data-owner="' + group.dataset.owner + '"]');
      if (panel) group.appendChild(panel);
    });
    var scrim = document.querySelector("[data-facet-scrim]");
    if (scrim) scrim.hidden = true;
  }

  /* Desktop is not a disclosure UI — the panels are always open there, so the
   * attribute is removed rather than left lying about a collapsed state. */
  function syncMode(container) {
    closePanels(container);
    container.querySelectorAll("[data-facet-toggle]").forEach(function (toggle) {
      if (mq.matches) toggle.setAttribute("aria-expanded", "false");
      else toggle.removeAttribute("aria-expanded");
    });
    if (mq.matches) measure(container);
  }

  function setupChips(container) {
    var portal = portalEl();

    // Each group gets an id so a panel can be handed back to the right one.
    container.querySelectorAll("[data-facet-group]").forEach(function (group, i) {
      group.dataset.owner = "g" + i;
      var panel = group.querySelector("[data-facet-panel]");
      if (panel) panel.dataset.owner = "g" + i;
    });

    var scrim = document.createElement("div");
    scrim.className = "facet-scrim";
    scrim.setAttribute("data-facet-scrim", "");
    scrim.hidden = true;
    portal.appendChild(scrim);
    scrim.addEventListener("click", function () { closePanels(container); });

    container.addEventListener("click", function (e) {
      var toggle = e.target.closest && e.target.closest("[data-facet-toggle]");
      if (!toggle || !mq.matches) return;
      var group = toggle.closest("[data-facet-group]");
      var opening = !group.classList.contains("is-open");
      closePanels(container);
      if (opening) {
        measure(container);          // re-measure: nav height can change on rotate
        portal.style.setProperty("--panel-top", panelTop(container) + "px");
        portal.appendChild(group.querySelector("[data-facet-panel]"));
        group.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        scrim.hidden = false;
      }
    });

    /* Background scrolling is blocked by swallowing touchmove on the scrim
     * rather than by `overflow: hidden` on <html>. The overflow approach was
     * tried first and looked fine in the DOM, but a screenshot showed what it
     * actually did: locking the scroll container stops `position: sticky`
     * working, so the nav and the chip bar vanished the moment a panel opened
     * — the user lost the very bar they were filtering with. The panel itself
     * is outside the scrim, so its own overflow scrolling is unaffected. */
    scrim.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });

    /* If the page does scroll while a panel is open, keep the panel glued to
     * the bar instead of letting it drift. rAF-throttled. */
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking || !mq.matches) return;
      if (!document.querySelector(".facet-portal [data-facet-panel]")) return;
      ticking = true;
      requestAnimationFrame(function () {
        portal.style.setProperty("--panel-top", panelTop(container) + "px");
        ticking = false;
      });
    }, { passive: true });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanels(container);
    });

    var onViewportChange = function () { syncMode(container); };
    if (mq.addEventListener) mq.addEventListener("change", onViewportChange);
    else if (mq.addListener) mq.addListener(onViewportChange);   // older Safari
    window.addEventListener("resize", function () {
      if (mq.matches) measure(container);
    });
    // Webfonts can change the nav's height after first paint.
    window.addEventListener("load", function () {
      if (mq.matches) measure(container);
    });

    syncMode(container);
    updateBadges(container);
  }

  document.querySelectorAll("[data-catalog]").forEach(function (container) {
    // Preset facets (sport-specific category pages) narrow the distance
    // options before the first render, not just after the first change event.
    updateDependentFacets(container);

    // On `document`, not `container` — an open panel is re-parented out of the
    // container into the portal, so its change events never reach it.
    document.addEventListener("change", function (e) {
      if (!e.target || !e.target.dataset || !e.target.dataset.group) return;
      if (e.target.dataset.group === "sport") updateDependentFacets(container);
      applyFilters(container);
      updateBadges(container);
    });
    var resetBtn = container.querySelector("[data-reset]");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        allBoxes().forEach(function (cb) { cb.checked = false; });
        updateDependentFacets(container);
        applyFilters(container);
        updateBadges(container);
        closePanels(container);
      });
    }
    setupChips(container);
    // Preset facets (sport-specific category pages) filter on load.
    if (container.querySelector("input[type=checkbox]:checked")) applyFilters(container);
  });
})();
