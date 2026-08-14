# Content engine — research agent + review page

**Status:** LIVE. *Corrected Aug 13, 2026 — this line read "written, nothing deployed. July 27, 2026" for two and a half weeks after the fact. Both agents plus translation have been on cron since Aug 4, and the admin approval page (`/admin/ideas`, `/admin/drafts`) is running. Confirmed by Iván. **The stale line matters because it is the first line of the file:** anyone deciding whether to build on this engine read "nothing deployed" and stopped.*
**Scope:** research agent, writer agent (including translation) and the approval surface — Gate A at `/admin/ideas`, Gate B at `/admin/drafts`. *Also corrected Aug 13, 2026: this read "No writer, no publisher"; `writer_agent.py` has been on cron since Aug 4.* *Update, Aug 13, 2026 — **Iván can now submit his own ideas**: `GET/POST /admin/ideas/new`, in `admin_service/app.py`. They insert as `APPROVED` rather than `PROPOSED` (Gate A filters the agent's guesses and is meaningless for an idea he wrote himself) with `score = 100`, so they land straight in `ideas_awaiting_draft` ahead of agent proposals. **The writer agent needed no change.** `cta_target` carries a datalist of the eight members-tool paths, which is how an article gets aimed at a specific tool.*

**Deploy — this is a repo file like every other VPS script, so Claude edits it and Iván ships it:**

```bash
# Mac
cd ~/triaperformance-docs && git add -A && git commit -m "..." && git push
# VPS
cd ~/.hermes/triaperformance-docs && git fetch origin && git reset --hard origin/main
docker compose ps                                   # confirm the service name first
docker compose up -d --build <admin-service-name>
docker compose logs --tail 30 <admin-service-name>
```

Then open `/admin/ideas/new`, save one, and confirm the writer can see it:

```bash
docker exec -i analytics-postgres psql -U analytics -d content \
  -c "SELECT id, language, working_title, score, status FROM ideas_awaiting_draft ORDER BY score DESC LIMIT 5;"
```

*Previously: **any way for Iván to submit his own idea was absent.*** The only producer of `content_ideas` rows is the research agent; the admin service has a decide route and no create route, so an idea of his own reaches the pipeline only via a hand-written SQL INSERT — which in practice means it does not. Logged in `open-loops.md`.

The research agent proposes ideas. You approve them in batches on a private page. That's it — nothing writes or publishes yet, deliberately. The point of stopping here is to find out whether the ideas are any good before automating anything downstream, because bad ideas written well are still bad articles.

---

## What it actually does

Weekly, on the VPS:

1. Fetches recent posts from the source blogs in `sources.json`.
2. Loads **what you uniquely have**: the plan catalog with per-language counts, the members-area artifacts, the methodology sections, the lead magnets.
3. Asks the model for N ideas, each of which must name concrete Triaperformance assets — an idea that names none is discarded before it reaches the database.
4. Writes them to Postgres as `PROPOSED`.
5. If the pending queue is at or over the threshold (default 8), calls an n8n webhook that emails you. Below threshold, it stays quiet — you asked for batches, not drips.

**The sources are for timing and gaps, not topics to copy.** Writing about durability because TrainingPeaks did means competing with TrainingPeaks on their ground. The prompt makes an idea legitimate only when several sources are circling a theme *and* you can say something they can't, or when they're collectively missing something you're placed to answer.

---

## Step 0 — Get the files onto the VPS first

**Every file referenced below is written on Iván's Mac and reaches the VPS only through GitHub.** Claude edits the local repo; it never touches the VPS. So before any step that reads a file from `~/.hermes/triaperformance-docs/...`, that file has to have been committed, pushed, and pulled — otherwise you get `No such file or directory` on a script you can see perfectly well on your laptop.

On the Mac:

```bash
cd ~/triaperformance-docs
git add -A
git commit -m "..."
git push
```

On the VPS:

```bash
cd ~/.hermes/triaperformance-docs
git fetch origin && git reset --hard origin/main
```

(`reset --hard` rather than `pull` — that checkout is a strict mirror and must never diverge. See `website-build-cutover-runbook.md`.)

This caught us twice: once with `automation/check-plan-links.py`, once with this schema file. Check it first.

## Step 1 — Create the database

```bash
docker exec -it analytics-postgres psql -U analytics -c "CREATE DATABASE content;"
```

```bash
docker exec -i analytics-postgres psql -U analytics -d content < ~/.hermes/triaperformance-docs/automation/content-engine/schema.sql
```

Verify:

```bash
docker exec -it analytics-postgres psql -U analytics -d content -c "\dt"
```

You should see `sources`, `source_posts`, `content_ideas`.

## Step 2 — Add your source blogs

Edit `automation/content-engine/sources.json` on your Mac and put in the 4–5 blogs you had in mind. The three in there now are unverified guesses. Push, then on the VPS:

```bash
cd ~/.hermes/triaperformance-docs/automation/content-engine
python3 research_agent.py --check-sources
```

This fetches nothing into the database. It reports, per source, whether a real RSS/Atom feed was found, whether it fell back to scraping the index page, or whether the site blocked us. **Copy any discovered feed URLs back into `sources.json` as `feed_url` and set `fetch_mode` explicitly**, so real runs skip discovery and are faster and gentler.

Expect some sources to fail. TrainingPeaks' `/blog/feed/` redirects to an article rather than serving XML, so it will probably land in `html` mode.

## Step 3 — See what it would propose, without saving

```bash
pip3 install psycopg2-binary --break-system-packages
```

```bash
export PG_HOST=127.0.0.1 PG_PORT=5432 PG_USER=analytics PG_DB_CONTENT=content
export PG_PASSWORD=$(grep '^PG_PASSWORD=' ~/.analytics/.env | cut -d= -f2- | tr -d "\"'")
export GOOGLE_API_KEY="the key already in ~/.hermes/.env"
python3 research_agent.py --dry-run
```

*Corrected August 12, 2026 — this block used to read `export CONTENT_DB_DSN="postgres://analytics:PASSWORD@127.0.0.1:5432/content"`. **Do not set `CONTENT_DB_DSN`.** The analytics Postgres password contains `:` and `@`, both of which are URI delimiters, so pasting it into a `postgres://` string silently truncates the password and the connection fails with an authentication error that points at the wrong thing. `research_agent.py` assembles the connection from discrete `PG_*` values at `connect()` (it reads `~/.analytics/.env` itself if the variables aren't exported), and `admin_service/app.py` prefers `CONTENT_DB_DSN` **only when it is set** — so leaving it unset is what makes the discrete path win. URL-encoding the password would also work and is the wrong fix: it puts a hand-encoded secret in a shell history.*

Read the ideas. This is the moment that decides whether the whole approach is worth continuing — if the ideas are generic, the fix is the prompt and the asset inputs, not more automation downstream.

If they look reasonable, drop `--dry-run` to save them.

## Step 4 — Deploy the review page

This is the UI. Once it's up, the ideas live at **https://triaperformance.com/admin/ideas/** in a browser — a table with Sí / No / — radio buttons per idea, "approve all" and "reject all" buttons, and one Save at the end.

Pull the password out of the env file rather than typing it:

```bash
export PGPW=$(grep '^PG_PASSWORD=' ~/.analytics/.env | cut -d= -f2- | tr -d "\"'")
```

```bash
docker build -t tp-admin ~/.hermes/triaperformance-docs/automation/content-engine/admin_service
```

```bash
docker run -d --name tp-admin --restart unless-stopped --network host \
  -e PG_HOST=127.0.0.1 -e PG_PORT=5432 -e PG_USER=analytics -e PG_DB_CONTENT=content \
  -e PG_PASSWORD="$PGPW" \
  -e PUBLISH_WEBHOOK=http://100.70.89.17:5678/webhook/publish-article \
  tp-admin
```

*`PUBLISH_WEBHOOK` added August 12, 2026 — **it was missing from this command while being set on the live container**, which is the worst combination: the runbook worked well enough to produce a healthy container, and the thing it silently dropped was the entire publishing step. Approving a piece would have flipped it to `APPROVED`, POSTed nowhere, and removed it from `/admin/drafts/`, with no error anywhere. Found while rebuilding for the `approved_unpublished` view — by inspecting the live container's env before destroying it, which is now the standing habit below.*

> **Before `docker rm -f` on any container, list its environment.** Docker fixes env at `docker run`, so anything set on the live container and absent from this file disappears on recreate, permanently and silently. The `grep -v PASSWORD` keeps the credential off your screen:
>
> ```bash
> docker inspect tp-admin --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -v PASSWORD
> ```
>
> Anything in that output which is not in the `docker run` command above is drift, and the fix is to add it here — not to remember it next time.

*Corrected August 12, 2026 — this line used to pass `-e CONTENT_DB_DSN="postgres://analytics:$PGPW@127.0.0.1:5432/content"`. Same tripwire as Step 3: `$PGPW` contains `:` and `@`, so the URI form silently truncates the password. `app.py` uses `CONTENT_DB_DSN` when set and otherwise builds the connection from `PG_HOST`/`PG_PORT`/`PG_USER`/`PG_PASSWORD`/`PG_DB_CONTENT` — so the fix is to pass the discrete variables and never set the DSN. `PG_PASSWORD` is quoted for the same reason.*

If the container is already running from the old DSN form, recreate it rather than editing it — Docker environment variables are fixed at `docker run`:

```bash
docker rm -f tp-admin
```

…then re-run the `docker run` command above.

Check it can see the database:

```bash
curl -s http://127.0.0.1:8092/admin/health
```

Expect `{"ok": true, "pending": N}` where N is the number of ideas waiting.

**`--network host` is required, not stylistic.** `analytics-postgres` is bound to `127.0.0.1` on the host, so a container on the default bridge network cannot reach it — not on `172.17.0.1`, not by container name. Sharing the host's network namespace is the way in without loosening the database's binding. Because of that, gunicorn binds `127.0.0.1` inside the container: with `--network host`, binding `0.0.0.0` would publish this admin page on the VPS's public IP.

## Step 5 — Gate it in Caddy

Generate a password hash (it will prompt twice, nothing echoes):

```bash
caddy hash-password
```

Save that password in Bitwarden now, while you have it.

Add this inside the `triaperformance.com` site block in `automation/Caddyfile`, **above** the general handlers — `handle` blocks are evaluated in order and the first match wins:

```
handle /admin/* {
	basic_auth {
		ivan PASTE_THE_HASH_HERE
	}
	reverse_proxy 127.0.0.1:8092
}
```

Edit that file on your Mac, commit and push — the daily deploy validates and installs the Caddyfile automatically. To apply it immediately instead:

```bash
sudo cp ~/.hermes/triaperformance-docs/automation/Caddyfile /etc/caddy/Caddyfile && sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy
```

Then open **https://triaperformance.com/admin/ideas/** and log in with `ivan` plus that password.

**Why basic_auth and not the members token system:** there's exactly one user. The members area needed per-subscriber tokens because revoking one subscriber must not affect the others. Here that would be invented complexity.

## Step 5b — If you'd rather look at the ideas right now

The page is the intended way, but the data is queryable directly:

```bash
docker exec -it analytics-postgres psql -U analytics -d content -c "SELECT id, language, article_type, cta_type, score, working_title FROM pending_ideas;"
```

## Step 6 — The notification email

Create an n8n workflow with a Webhook trigger and a Send Email node, using the same Gmail SMTP credential the nurture sequence uses. Body: "N ideas waiting" plus a link to `https://triaperformance.com/admin/ideas/`. Then:

```bash
export IDEA_NOTIFY_WEBHOOK="https://triaperformance.com/api/idea-notify"
```

The credential stays in n8n rather than being copied into a script — one place, one rotation.

## Step 7 — Cron

Once a manual run has worked end to end:

```
0 7 * * 1 cd ~/.hermes/triaperformance-docs/automation/content-engine && /usr/bin/python3 research_agent.py >> ~/.hermes/logs/content-engine.log 2>&1
```

Monday 7am, staggered clear of the 5am pixel sync and 6am site deploy.

**Important:** the deploy script does `git reset --hard` on that checkout every morning. The agent only *reads* from it, so that's fine — but never write anything you want to keep inside that directory. Ideas live in Postgres precisely for this reason.

---

## Article types, and why the type is chosen before writing

| Type | What it is | Typical CTA |
|---|---|---|
| `plan_guide` | Decision guide routing to specific plans | `plan` |
| `education` | Topical authority. May sell nothing. | `none` or `lead_magnet` |
| `gated_teaser` | Concept explained fully; the *artifact* is behind `/members/` | `all_access` |
| `gear` | Affiliate-oriented | `affiliate` |

A gated teaser is written differently from a plan guide from its first sentence. Deciding the offer after drafting produces a CTA bolted onto an article that wasn't shaped for it — so `article_type` and `cta_type` are part of the idea you approve, not a later step.

**`cta_type = none` is a legitimate outcome.** An article that ranks and builds trust without selling anything is a success.

### The rule for gated teasers

**The article must be complete and useful standing alone. The paywall holds the execution artifact, never the understanding.**

An activation article explains what activation is, why it matters, and what a good one looks like. Behind the login sits the specific sequence — reps, order, video. A teaser that withholds the knowledge is thin content, and Google is explicitly built to bury it.

You have six artifacts already gated (`carga`, `carrera`, `kettlebell`, `nutricion`, `tests`, `zonas`), and All-Access has 2 subscribers. This is the only content pattern that converts free search traffic into your one recurring revenue line.

---

## What is deliberately not built

- **The writer.** Nothing drafts articles yet. Approve ideas, write them yourself (with help), and see whether the ideas were good.
- **The publisher.** Blog publishing is already a git commit; it doesn't need an agent.
- **The feedback loop.** Needs 60–90 days of Search Console data before it has anything to say. Building it now would be measuring noise.
