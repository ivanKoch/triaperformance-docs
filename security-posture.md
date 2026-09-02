# Security Posture — home doc

**Created: August 30, 2026.** Owner of every security finding, its status, and the standing
decisions behind it. Before adding a security note to another doc, add it here and write a
pointer instead — same rule as every other initiative in this repo.

**Scope of the assessment behind this file:** a read of the repo as it stood Aug 30, 2026 —
`automation/` (all Python, all shell, all n8n workflow JSON, the Caddyfile), `site/_data/`,
the tracked contents of `data/` and `automation/members-area/`, git history for secrets, and
the security-relevant sections of `ai-infrastructure-documentation.md`. **What it could not
check, and what therefore stays unverified below: the live VPS.** Nothing here was confirmed
against the running box — no `ufw status`, no `docker ps`, no live Postgres query, no GitHub
or Hostinger account settings. Findings marked **[repo-confirmed]** are proven by a file in
this repo. Findings marked **[needs live check]** are inferred from documentation and must be
confirmed against the real system before being treated as either true or fixed.

---

## The framing, before the list

The threat model that actually applies to a business this size is **untargeted and
automated**: credential stuffing against accounts, mass scanning for exposed services,
compromised dependencies, and abuse of open endpoints. Nobody is researching Triaperformance
specifically. Better models lower the cost of *writing* an exploit; they do not change which
holes exist, and every finding below is a boring, pre-existing category.

Two things follow, and they are the reason this doc is ordered the way it is:

1. **The dominant risk is account takeover, not network intrusion.** The Tailscale-and-
   firewall posture (see "What is already right") closes the inbound paths well. What remains
   open are the paths that arrive *through* a trusted channel — a git pull, an npm install, a
   control-panel login — where the network boundary is not consulted at all.
2. **Man-in-the-middle is not a live concern here** and should not absorb attention. Caddy
   terminates TLS with automatic Let's Encrypt certificates; the only unencrypted hop
   (Caddy → n8n over `http://100.70.89.17:5678`) is same-box traffic on a WireGuard interface.
   Intercepting any of it requires a compromised CA, a compromised device, or control of DNS.
   **The DNS/registrar case is the one to care about — and it is an account-takeover problem
   (F3), not a network one.**

---

## Findings

### Tier 1 — the ones that matter

**F1. Push access to `origin/main` is unattended root on the VPS.** *[repo-confirmed]*

`automation/deploy-website.sh` runs daily at 06:00 and does, in order: `git fetch` +
`git reset --hard origin/main` + `git clean -fd`; `npm ci` whenever `package-lock.json`
changed; `npx @11ty/eleventy`; and — on any diff — `sudo cp` the repo's `automation/Caddyfile`
over `/etc/caddy/Caddyfile` followed by `sudo systemctl reload caddy`, using passwordless
sudo confirmed in `ai-infrastructure-documentation.md` §18. Five content-engine crontab lines
independently run `git pull -q && automation/content-engine/run-agent.sh <agent>`.

So a single commit to `main` executes attacker-chosen code as root within 24 hours, with no
human in the loop. **Tailscale, ufw and the SSH key posture are all bypassed, because the
payload arrives outbound over an allowed channel.** This is simultaneously the most likely
route to the "someone mines crypto on my server" scenario and the least defended one.

It is not hypothetical that the credential can leak: §12 of the infra doc already records a
PAT committed publicly and auto-revoked by GitHub.

The `git reset --hard` is correct for its purpose (§18 explains why `--ff-only` broke) and
should stay. The exposure is the account, not the script.

**F2. A live members-area token and 36 athletes' personal data are committed to this repo.**
*[repo-confirmed]*

Three separate violations of the repo's own standing rule that *customer names and emails
never enter this repo*:

- `automation/members-area/test_one_row.sql` — **tracked, and present in at least three
  commits** (`55fc79a`, `3e40699`, `7e22ebb`). Contains one real athlete's email, their
  Twenty person UUID, and **a real 20-character members-area access token in plaintext**.
  That token is a working password for the members area unless it has since been revoked.
- `automation/members-area/coaching_backfill_2026-07-25.csv` — **tracked.** 36 real athletes:
  full name, email, WhatsApp number, country, sport, level, signup date, and which discounted
  plan they bought.
- `automation/members-area/test_one_row.csv` — **tracked.** The same athlete as the first file.

The `.gitignore` rule added for exactly this (`automation/members-area/*.sql`) is correct and
was added too late: **`.gitignore` does not untrack a file that is already tracked**, and it
never removes anything from history. The rule has been silently doing nothing for these files
since the day it was written.

`automation/members-area/token_inserts.sql` is on disk but correctly untracked — it holds real
tokens and must stay that way.

Severity depends on whether the GitHub repo is private. **Private is not a fix**, only a
reduction: it makes F2's blast radius a subset of F1's, and both then rest on the same GitHub
account.

**F3. Hostinger/hPanel 2FA is an open item, by the repo's own record.** *[needs live check]*

`ai-infrastructure-documentation.md` §12 lists "hPanel 2FA" as an open follow-up, alongside
"Bitwarden master password out of Apple Passwords" and "Bitwarden 2FA/Emergency Access".

hPanel takeover is worse than root on the box, because it is *below* the box: console access,
snapshot restore, rebuild, and — if DNS is hosted there — the domain itself. Domain control is
what makes a genuine interception attack possible: an attacker who can change DNS can obtain a
valid Let's Encrypt certificate for `triaperformance.com` and serve a convincing clone. **That
is the real form of the man-in-the-middle worry, and the defence is 2FA on the registrar and
control panel, not anything at the network layer.**

The Bitwarden items compound it: a vault without its own 2FA, whose master password lives in
another vault, is a single-factor root credential for every other account listed here.

### Tier 2 — worth scheduling

**F4. Three unauthenticated public endpoints send email to an attacker-supplied address.**
*[repo-confirmed]*

`/api/contact-form`, `/api/plan-lead` and `/api/zone-workouts` are proxied by Caddy to n8n
webhooks whose `authentication` is unset, and each ends in a `Send reply email` node whose
`toEmail` is `{{ $('Webhook - …').item.json.body.email }}` — the submitted address, unverified.
There is no rate limit, captcha, honeypot or per-IP cap anywhere in the chain.

That is an open relay for the `coach@triaperformance.com` Gmail App Password. The abuse is not
subtle — a script POSTs addresses and Gmail sends the lead-magnet PDFs — and the damage is
**deliverability**: hitting the App Password's daily cap gets the sending identity flagged,
and a flagged sender means real athlete onboarding emails stop landing. That is slow and
annoying to undo. Secondary effect: junk Persons in Twenty, polluting the lead pipeline the
CRM exists to keep clean.

**Deliberately noted as closed, because it is the version of this that would actually cost
money:** `/api/athlete-intake` — the one endpoint whose workflow calls Gemini — **is**
protected, with `authentication: headerAuth` and an `X-Intake-Secret` header sent by
`automation/athlete-intake/onFormSubmit.gs`. The Gemini-token-abuse path through the website
is therefore already shut. Keep it that way if any future endpoint gains a model call.

**F5. The `/admin/*` credential hash is committed to the repo.** *[repo-confirmed]*

`automation/Caddyfile` carries the literal bcrypt hash for the `ivan` basic_auth user guarding
the content-engine admin at `127.0.0.1:8092`. Cost factor 14 is strong and makes offline
cracking expensive — but it is only expensive, and its expense is the entire control if the
repo leaks. A single-user basic_auth line is the right design for this surface (the reasoning
in the file is sound); the hash simply should not be the thing tracked alongside the code.

**F6. npm supply chain executes as root.** *[repo-confirmed]*

`npm ci` runs as root, unattended, whenever `package-lock.json` changes, over the full Eleventy
dev tree with lifecycle scripts enabled. A compromised transitive dependency is currently the
single most common way sites this size acquire a cryptominer, and it needs no attacker
interest in Triaperformance at all. The lockfile and the change-detection stamp already limit
this to deliberate dependency changes, which is most of the mitigation; `--ignore-scripts` is
the rest.

**F7. Members-area session model, and a cheap DoS in the auth service.** *[repo-confirmed]*

Two separate things in `automation/members-area/auth_service/app.py`:

- *Session design (mostly a known, accepted tradeoff).* The token is simultaneously the
  password and the bearer cookie, has a one-year lifetime, never rotates on use, and is stored
  in plaintext in `subscriber_tokens`. §13 of the infra doc records this as deliberate — Iván
  needs to read a subscriber's password out of the table to resend it, and what is protected
  is training content, not payment data. **That reasoning still holds and this is not a
  finding against the design.** What changed is F2: one of those plaintext tokens is now in
  git, and a leaked token grants access indefinitely because nothing expires.
- *A real defect.* `lookup_token()` opens a **new Postgres connection per request** for any
  request carrying a non-empty cookie, and `/members/check` is called by `forward_auth` on
  every single `/members/*` hit. There is no pool. A trivial flood of requests with junk
  cookie values exhausts `analytics-postgres` connections — and that container also backs the
  pixel data, the GA4/GSC tables and the content engine, so the blast radius is wider than the
  members area. There is also no rate limit or lockout on `POST /members/login` (token entropy
  makes guessing impractical, so this is a throttling gap, not a guessing risk).

### Tier 3 — real, low priority

**F8. The tracking pixel is an unauthenticated, publicly discoverable, billable endpoint.**
*[repo-confirmed]*

`automation/pixel-tracker/main.py` is a GCP Cloud Function that writes a row to BigQuery for
any request, with no auth and no validation beyond a `float()` cast on `price`. Its URL is
pasted in plaintext into every published TrainingPeaks plan description, so it is public by
construction. Anyone can bill invocations and streaming inserts, and poison `plan_views` with
fabricated rows. `plan_views_clean` filters bots by user-agent, which an abuser would not
cooperate with. Low value as a target; the fix is a GCP budget alert, not a rewrite.

**F9. Prompt injection into the content engine — bounded, but the bound is human attention.**
*[repo-confirmed]*

`research_agent.py` fetches nine external blogs listed in `sources.json` and feeds their text
to Gemini to generate article ideas. That content is attacker-influenceable in principle
(a guest post, a compromised Squarespace site — note High North is editorially dormant).

**The design already handles this well and should be credited: there are two human approval
gates**, at `/admin/ideas/` and again at `/admin/drafts/`, before anything publishes. Spend is
bounded too (`WRITE_LIMIT=3`, `TRANSLATE_LIMIT=4` in `run-agent.sh`, with the reasoning written
down). Injected instructions cannot reach the site unattended.

The residual risk is that **the gates are skimmable, and this repo already contains the
proof**: the article redirected on Aug 18, 2026 shipped through both gates while prescribing a
20-minute cycling-FTP protocol for running. That was an ordinary model error, not an attack —
but it is the exact failure shape an injected payload would rely on. The thing to watch for at
review is not weird instructions; it is a plausible article carrying an outbound link or a
factual claim that gets waved through.

**F10. Hermes holds terminal and file tools; the Telegram allowlist is the whole control.**
*[needs live check]*

Hermes runs with terminal execution backend `local`, has file tools, is powered by Gemini, and
is reachable via Telegram, a Tailscale-bound dashboard (`100.70.89.17:9119`) and the desktop
app. Access rests on `allowed_user_ids` pinned to one Telegram numeric ID — which §2 of the
infra doc correctly identifies as load-bearing, since an unrestricted bot would hand terminal
and business-data access to anyone who found its username.

That is the right control. Two residuals: Hermes reads this repo as its documented source of
truth, so **F1 is also an agent-instruction compromise**, not only a code one; and the §16
guardrail that command-approval mode stays on **"ask"** for anything touching
`/var/www/triaperformance` or the Caddy config is a setting, not a code invariant — it needs
confirming on the live dashboard rather than assuming.

**F11. Five consumers share one Gemini API key.** *[repo-confirmed, per the Aug 30 §33 addendum]*

Documented already as an *attribution* problem — Google bills the key, never the caller. It is
also a *containment* problem: there is no way to revoke or cap one consumer without breaking
the other four, so the response to any single compromised or runaway consumer is currently
all-or-nothing. Worth carrying as a reason to split keys eventually, not as urgent work.

---

## What is already right, and should not be re-litigated

Listed because a security review that only produces a defect list gives a false picture of the
posture, and because re-solving these would waste time:

- **Network exposure is genuinely well handled.** n8n, Twenty and the Hermes dashboard are all
  bound to the Tailscale interface, not `0.0.0.0`; `analytics-postgres` is on `127.0.0.1`; ufw
  is default-deny with only SSH and `tailscale0` allowed; SSH is key-only, password login
  removed. The Docker-publishes-past-ufw trap (§3) was found and correctly worked around by
  binding to a specific host IP rather than trusting a ufw rule that Docker ignores.
- **The webroot is deliberately outside `~/.hermes`**, so a Caddy misconfiguration cannot serve
  the agent's `.env` or session data.
- **The members-area gate is designed to fail closed.** One auth tree with language as a path
  segment, explicit public-path lists instead of wildcards, ordered gates, and a deploy-time
  assertion that all three login paths return 200 — with the reasoning for each written down.
- **The auth service does the fiddly things correctly**: parameterized SQL throughout,
  `HttpOnly` + `Secure` + `SameSite=Lax` cookies, and a `safe_next()` that rejects `//evil.com`
  and `/\evil.com` — a real open-redirect guard, not a token gesture.
- **Secrets are handled with a real discipline**: `.env` files at `600`, Bitwarden as the vault,
  `CHANGE_ME` in the committed compose snippet with the real DSN kept off git, credential IDs
  only in workflow JSON, and `show_env()` deliberately printing variable *names* and never
  values. F2 and F5 are lapses against this standard, not an absence of one.
- **n8n was patched 2.30.5 → 2.33.4 in response to an advisory**, with a backup taken first and
  workflows verified live afterwards. That is the single highest-value recurring security habit
  on this stack, and it is already established.
- **The one endpoint that spends model tokens is the one that is authenticated** (F4).

---

## Standing decisions

- **`.gitignore` is not a remediation.** Adding an ignore rule for a file that is already
  tracked changes nothing and removes nothing from history. Any future "make sure X never gets
  committed" needs `git rm --cached` in the same session, and a rotation of whatever X held.
- **Any credential that has been in git is burned, regardless of repo visibility.** Rotate
  first, clean history second, argue about exposure never.
- **A new public endpoint that calls a paid model needs authentication before it ships**, not
  after. `/api/athlete-intake` is the pattern to copy: `authentication: headerAuth` on the n8n
  webhook plus a shared secret from the caller.
- **The repo is a production input, not just documentation.** Anything committed to `main`
  reaches root on the VPS within 24 hours and reaches Hermes as instruction. Access to the
  GitHub account is therefore a production credential and gets treated like one.

---

## Open items

Not duplicated as a list here — `open-loops.md` is the only open-item list in this repo, and a
second one in this file would drift within days (the same reason §"Open items" was retired from
`ai-infrastructure-documentation.md` on Aug 8, 2026). The findings above keep their F-numbers so
an open-loops entry can point at one by number.
