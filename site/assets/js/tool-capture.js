/* tool-capture.js — the email capture on a public tool page.
 *
 * Posts to /api/tool-lead, the ONE endpoint every lead magnet shares. The
 * `magnet` field selects the PDF and the copy inside the n8n workflow, so this
 * file never learns which guide it is sending — that is what stops it becoming
 * the third near-identical copy of a capture script.
 *
 * Rendered by partials/tool-capture.njk; copy from site/_data/capture.json.
 * Status strings arrive on data-* attributes rather than being duplicated here:
 * a JS file carrying its own copy of the copy is how the plan capture ended up
 * promising "we sent it to you" months after the offer had changed.
 *
 * Field is `language`, not `lang` — the plan-lead and zone-workouts payloads
 * both use `language`, and two names for one field across three workflows is
 * how the es -> enum mapping bug got written the first time.
 */
(function () {
  "use strict";

  var root = document.getElementById("tool-capture");
  if (!root) return;

  var form = document.getElementById("tcForm");
  var input = document.getElementById("tcEmail");
  var btn = document.getElementById("tcSubmit");
  var status = document.getElementById("tcStatus");
  if (!form || !input || !btn || !status) return;

  var VALID = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  function say(msg, kind) {
    status.textContent = msg;
    status.className = "tc-status is-" + kind;
    status.hidden = false;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = (input.value || "").trim();
    if (!VALID.test(email)) { input.focus(); return; }

    btn.disabled = true;
    status.hidden = true;

    fetch("/api/tool-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        magnet: root.dataset.magnet,
        language: root.dataset.lang || document.documentElement.lang,
        source: "tool_page",
        page_url: window.location.href,
        submitted_at: new Date().toISOString()
      })
    })
      /* 🚨 `r.ok` ALONE IS NOT ENOUGH, and this was found the hard way on
         September 9, 2026. An n8n webhook set to responseMode "responseNode"
         returns **HTTP 200 with an empty body** when the workflow fails before
         reaching a Respond node — so a run that threw on its first validation
         step looked, from here, exactly like a successful send. The page would
         have shown "revisa tu bandeja de entrada" for an email nobody got,
         which is the same class of bug as a placeholder shipping as copy.
         The contract is now the BODY: `{"ok":true}`, not the status line. */
      .then(function (r) {
        if (!r.ok) throw new Error("bad status " + r.status);
        return r.json().catch(function () { throw new Error("empty body"); });
      })
      .then(function (d) {
        if (!d || d.ok !== true) throw new Error("workflow did not confirm");
        form.hidden = true;
        say(root.dataset.thanks, "ok");
        if (window.gtag) {
          window.gtag("event", "generate_lead", {
            lead_source: "tool_page",
            magnet: root.dataset.magnet
          });
        }
      })
      .catch(function () {
        btn.disabled = false;
        say(root.dataset.error, "err");
      });
  });

  /* The done-screen nudge. The overlay is shown by the engine flipping an
     inline style, which fires no event, so this watches for it. A MutationObserver
     rather than a timer: the engine sets display on every updateUI() call, and
     polling would either miss the moment or run for the whole 28-minute session. */
  var nudge = document.getElementById("tcNudge");
  var overlay = document.getElementById("doneOverlay");
  if (nudge) {
    nudge.addEventListener("click", function (e) {
      e.preventDefault();
      root.scrollIntoView({ behavior: "smooth", block: "center" });
      /* Focus after the scroll settles. Focusing first makes the browser jump
         to the field and then animate from it, which reads as a glitch. */
      window.setTimeout(function () { if (!form.hidden) input.focus(); }, 450);
    });
  }
  if (nudge && overlay) {
    new MutationObserver(function () {
      nudge.hidden = overlay.style.display === "none" || form.hidden;
    }).observe(overlay, { attributes: true, attributeFilter: ["style"] });
  }
})();
