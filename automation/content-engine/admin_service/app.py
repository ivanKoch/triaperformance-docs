#!/usr/bin/env python3
"""
Admin idea-review service — the batch approval surface for the content engine.

Single user (Iván). Bound to 127.0.0.1 only; Caddy gates /admin/* with basic_auth
and proxies here. No auth logic lives in this service — that is deliberate. The
members area needed per-subscriber tokens because revoking one must not affect
the others; here there is exactly one user, so a Caddy basic_auth line is the
whole requirement and a second token system would be invented complexity.

Routes
    GET  /admin/ideas/           the review table
    POST /admin/ideas/decide     batch approve/reject (form post from that page)

Run:
    CONTENT_DB_DSN=postgres://... python3 app.py
"""

import json
import os

import psycopg2
import psycopg2.extras
from flask import Flask, redirect, request

app = Flask(__name__)
DSN = os.environ["CONTENT_DB_DSN"]

TYPE_LABEL = {
    "plan_guide": "Plan guide",
    "education": "Education",
    "gated_teaser": "Gated teaser",
    "gear": "Gear",
}
CTA_LABEL = {
    "plan": "Plan", "all_access": "All-Access", "coaching": "Coaching",
    "affiliate": "Affiliate", "lead_magnet": "Lead magnet", "none": "No CTA",
}
LANG_LABEL = {"es": "ES", "en": "EN", "pt": "PT"}


def db():
    return psycopg2.connect(DSN, cursor_factory=psycopg2.extras.RealDictCursor)


PAGE = """<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Ideas pendientes — Triaperformance</title>
<style>
  :root {{ --blue:#004aad; --blue-deep:#003a89; --ink:#1e2019; --white:#fff;
           --wash:#edf3fb; --slate:#565a52; --mist:#e4e6e1; }}
  * {{ box-sizing:border-box; margin:0; padding:0; }}
  body {{ font-family:"Helvetica Neue",Helvetica,Arial,system-ui,sans-serif;
          color:var(--ink); background:var(--white); line-height:1.6; }}
  .wrap {{ max-width:1080px; margin:0 auto; padding:0 24px; }}
  header {{ border-bottom:1px solid var(--mist); padding:32px 0; margin-bottom:32px; }}
  h1 {{ font-size:32px; font-weight:700; letter-spacing:-0.02em; }}
  .sub {{ color:var(--slate); font-size:15px; margin-top:6px; }}
  .bar {{ position:sticky; top:0; z-index:5; background:var(--white);
          border-bottom:1px solid var(--mist); padding:14px 0; margin-bottom:24px;
          display:flex; gap:12px; align-items:center; flex-wrap:wrap; }}
  button {{ font-family:inherit; font-size:14px; font-weight:700; padding:10px 18px;
            border-radius:4px; cursor:pointer; border:1.5px solid var(--ink);
            background:transparent; color:var(--ink); }}
  button.primary {{ background:var(--blue); border-color:var(--blue); color:#fff; }}
  button.primary:hover {{ background:var(--blue-deep); }}
  .idea {{ border:1px solid var(--mist); border-radius:8px; padding:20px 24px;
           margin-bottom:16px; display:grid; grid-template-columns:auto 1fr;
           gap:0 18px; align-items:start; }}
  .idea.rejecting {{ opacity:.45; }}
  .idea h2 {{ font-size:19px; font-weight:700; margin-bottom:6px; line-height:1.3; }}
  .meta {{ font-size:12px; font-weight:700; text-transform:uppercase;
           letter-spacing:.06em; color:var(--blue); margin-bottom:8px; }}
  .angle {{ font-size:15px; margin-bottom:8px; }}
  .why {{ font-size:14px; color:var(--slate); margin-bottom:10px; }}
  .assets {{ font-size:13px; color:var(--slate); }}
  .assets span {{ display:inline-block; background:var(--wash); border-radius:3px;
                  padding:2px 8px; margin:0 4px 4px 0; }}
  .ev a {{ font-size:12px; color:var(--slate); margin-right:10px; }}
  .decide {{ display:flex; flex-direction:column; gap:6px; padding-top:2px; }}
  .decide label {{ font-size:12px; font-weight:700; cursor:pointer;
                   display:flex; gap:5px; align-items:center; }}
  .score {{ font-size:12px; color:var(--slate); margin-top:8px; }}
  .empty {{ padding:60px 0; color:var(--slate); }}
  footer {{ padding:40px 0; color:var(--slate); font-size:13px; }}
</style></head><body>
<div class="wrap">
  <header>
    <h1>Ideas pendientes</h1>
    <p class="sub">{count} propuestas · revisá en lote y guardá una vez</p>
  </header>

  <form method="POST" action="/admin/ideas/decide">
  <div class="bar">
    <button type="button" onclick="setAll('approve')">Aprobar todas</button>
    <button type="button" onclick="setAll('reject')">Rechazar todas</button>
    <button type="button" onclick="setAll('skip')">Dejar pendientes</button>
    <button type="submit" class="primary">Guardar decisiones</button>
  </div>
  {body}
  </form>
  <footer>Las ideas que dejes pendientes vuelven a aparecer la próxima vez.</footer>
</div>
<script>
  function setAll(v) {{
    document.querySelectorAll('input[value="'+v+'"]').forEach(function(r){{ r.checked = true; }});
    document.querySelectorAll('.idea').forEach(function(c){{
      c.classList.toggle('rejecting', v === 'reject');
    }});
  }}
  document.addEventListener('change', function(e){{
    if (e.target.type !== 'radio') return;
    var card = e.target.closest('.idea');
    if (card) card.classList.toggle('rejecting', e.target.value === 'reject');
  }});
</script>
</body></html>"""


@app.get("/admin/ideas/")
def review():
    with db() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM pending_ideas")
        ideas = cur.fetchall()

    if not ideas:
        body = '<p class="empty">No hay ideas pendientes. El agente corre los lunes.</p>'
        return PAGE.format(count=0, body=body)

    cards = []
    for i in ideas:
        assets = i["our_assets"] or []
        if isinstance(assets, str):
            assets = json.loads(assets)
        evidence = i["evidence"] or []
        if isinstance(evidence, str):
            evidence = json.loads(evidence)

        asset_html = "".join(f"<span>{a}</span>" for a in assets)
        ev_html = "".join(
            f'<a href="{u}" target="_blank" rel="noopener">fuente {n+1}</a>'
            for n, u in enumerate(evidence[:4])
        )
        cards.append(f"""
        <div class="idea">
          <div class="decide">
            <label><input type="radio" name="d_{i['id']}" value="approve"> Sí</label>
            <label><input type="radio" name="d_{i['id']}" value="reject"> No</label>
            <label><input type="radio" name="d_{i['id']}" value="skip" checked> —</label>
          </div>
          <div>
            <p class="meta">{LANG_LABEL.get(i['language'], i['language'])} ·
               {TYPE_LABEL.get(i['article_type'], i['article_type'])} ·
               {CTA_LABEL.get(i['cta_type'], i['cta_type'])}
               {('· ' + i['cta_target']) if i['cta_target'] else ''}</p>
            <h2>{i['working_title']}</h2>
            <p class="angle">{i['angle'] or ''}</p>
            <p class="why">{i['rationale'] or ''}</p>
            <p class="assets">{asset_html}</p>
            <p class="ev">{ev_html}</p>
            <p class="score">score {i['score']} · {i['source_count']} fuentes ·
               búsqueda: {i['target_query'] or '—'}</p>
          </div>
        </div>""")

    return PAGE.format(count=len(ideas), body="".join(cards))


@app.post("/admin/ideas/decide")
def decide():
    approve, reject = [], []
    for key, val in request.form.items():
        if not key.startswith("d_"):
            continue
        try:
            idea_id = int(key[2:])
        except ValueError:
            continue
        if val == "approve":
            approve.append(idea_id)
        elif val == "reject":
            reject.append(idea_id)
        # "skip" leaves the row PROPOSED so it reappears next time.

    with db() as conn, conn.cursor() as cur:
        if approve:
            cur.execute("UPDATE content_ideas SET status='APPROVED', decided_at=now() "
                        "WHERE id = ANY(%s) AND status='PROPOSED'", (approve,))
        if reject:
            cur.execute("UPDATE content_ideas SET status='REJECTED', decided_at=now() "
                        "WHERE id = ANY(%s) AND status='PROPOSED'", (reject,))
        conn.commit()

    print(f"[decide] approved={len(approve)} rejected={len(reject)}")
    return redirect("/admin/ideas/", code=303)


@app.get("/admin/health")
def health():
    with db() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) AS n FROM content_ideas WHERE status='PROPOSED'")
        return {"ok": True, "pending": cur.fetchone()["n"]}


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8092)
