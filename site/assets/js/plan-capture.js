/**
 * Email capture on individual plan pages — Phase 1 standing decision
 * (growth-roadmap.md storefront section): capture ships before the TP
 * redirect, but must NEVER block it. The "Buy on TrainingPeaks" button next
 * to this form is a plain <a href> with no JS gate on it at all — it works
 * whether or not this form is ever touched. This script only handles the
 * optional capture.
 *
 * One file, loaded once, delegated to every .plan-capture-form on the page
 * (there's one per plan page) rather than an inline <script> repeated 321
 * times across the build.
 *
 * Endpoint: same-origin /api/plan-lead, proxied by Caddy to an n8n webhook —
 * same pattern as /api/contact-form (see contact-form-pipeline-runbook.md).
 * NOT LIVE YET as of this commit — see plan-lead-pipeline-runbook.md for the
 * exact Caddy route, n8n workflow, and Twenty leadSource enum value
 * (PLAN_CATALOG) that need to be added before this endpoint responds with
 * anything but a 404. Until then this fails silently into the "couldn't
 * send" message and the buy button still works.
 */
(function () {
  var ENDPOINT = "/api/plan-lead";

  document.addEventListener("submit", function (e) {
    var form = e.target.closest(".plan-capture-form");
    if (!form) return;
    e.preventDefault();

    var status = form.querySelector(".plan-capture-status");
    var button = form.querySelector("button[type=submit]");
    var email = form.querySelector("input[name=email]").value.trim();
    var lang = form.dataset.lang || "es";
    var submittingText = { es: "Enviando…", en: "Sending…", pt: "Enviando…" }[lang];
    var successText = { es: "Listo, te lo mandamos.", en: "Done, check your inbox.", pt: "Pronto, enviamos para você." }[lang];
    var errorText = {
      es: "No se pudo enviar — podés seguir con la compra igual.",
      en: "Couldn't send that — you can still go ahead and buy.",
      pt: "Não deu para enviar — você pode seguir com a compra normalmente.",
    }[lang];

    var originalButtonText = button.textContent;
    button.disabled = true;
    button.textContent = submittingText;
    status.className = "plan-capture-status";
    status.textContent = "";

    var payload = {
      email: email,
      plan_id: form.dataset.planId,
      plan_name: form.dataset.planName,
      language: lang,
      source: "plan_catalog",
      page_url: form.dataset.pageUrl,
      submitted_at: new Date().toISOString(),
    };

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("bad_status");
        return res.json().catch(function () { return {}; });
      })
      .then(function () {
        status.className = "plan-capture-status success";
        status.textContent = successText;
        if (window.gtag) {
          gtag("event", "generate_lead", {
            form_id: "plan-capture",
            plan_id: payload.plan_id,
            page_path: window.location.pathname,
          });
        }
        form.reset();
      })
      .catch(function () {
        status.className = "plan-capture-status error";
        status.textContent = errorText;
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = originalButtonText;
      });
  });
})();
