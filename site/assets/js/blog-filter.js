/* Blog topic filter — pill row over the card grid.
 *
 * Progressive enhancement, same shape as catalog-filters.js: the server renders
 * every card visible, and this only hides things. With JS off the reader gets
 * the complete blog rather than an empty page — which is also why the pill row
 * is hidden by CSS until this script marks it ready. Showing a control that
 * does nothing is worse than showing no control.
 *
 * Filtering reads data-topic, which carries the SLUG, never the translated
 * label — so this one file works for /blog/, /en/blog/ and /pt/blog/ without
 * knowing which language it's on.
 *
 * The chosen topic is reflected in the URL hash (#tema=running) so a filtered
 * view can be linked — from a GBP post, an Instagram bio, or an internal link
 * in an article. Deliberately the hash and not a query string: it needs no
 * server round trip and cannot create a duplicate indexable URL, which on a
 * static site would mean the same 20 cards under ten addresses.
 */
(function () {
  "use strict";

  var row = document.querySelector("[data-topic-filter]");
  var grid = document.querySelector("[data-post-grid]");
  if (!row || !grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-topic]"));
  var pills = Array.prototype.slice.call(row.querySelectorAll("[data-filter]"));
  var empty = document.querySelector("[data-no-results]");
  var KEY = "tema=";

  function apply(topic, push) {
    var shown = 0;
    cards.forEach(function (card) {
      var match = topic === "all" || card.getAttribute("data-topic") === topic;
      card.hidden = !match;
      if (match) shown++;
    });

    pills.forEach(function (p) {
      var on = p.getAttribute("data-filter") === topic;
      p.classList.toggle("is-active", on);
      p.setAttribute("aria-pressed", on ? "true" : "false");
    });

    // The first card is styled larger. That only makes sense while it is
    // actually first — after filtering, the featured card may be hidden and a
    // different one leads. Recompute rather than leaving a gap in the grid.
    var first = true;
    cards.forEach(function (card) {
      var lead = !card.hidden && first;
      card.classList.toggle("post-card--featured", lead);
      if (!card.hidden) first = false;
    });

    if (empty) empty.hidden = shown !== 0;

    if (push) {
      var hash = topic === "all" ? " " : "#" + KEY + topic;
      history.replaceState(null, "", topic === "all"
        ? location.pathname + location.search
        : hash);
    }
  }

  row.addEventListener("click", function (e) {
    var pill = e.target.closest("[data-filter]");
    if (!pill) return;
    apply(pill.getAttribute("data-filter"), true);
  });

  // Keyboard: the pills are real <button>s, so Enter/Space already work. Left
  // and right arrows move between them, which is what a tablist-like row is
  // expected to do.
  row.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var i = pills.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    pills[(i + (e.key === "ArrowRight" ? 1 : pills.length - 1)) % pills.length].focus();
  });

  var initial = "all";
  if (location.hash.indexOf(KEY) === 1) {
    var want = decodeURIComponent(location.hash.slice(KEY.length + 1));
    // Only honour a topic that has a pill — a stale or hand-typed link to a
    // topic with no articles would otherwise render an empty grid.
    if (pills.some(function (p) { return p.getAttribute("data-filter") === want; })) {
      initial = want;
    }
  }

  row.classList.add("is-ready");
  apply(initial, false);
})();
