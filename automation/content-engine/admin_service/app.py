#!/usr/bin/env python3
"""
Admin service — the review surfaces for the content engine.

Single user (Iván). Bound to 127.0.0.1; Caddy gates /admin/* with basic_auth and
proxies here. No auth logic lives in this service, deliberately: the members area
needs per-subscriber tokens because revoking one must not affect the others.
Here there is exactly one user, so a Caddy basic_auth line is the whole
requirement and a second token system would be invented complexity.

Routes
    GET  /admin/            -> redirect to /admin/ideas/
    GET  /admin/ideas/      batch approve/reject proposed ideas
    POST /admin/ideas/decide
    GET  /admin/ideas/new   write your own idea (Aug 13, 2026)
    POST /admin/ideas/new
    GET  /admin/drafts/     read, edit and approve written drafts
    POST /admin/drafts/decide
    GET  /admin/all/        everything, whatever its status — nothing disappears
    GET  /admin/health      diagnostics

Connection uses discrete keyword parameters, NOT a postgres:// URI: a URI cannot
carry a password containing ":" or "@", and libpq parses part of it as the port.
"""

import html as html_mod
import json
import os
import re

import psycopg2
import psycopg2.extras
from flask import Flask, redirect, request

app = Flask(__name__)

DB = {
    "host": os.environ.get("PG_HOST", "127.0.0.1"),
    "port": int(os.environ.get("PG_PORT", "5432")),
    "user": os.environ.get("PG_USER", "analytics"),
    "password": os.environ.get("PG_PASSWORD", ""),
    "dbname": os.environ.get("PG_DB_CONTENT", "content"),
}
DSN = os.environ.get("CONTENT_DB_DSN", "")

TYPE_LABEL = {"plan_guide": "Guía de planes", "education": "Educativo",
              "gated_teaser": "Teaser (miembros)", "gear": "Equipamiento",
              "case_study": "Caso de atleta"}
CTA_LABEL = {"plan": "Plan", "all_access": "All-Access", "coaching": "Coaching",
             "affiliate": "Afiliados", "lead_magnet": "Lead magnet", "none": "Sin CTA"}
LANG_LABEL = {"es": "ES", "en": "EN", "pt": "PT"}


def db():
    if DSN:
        return psycopg2.connect(DSN, cursor_factory=psycopg2.extras.RealDictCursor)
    return psycopg2.connect(cursor_factory=psycopg2.extras.RealDictCursor, **DB)


def jlist(v):
    if not v:
        return []
    return json.loads(v) if isinstance(v, str) else v


def esc(s):
    return html_mod.escape(str(s or ""))


# ---------------------------------------------------------------------------
# Shell
# ---------------------------------------------------------------------------
CSS = """
:root { --blue:#004aad; --blue-deep:#003a89; --ink:#1e2019; --white:#fff;
        --wash:#edf3fb; --slate:#565a52; --mist:#e4e6e1; }
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:"Helvetica Neue",Helvetica,Arial,system-ui,sans-serif;
       color:var(--ink); background:var(--white); line-height:1.6; }
.wrap { max-width:1080px; margin:0 auto; padding:0 24px 60px; }
/* Stuck-publish rows (added Aug 12, 2026). Amber, not red: nothing is broken
   or lost, a step just didn't complete and can be re-run. */
.stuck-row { display:flex; gap:10px; align-items:flex-start; padding:8px 0;
             border-top:1px solid var(--mist); }
.stuck-row input { margin-top:6px; }
header { border-bottom:1px solid var(--mist); padding:28px 0 20px; }
h1 { font-size:30px; font-weight:700; letter-spacing:-0.02em; }
.sub { color:var(--slate); font-size:15px; margin-top:4px; }
.adminnav { padding:14px 0 22px; border-bottom:1px solid var(--mist); margin-bottom:24px; }
.adminnav a { font-size:14px; font-weight:700; color:var(--slate);
              text-decoration:none; margin-right:22px; }
.adminnav a:hover, .adminnav a.on { color:var(--blue); }
.bar { position:sticky; top:0; z-index:5; background:var(--white);
       border-bottom:1px solid var(--mist); padding:14px 0; margin-bottom:24px;
       display:flex; gap:10px; flex-wrap:wrap; }
button { font-family:inherit; font-size:14px; font-weight:700; padding:10px 18px;
         border-radius:4px; cursor:pointer; border:1.5px solid var(--ink);
         background:transparent; color:var(--ink); }
button.primary { background:var(--blue); border-color:var(--blue); color:#fff; }
button.primary:hover { background:var(--blue-deep); }
.card { border:1px solid var(--mist); border-radius:8px; padding:20px 24px; margin-bottom:16px; }
.card.rejecting { opacity:.45; }
.idea { display:grid; grid-template-columns:auto 1fr; gap:0 18px; align-items:start; }
.meta { font-size:12px; font-weight:700; text-transform:uppercase;
        letter-spacing:.06em; color:var(--blue); margin-bottom:8px; }
.card h2 { font-size:20px; font-weight:700; margin-bottom:6px; line-height:1.3; }
.stand { color:var(--slate); font-size:16px; margin-bottom:10px; }
.angle { font-size:15px; margin-bottom:8px; }
.why { font-size:14px; color:var(--slate); margin-bottom:10px; }
.assets span { display:inline-block; background:var(--wash); border-radius:3px;
               font-size:13px; color:var(--slate); padding:2px 8px; margin:0 4px 4px 0; }
.ev a { font-size:12px; color:var(--slate); margin-right:10px; }
.decide { display:flex; flex-direction:column; gap:6px; padding-top:2px; }
.decide label { font-size:12px; font-weight:700; cursor:pointer;
                display:flex; gap:5px; align-items:center; }
.score { font-size:12px; color:var(--slate); margin-top:8px; }
.empty { padding:60px 0; color:var(--slate); }
footer { padding:36px 0; color:var(--slate); font-size:13px; }
.preview { border:1px solid var(--mist); border-radius:6px; padding:20px 24px;
           max-height:480px; overflow-y:auto; background:#fdfdfc; margin:14px 0; }
.preview h2 { font-size:19px; margin:22px 0 8px; }
.preview h3 { font-size:16px; margin:16px 0 6px; }
.preview p, .preview li { font-size:15px; line-height:1.6; margin-bottom:10px; }
.preview ul, .preview ol { margin-left:22px; }
.preview table { width:100%; border-collapse:collapse; margin:14px 0; font-size:14px; }
.preview th, .preview td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--mist); }
.preview .datanote { background:var(--wash); border-left:3px solid var(--blue);
                     padding:14px 18px; margin:16px 0; }
.preview code { background:var(--wash); padding:1px 5px; border-radius:3px; font-size:13px; }
textarea { width:100%; min-height:360px; font-family:ui-monospace,Menlo,monospace;
           font-size:13px; line-height:1.55; border:1px solid var(--mist);
           border-radius:4px; padding:12px; }
.hidden { display:none; }
.linkbtn { background:none; border:none; color:var(--blue); font-size:13px;
           padding:0; cursor:pointer; text-decoration:underline; }
/* Own-idea form (Aug 13, 2026). Reuses .card; only the controls are new. */
.field { margin-bottom:18px; }
.field label { display:block; font-size:12px; font-weight:700; text-transform:uppercase;
               letter-spacing:.06em; color:var(--blue); margin-bottom:6px; }
.field .hint { font-size:13px; color:var(--slate); margin-bottom:6px; font-weight:400;
               text-transform:none; letter-spacing:0; }
.field input[type=text], .field select, .field textarea {
  width:100%; font-family:inherit; font-size:15px; color:var(--ink);
  border:1px solid var(--mist); border-radius:4px; padding:10px 12px; background:var(--white); }
.field textarea { min-height:90px; line-height:1.55; }
.field select { height:42px; }
.row3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }
.err { background:#fdf1f1; border-left:3px solid #b23; padding:12px 16px;
       border-radius:4px; margin-bottom:20px; font-size:15px; }
.ok { background:var(--wash); border-left:3px solid var(--blue); padding:12px 16px;
      border-radius:4px; margin-bottom:20px; font-size:15px; }
@media (max-width:700px) { .row3 { grid-template-columns:1fr; } }
table.all { width:100%; border-collapse:collapse; font-size:14px; }
table.all th { text-align:left; font-size:12px; text-transform:uppercase;
               letter-spacing:.05em; color:var(--blue); padding:8px 10px;
               border-bottom:1px solid var(--mist); }
table.all td { padding:9px 10px; border-bottom:1px solid var(--mist); vertical-align:top; }
.pill { display:inline-block; font-size:11px; font-weight:700; padding:2px 8px;
        border-radius:3px; background:var(--wash); color:var(--blue);
        text-transform:uppercase; letter-spacing:.04em; }
"""


def page(title, sub, body, active=""):
    def cls(name):
        return ' class="on"' if active == name else ""
    return f"""<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>{esc(title)} — Triaperformance</title>
<style>{CSS}</style></head><body>
<div class="wrap">
  <header><h1>{esc(title)}</h1><p class="sub">{esc(sub)}</p></header>
  <nav class="adminnav">
    <a href="/admin/ideas/"{cls('ideas')}>Ideas pendientes</a>
    <a href="/admin/ideas/new"{cls('new')}>Nueva idea</a>
    <a href="/admin/drafts/"{cls('drafts')}>Borradores</a>
    <a href="/admin/all/"{cls('all')}>Todo</a>
  </nav>
  {body}
</div>
<script>
function setAll(v) {{
  document.querySelectorAll('input[type=radio][value="'+v+'"]').forEach(function(r){{ r.checked = true; }});
  document.querySelectorAll('.card').forEach(function(c){{ c.classList.toggle('rejecting', v === 'reject'); }});
}}
document.addEventListener('change', function(e){{
  if (e.target.type !== 'radio') return;
  var c = e.target.closest('.card');
  if (c) c.classList.toggle('rejecting', e.target.value === 'reject');
}});
function toggleEdit(id) {{
  document.getElementById('prev_'+id).classList.toggle('hidden');
  document.getElementById('edit_'+id).classList.toggle('hidden');
}}
</script>
</body></html>"""


# ---------------------------------------------------------------------------
@app.get("/admin")
@app.get("/admin/")
def admin_root():
    return redirect("/admin/ideas/", code=302)


@app.get("/admin/ideas")
@app.get("/admin/ideas/")
def ideas():
    with db() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM pending_ideas")
        rows = cur.fetchall()

    if not rows:
        return page("Ideas pendientes", "0 propuestas",
                    '<p class="empty">No hay ideas pendientes. El agente corre los lunes.</p>',
                    active="ideas")

    cards = []
    for i in rows:
        assets = "".join(f"<span>{esc(a)}</span>" for a in jlist(i["our_assets"]))
        ev = "".join(f'<a href="{esc(u)}" target="_blank" rel="noopener">fuente {n+1}</a>'
                     for n, u in enumerate(jlist(i["evidence"])[:4]))
        cards.append(f"""
    <div class="card idea">
      <div class="decide">
        <label><input type="radio" name="d_{i['id']}" value="approve"> Sí</label>
        <label><input type="radio" name="d_{i['id']}" value="reject"> No</label>
        <label><input type="radio" name="d_{i['id']}" value="skip" checked> —</label>
      </div>
      <div>
        <p class="meta">{LANG_LABEL.get(i['language'], i['language'])} ·
          {TYPE_LABEL.get(i['article_type'], i['article_type'])} ·
          {CTA_LABEL.get(i['cta_type'], i['cta_type'])}
          {('· ' + esc(i['cta_target'])) if i['cta_target'] else ''}</p>
        <h2>{esc(i['working_title'])}</h2>
        <p class="angle">{esc(i['angle'])}</p>
        <p class="why">{esc(i['rationale'])}</p>
        <p class="assets">{assets}</p>
        <p class="ev">{ev}</p>
        <p class="score">score {i['score']} · {i['source_count']} fuentes ·
           búsqueda: {esc(i['target_query']) or '—'}</p>
      </div>
    </div>""")

    body = f"""<form method="POST" action="/admin/ideas/decide">
  <div class="bar">
    <button type="button" onclick="setAll('approve')">Aprobar todas</button>
    <button type="button" onclick="setAll('reject')">Rechazar todas</button>
    <button type="button" onclick="setAll('skip')">Dejar pendientes</button>
    <button type="submit" class="primary">Guardar decisiones</button>
  </div>
  {''.join(cards)}
</form>
<footer>Las que dejes pendientes vuelven a aparecer. Las aprobadas pasan a la cola del redactor.</footer>"""
    return page("Ideas pendientes", f"{len(rows)} propuestas · revisa en lote y guarda una vez",
                body, active="ideas")


@app.post("/admin/ideas/decide")
def ideas_decide():
    approve, reject = [], []
    for key, val in request.form.items():
        if not key.startswith("d_"):
            continue
        try:
            i = int(key[2:])
        except ValueError:
            continue
        (approve if val == "approve" else reject if val == "reject" else []).append(i)
    with db() as conn, conn.cursor() as cur:
        if approve:
            cur.execute("UPDATE content_ideas SET status='APPROVED', decided_at=now() "
                        "WHERE id = ANY(%s) AND status='PROPOSED'", (approve,))
        if reject:
            cur.execute("UPDATE content_ideas SET status='REJECTED', decided_at=now() "
                        "WHERE id = ANY(%s) AND status='PROPOSED'", (reject,))
        conn.commit()
    print(f"[ideas] approved={len(approve)} rejected={len(reject)}")
    return redirect("/admin/ideas/", code=303)


# ---------------------------------------------------------------------------
# Iván's own ideas. Added Aug 13, 2026.
#
# Until now the research agent was the only producer of content_ideas rows, so
# an idea of Iván's reached the pipeline only via a hand-written SQL INSERT —
# which in practice meant it didn't, and his own ideas stayed outside the system
# that drafts and translates everything else.
#
# These insert as APPROVED rather than PROPOSED: Gate A exists to filter the
# agent's guesses and is meaningless for an idea he wrote himself. The row lands
# straight in `ideas_awaiting_draft`, which the writer already reads, so the
# writer needs no change at all. score=100 because that view orders by score
# DESC — his own ideas belong ahead of agent proposals in the queue.
# ---------------------------------------------------------------------------
ARTICLE_TYPES = ("education", "plan_guide", "gated_teaser", "gear", "case_study")
CTA_TYPES = ("all_access", "plan", "coaching", "lead_magnet", "affiliate", "none")
LANGS = ("es", "en", "pt")

# Offered as a datalist on cta_target. Pointing an article at a specific tool is
# the main reason this form exists, and nobody remembers exact paths.
TOOL_PATHS = [
    "/members/calculadora-de-zonas/", "/members/activacion/", "/members/rodillas/",
    "/members/aquiles/", "/members/core/", "/members/respiracion/",
    "/members/carga/", "/members/guias/",
]


def _sel(values, labels, chosen):
    return "".join(
        '<option value="%s"%s>%s</option>' % (
            esc(v), " selected" if v == chosen else "", esc(labels.get(v, v)))
        for v in values)


def _idea_form(msg="", f=None):
    f = f or {}

    def g(k):
        return esc(f.get(k, ""))

    dl = "".join('<option value="%s">' % esc(p) for p in TOOL_PATHS)
    return page("Nueva idea", "Tuya, no del agente — entra aprobada y va directo a la cola del redactor", f"""
{msg}
<form method="POST" action="/admin/ideas/new" class="card">
  <div class="field">
    <label>Título de trabajo</label>
    <div class="hint">No es el titular final; el redactor lo reescribe. Es para reconocerla en la lista.</div>
    <input type="text" name="working_title" value="{g('working_title')}" required autofocus>
  </div>
  <div class="field">
    <label>El ángulo</label>
    <div class="hint">Qué puedes decir tú que las fuentes no. Si esto queda genérico, el artículo también.</div>
    <textarea name="angle" required>{g('angle')}</textarea>
  </div>
  <div class="row3">
    <div class="field">
      <label>Idioma</label>
      <select name="language">{_sel(LANGS, LANG_LABEL, f.get('language', 'es'))}</select>
    </div>
    <div class="field">
      <label>Tipo</label>
      <select name="article_type">{_sel(ARTICLE_TYPES, TYPE_LABEL, f.get('article_type', 'education'))}</select>
    </div>
    <div class="field">
      <label>CTA</label>
      <select name="cta_type">{_sel(CTA_TYPES, CTA_LABEL, f.get('cta_type', 'all_access'))}</select>
    </div>
  </div>
  <div class="field">
    <label>Destino del CTA</label>
    <div class="hint">Un plan_id, o una ruta de /members/ si quieres que el artículo empuje una herramienta.</div>
    <input type="text" name="cta_target" list="toolpaths" value="{g('cta_target')}">
    <datalist id="toolpaths">{dl}</datalist>
  </div>
  <div class="field">
    <label>Búsqueda objetivo (opcional)</label>
    <input type="text" name="target_query" value="{g('target_query')}">
  </div>
  <div class="field">
    <label>Qué nuestro lo respalda (opcional, separado por comas)</label>
    <input type="text" name="our_assets" value="{g('our_assets')}"
           placeholder="methodology.md §4, /members/rodillas/, plan 612561">
  </div>
  <div class="field">
    <label>Por qué ahora (opcional)</label>
    <textarea name="rationale" style="min-height:60px">{g('rationale')}</textarea>
  </div>
  <button type="submit" class="primary">Guardar y mandar al redactor</button>
</form>
<footer>Entra como APROBADA. El redactor la toma en su próxima corrida; no pasa por Ideas pendientes.</footer>""",
                active="new")


@app.get("/admin/ideas/new")
def idea_new_form():
    return _idea_form()


@app.post("/admin/ideas/new")
def idea_new_save():
    f = request.form
    title = (f.get("working_title") or "").strip()
    angle = (f.get("angle") or "").strip()
    lang = (f.get("language") or "").strip()
    atype = (f.get("article_type") or "").strip()
    ctype = (f.get("cta_type") or "").strip()

    # Validate the enum-backed fields here rather than letting Postgres reject
    # the cast: a friendly message beats a 500, and the form keeps what was
    # typed. A form that discards your work on a validation error gets used once.
    problems = []
    if not title:
        problems.append("Falta el título de trabajo.")
    if not angle:
        problems.append("Falta el ángulo — es el campo que decide si el artículo vale algo.")
    if lang not in LANGS:
        problems.append("Idioma inválido.")
    if atype not in ARTICLE_TYPES:
        problems.append("Tipo de artículo inválido.")
    if ctype not in CTA_TYPES:
        problems.append("Tipo de CTA inválido.")
    if problems:
        return _idea_form('<p class="err">' + esc(" ".join(problems)) + "</p>", f), 400

    assets = [a.strip() for a in (f.get("our_assets") or "").split(",") if a.strip()]

    with db() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO content_ideas
                 (language, working_title, angle, target_query, rationale,
                  article_type, cta_type, cta_target, our_assets, evidence,
                  source_count, score, status, decided_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, '[]'::jsonb,
                       0, 100, 'APPROVED', now())
               RETURNING id""",
            (lang, title, angle,
             (f.get("target_query") or "").strip() or None,
             (f.get("rationale") or "").strip() or "Idea propia de Iván.",
             atype, ctype,
             (f.get("cta_target") or "").strip() or None,
             json.dumps(assets)))
        new_id = cur.fetchone()["id"]
        conn.commit()
    print(f"[ideas] own idea created id={new_id} lang={lang} title={title!r}")
    return _idea_form(
        f'<p class="ok">Guardada (#{new_id}) y aprobada. '
        f'El redactor la toma en su próxima corrida.</p>')


# ---------------------------------------------------------------------------
@app.get("/admin/drafts")
@app.get("/admin/drafts/")
def drafts():
    with db() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM pending_drafts")
        rows = cur.fetchall()
        cur.execute("SELECT count(*) AS n FROM ideas_awaiting_draft")
        waiting = cur.fetchone()["n"]
        # Approved but never published. See the view's comment in schema.sql:
        # approving removes a piece from this page, so a failed publish call
        # leaves it invisible AND unreachable. This is the only place it shows.
        cur.execute("SELECT * FROM approved_unpublished")
        stuck = cur.fetchall()

    stuck_html = ""
    if stuck:
        items = "".join(
            f"""
      <label class="stuck-row">
        <input type="checkbox" name="retry" value="{s['id']}" checked>
        <span><strong>{esc(s['headline'])}</strong><br>
          <span class="meta">{LANG_LABEL.get(s['language'], s['language'])} ·
          aprobado {s['decided_at'].strftime('%d/%m %H:%M') if s['decided_at'] else '—'} ·
          <code>{esc(s['file_path'])}</code></span></span>
      </label>""" for s in stuck)
        stuck_html = f"""
<form method="POST" action="/admin/drafts/republish">
  <div class="card" style="border-left:4px solid #b45309;">
    <h2 style="margin-top:0;">{len(stuck)} pieza(s) aprobadas que nunca se publicaron</h2>
    <p class="why">Se aprobaron, pero el aviso a n8n no llegó o falló, así que el
      artículo no existe todavía. Reintentar es seguro: n8n vuelve a commitear el
      mismo archivo y no duplica nada.</p>
    {items}
    <div class="bar" style="margin-top:14px;">
      <button type="submit" class="primary">Reintentar publicación</button>
    </div>
  </div>
</form>"""

    if not rows:
        msg = stuck_html + (
            f'<p class="empty">No hay borradores esperando revisión.'
            f'{f" {waiting} idea(s) aprobadas esperan al redactor." if waiting else ""}</p>')
        # NOTE: stuck_html goes FIRST and this return is no longer an early exit
        # from the stuck check. Before Aug 12, 2026 this branch returned before
        # anything looked at approved-but-unpublished pieces, so the one state
        # you most needed to see was the one guaranteed to be hidden.
        return page("Borradores",
                    f"0 esperando revisión{f' · {len(stuck)} sin publicar' if stuck else ''}",
                    msg, active="drafts")

    cards = []
    for p in rows:
        wc = len(re.sub(r"<[^>]+>", " ", p["body"] or "").split())
        cards.append(f"""
    <div class="card">
      <div class="decide" style="flex-direction:row; gap:18px; margin-bottom:12px;">
        <label><input type="radio" name="d_{p['id']}" value="approve"> Publicar</label>
        <label><input type="radio" name="d_{p['id']}" value="reject"> Descartar</label>
        <label><input type="radio" name="d_{p['id']}" value="skip" checked> Dejar pendiente</label>
        <button type="button" class="linkbtn" onclick="toggleEdit({p['id']})">ver / editar HTML</button>
      </div>
      <p class="meta">{LANG_LABEL.get(p['language'], p['language'])} ·
        {TYPE_LABEL.get(p['article_type'], p['article_type'] or '—')} ·
        {CTA_LABEL.get(p['cta_type'], p['cta_type'] or '—')} ·
        {wc} palabras · <code>{esc(p['file_path'])}</code></p>
      <h2>{esc(p['headline'])}</h2>
      <p class="stand">{esc(p['standfirst'])}</p>
      <p class="why">meta: {esc(p['description'])}</p>
      <div class="preview" id="prev_{p['id']}">{p['body']}</div>
      <textarea class="hidden" id="edit_{p['id']}" name="body_{p['id']}">{esc(p['body'])}</textarea>
    </div>""")

    body = stuck_html + f"""<form method="POST" action="/admin/drafts/decide">
  <div class="bar">
    <button type="button" onclick="setAll('approve')">Publicar todos</button>
    <button type="button" onclick="setAll('skip')">Dejar pendientes</button>
    <button type="submit" class="primary">Guardar decisiones</button>
  </div>
  {''.join(cards)}
</form>
<footer>Editar el HTML y guardar conserva tu versión; el original del modelo se guarda aparte
para comparar qué corrige siempre.</footer>"""
    return page("Borradores",
                f"{len(rows)} esperando revisión · {waiting} idea(s) en cola del redactor"
                + (f" · {len(stuck)} sin publicar" if stuck else ""),
                body, active="drafts")


@app.post("/admin/drafts/decide")
def drafts_decide():
    approve, reject, edits = [], [], {}
    for key, val in request.form.items():
        if key.startswith("d_"):
            try:
                i = int(key[2:])
            except ValueError:
                continue
            (approve if val == "approve" else reject if val == "reject" else []).append(i)
        elif key.startswith("body_"):
            try:
                edits[int(key[5:])] = val
            except ValueError:
                pass

    with db() as conn, conn.cursor() as cur:
        # Save edits regardless of the decision — losing someone's edits because
        # they left the row pending would be its own small betrayal.
        for pid, body in edits.items():
            cur.execute("UPDATE content_pieces SET body=%s WHERE id=%s AND body <> %s",
                        (body, pid, body))
        if approve:
            cur.execute("UPDATE content_pieces SET status='APPROVED', decided_at=now() "
                        "WHERE id = ANY(%s) AND status='DRAFTED'", (approve,))
        if reject:
            cur.execute("UPDATE content_pieces SET status='REJECTED', decided_at=now() "
                        "WHERE id = ANY(%s) AND status='DRAFTED'", (reject,))
        conn.commit()

    ok, note = publish_webhook(approve)
    print(f"[drafts] approved={len(approve)} rejected={len(reject)} "
          f"edited={len(edits)} publish={note}")
    return redirect("/admin/drafts/", code=303)


def publish_webhook(piece_ids):
    """Hand approved pieces to n8n, which commits the .njk file to GitHub. The
    VPS itself has no push access, deliberately — see the diverged-branch
    failure in website-build-cutover-runbook.md.

    Extracted August 12, 2026 so the approve path and the retry path cannot
    drift into two slightly different requests. A retry that differs from the
    original call is not a retry.

    Failure is swallowed on purpose — an approval must not be lost because n8n
    was briefly down — but that is only defensible now that a failed publish is
    VISIBLE. It shows up in `approved_unpublished` and on /admin/drafts/ with a
    retry button. Before that view existed, this except block was the whole
    reason a piece could vanish: the failure was printed to a container log and
    nothing in the UI ever mentioned it again.
    """
    if not piece_ids:
        return True, "nothing to publish"
    hook = os.environ.get("PUBLISH_WEBHOOK")
    if not hook:
        print("[publish] PUBLISH_WEBHOOK not set — approved but not published")
        return False, "PUBLISH_WEBHOOK not set"
    import urllib.request
    try:
        req = urllib.request.Request(
            hook, data=json.dumps({"piece_ids": piece_ids}).encode(),
            headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=20) as r:
            print(f"[publish] webhook returned {r.status} for {piece_ids}")
            return True, f"HTTP {r.status}"
    except Exception as e:
        print(f"[publish] webhook FAILED for {piece_ids}: {e}")
        return False, f"failed: {e}"


@app.post("/admin/drafts/republish")
def drafts_republish():
    """Re-fire the publish webhook for pieces stuck in APPROVED.

    Safe to press repeatedly: n8n commits the same file path from the same row,
    so a duplicate call overwrites identical content rather than creating a
    second article. That property is what makes a retry button the right fix
    here instead of a manual database edit.
    """
    ids = []
    for v in request.form.getlist("retry"):
        try:
            ids.append(int(v))
        except ValueError:
            continue
    # Re-check status server-side. The page may have been open for a while, and
    # retrying something that has since published would be a confusing no-op.
    if ids:
        with db() as conn, conn.cursor() as cur:
            cur.execute("SELECT id FROM approved_unpublished WHERE id = ANY(%s)", (ids,))
            ids = [r["id"] for r in cur.fetchall()]
    ok, note = publish_webhook(ids)
    print(f"[drafts] republish requested={len(ids)} result={note}")
    return redirect("/admin/drafts/", code=303)


# ---------------------------------------------------------------------------
@app.get("/admin/all")
@app.get("/admin/all/")
def all_items():
    """Everything, whatever its status.

    The first version of this admin only ever showed PROPOSED ideas, so anything
    Iván approved vanished with no way to see it again. This page exists so
    nothing in the pipeline is ever invisible.
    """
    with db() as conn, conn.cursor() as cur:
        cur.execute("""SELECT i.*, p.id AS piece_id, p.status AS piece_status,
                              p.published_url
                       FROM content_ideas i
                       LEFT JOIN content_pieces p ON p.idea_id = i.id
                       ORDER BY i.status, i.created_at DESC""")
        rows = cur.fetchall()

    if not rows:
        return page("Todo", "nada todavía", '<p class="empty">Sin ideas.</p>', active="all")

    trs = []
    for r in rows:
        piece = "—"
        if r["piece_id"]:
            piece = f'<a href="/admin/drafts/">borrador #{r["piece_id"]}</a> ({esc(r["piece_status"])})'
        if r["published_url"]:
            piece = f'<a href="{esc(r["published_url"])}" target="_blank">publicado</a>'
        trs.append(f"""<tr>
          <td>{r['id']}</td>
          <td><span class="pill">{esc(r['status'])}</span></td>
          <td>{LANG_LABEL.get(r['language'], r['language'])}</td>
          <td>{TYPE_LABEL.get(r['article_type'], r['article_type'])}</td>
          <td>{esc(r['working_title'])}</td>
          <td>{piece}</td>
        </tr>""")

    body = f"""<table class="all">
  <thead><tr><th>#</th><th>Estado</th><th>Idioma</th><th>Tipo</th><th>Título</th><th>Borrador</th></tr></thead>
  <tbody>{''.join(trs)}</tbody>
</table>"""
    return page("Todo", f"{len(rows)} ideas en total", body, active="all")


# ---------------------------------------------------------------------------
def redacted():
    if DSN:
        return re.sub(r"://([^:]+):[^@]*@", r"://\1:***@", DSN)
    return f"{DB['user']}:***@{DB['host']}:{DB['port']}/{DB['dbname']}"


@app.get("/admin/health")
def health():
    if not DSN and not DB["password"]:
        return {"ok": False, "error": "PG_PASSWORD not set in the container",
                "target": redacted()}, 500
    try:
        with db() as conn, conn.cursor() as cur:
            cur.execute("SELECT to_regclass('public.content_pieces') AS t")
            if not cur.fetchone()["t"]:
                return {"ok": False, "target": redacted(),
                        "error": "connected, but content_pieces is missing — re-run schema.sql"}, 500
            cur.execute("SELECT status, count(*) AS n FROM content_ideas GROUP BY status")
            ideas = {r["status"]: r["n"] for r in cur.fetchall()}
            cur.execute("SELECT status, count(*) AS n FROM content_pieces GROUP BY status")
            pieces = {r["status"]: r["n"] for r in cur.fetchall()}
        return {"ok": True, "ideas": ideas, "pieces": pieces, "target": redacted()}
    except psycopg2.OperationalError as e:
        return {"ok": False, "error": f"cannot connect: {e}".strip(), "target": redacted()}, 500
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}: {e}", "target": redacted()}, 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8092)
