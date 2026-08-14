# Patch — let Iván submit his own content ideas

**Written August 13, 2026. Applies to `automation/content-engine/admin_service/app.py`.**

## What this fixes

The engine is live — research agent, writer agent and translation on cron since Aug 4, Gate A at `/admin/ideas/`, Gate B at `/admin/drafts/`. But **the research agent is the only thing that can create a `content_ideas` row.** The admin service has `POST /admin/ideas/decide` and no create route, so an idea of Iván's own reaches the pipeline only through a hand-written SQL `INSERT` — *which in practice means his own ideas stay outside the system that drafts and translates everything else.*

## Two design decisions worth knowing before you read the code

**1. These go in as `APPROVED`, not `PROPOSED`.** Gate A exists to filter the agent's guesses. It is meaningless for an idea Iván wrote himself — approving your own idea is a click that carries no information. Inserting as `APPROVED` lands the row directly in the `ideas_awaiting_draft` view, which the writer agent already reads on its next run. **No change to the writer is needed.**

**2. `score` is set to 100.** `ideas_awaiting_draft` orders by `score DESC NULLS LAST`, so Iván's own ideas sort ahead of agent proposals in the writer's queue. That is the correct priority — he wrote it because he wanted it, not because a model scored it.

*Also: `cta_target` already accepts a `/members/` path, so this is the mechanism for aiming an article at a specific tool. The form ships with a datalist of the current tool paths for exactly that reason.*

---

## Step 1 — three edits to `admin_service/app.py`

### Edit A — add the nav link

In `def page(...)`, find:

```python
    <a href="/admin/ideas/"{cls('ideas')}>Ideas pendientes</a>
```

and add one line under it:

```python
    <a href="/admin/ideas/new"{cls('new')}>Nueva idea</a>
```

### Edit B — append to the `CSS` constant

`CSS` is a plain triple-quoted string, not an f-string, so braces need no escaping. Add at the end, before the closing `"""`:

```css
/* Own-idea form (Aug 13, 2026). Reuses .card; only the controls are new. */
.field { margin-bottom:18px; }
.field label { display:block; font-size:12px; font-weight:700; text-transform:uppercase;
               letter-spacing:.06em; color:var(--blue); margin-bottom:6px; }
.field .hint { font-size:13px; color:var(--slate); margin-bottom:6px; font-weight:400;
               text-transform:none; letter-spacing:0; }
.field input[type=text], .field select, .field textarea {
  width:100%; font-family:inherit; font-size:15px; color:var(--ink);
  border:1px solid var(--mist); border-radius:4px; padding:10px 12px; background:var(--white); }
.field textarea { min-height:90px; font-family:inherit; font-size:15px; line-height:1.55; }
.field select { height:42px; }
.row3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }
.err { background:#fdf1f1; border-left:3px solid #b23; padding:12px 16px;
       border-radius:4px; margin-bottom:20px; font-size:15px; }
.ok { background:var(--wash); border-left:3px solid var(--blue); padding:12px 16px;
      border-radius:4px; margin-bottom:20px; font-size:15px; }
@media (max-width:700px) { .row3 { grid-template-columns:1fr; } }
```

### Edit C — add the routes

Paste this whole block immediately **after** the `ideas_decide()` function (i.e. just before the `# ---` line that precedes `/admin/drafts`):

```python
# ---------------------------------------------------------------------------
# Iván's own ideas. Added Aug 13, 2026.
#
# Until now the research agent was the only producer of content_ideas rows, so
# an idea of Iván's reached the pipeline only via a hand-written SQL INSERT —
# which in practice meant it didn't.
#
# These insert as APPROVED rather than PROPOSED: Gate A filters the agent's
# guesses and is meaningless for an idea he wrote himself. The row lands
# straight in `ideas_awaiting_draft`, which the writer already reads. score=100
# so his own ideas sort ahead of agent proposals in that queue.
# ---------------------------------------------------------------------------
ARTICLE_TYPES = ("education", "plan_guide", "gated_teaser", "gear", "case_study")
CTA_TYPES = ("all_access", "plan", "coaching", "lead_magnet", "affiliate", "none")
LANGS = ("es", "en", "pt")

# Offered as a datalist on cta_target. Aiming an article at a specific tool is
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
    g = lambda k, d="": esc(f.get(k, d))
    dl = "".join('<option value="%s">' % esc(p) for p in TOOL_PATHS)
    return page("Nueva idea", "Tuya, no del agente — entra aprobada y va directo a la cola del redactor", f"""
{msg}
<form method="POST" action="/admin/ideas/new" class="card">
  <div class="field">
    <label>Título de trabajo</label>
    <div class="hint">No es el titular final; el redactor lo reescribe. Es para que lo reconozcas en la lista.</div>
    <input type="text" name="working_title" value="{g('working_title')}" required autofocus>
  </div>
  <div class="field">
    <label>El ángulo</label>
    <div class="hint">Qué podés decir vos que las fuentes no. Si esto queda vacío o genérico, el artículo también.</div>
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
    <div class="hint">Un plan_id, o una ruta de /members/ si querés que el artículo empuje una herramienta.</div>
    <input type="text" name="cta_target" list="toolpaths" value="{g('cta_target')}">
    <datalist id="toolpaths">{dl}</datalist>
  </div>
  <div class="field">
    <label>Búsqueda objetivo <span class="hint" style="display:inline">(opcional)</span></label>
    <input type="text" name="target_query" value="{g('target_query')}">
  </div>
  <div class="field">
    <label>Qué nuestro lo respalda <span class="hint" style="display:inline">(opcional, separado por comas)</span></label>
    <input type="text" name="our_assets" value="{g('our_assets')}"
           placeholder="methodology.md §4, /members/rodillas/, plan 612561">
  </div>
  <div class="field">
    <label>Por qué ahora <span class="hint" style="display:inline">(opcional)</span></label>
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

    # Validate the enum-backed fields in Python rather than letting Postgres
    # reject the cast: a friendly message beats a 500, and the form keeps what
    # was typed instead of throwing it away.
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
        f'<p class="ok">Guardada (#{new_id}) y aprobada. El redactor la toma en su próxima corrida.</p>')
```

---

## Step 2 — deploy

`admin_service` runs on the VPS in Docker, and every file gets there through GitHub. On the Mac:

```bash
cd ~/triaperformance-docs
git add -A
git commit -m "Admin: create route for Iván's own content ideas"
git push
```

On the VPS:

```bash
cd ~/.hermes/triaperformance-docs
git fetch origin && git reset --hard origin/main
```

Then rebuild and restart the container. **Use the exact service name from your `docker compose ps`** — I can't see it from here, so check first:

```bash
docker compose ps
docker compose up -d --build <admin-service-name>
docker compose logs --tail 30 <admin-service-name>
```

---

## Step 3 — check it worked

1. Open `/admin/ideas/new`. The nav should show four links, with **Nueva idea** highlighted.
2. Submit with the title empty → red box, and **everything you typed is still in the form**. That is the check that matters; a form that discards your work on a validation error gets used once.
3. Submit a real one. Green confirmation with an id.
4. It must **not** appear under *Ideas pendientes* — it went in approved, so Gate A is bypassed by design.
5. Confirm the writer can see it:

```bash
docker exec -i analytics-postgres psql -U analytics -d content \
  -c "SELECT id, language, working_title, score, status FROM ideas_awaiting_draft ORDER BY score DESC LIMIT 5;"
```

Your idea should be at the top, `score = 100`, `status = APPROVED`.

6. Optionally force a draft rather than waiting for cron:

```bash
cd ~/.hermes/triaperformance-docs/automation/content-engine
python3 writer_agent.py --queue        # should list it
python3 writer_agent.py --limit 1      # drafts it
```

Then it appears under **Borradores** for Gate B.

---

## Tell me when it's deployed

I'll mirror the change into the repo copy of `app.py` and update `SETUP.md`'s route list. **Until you confirm, the repo copy stays as it is** — the VPS is the source of truth for what is running, and a repo that claims a route exists before it does is the same class of error as the `SETUP.md` line that said "nothing deployed" for two and a half weeks.
