# Triaperformance Website — Deploy Runbook

Domain: `triaperformance.com` · VPS: `179.197.76.70` (same box as Hermes)

*Rewritten August 2, 2026. This file used to document the original July 16 go-live: a hand-written single-page site in `website/`, rsynced to the webroot by a four-line script. That process no longer exists — the site is an Eleventy build from `site/`, deployed by `automation/deploy-website.sh`. §1 and §2 below are kept as the one-time infrastructure setup (still the reference if the box is ever rebuilt); §3 onward is the process that actually runs today.*

---

## 1. GoDaddy DNS — done July 16, 2026, kept as the record

Based on the exported zone file (`triaperformance.com.txt`, pulled 2026-07-16). Only two records were touched; everything email-related was left alone, since MX/SPF/DKIM/DMARC are a separate system from A/CNAME hosting records.

**Deleted** (HubSpot website hosting):
- `A` — `@` — `199.60.103.177`
- `A` — `@` — `199.60.103.77`
- `CNAME` — `www` — `7203776.group26.sites.hubspot.net.` (deleted, not edited — a name can't hold both a CNAME and an A record)

**Added** (root and www at the VPS):
- `A` — `@` — `179.197.76.70` — TTL 1 hour
- `A` — `www` — `179.197.76.70` — TTL 1 hour

**Left alone — these keep Google Workspace mail working:**
- All 5 `MX` records (`aspmx.l.google.com` + `alt1-4.aspmx.l.google.com`).
- `TXT` `dc-aa8e722993._spfm` → `v=spf1 include:_spf.google.com ~all`.
- `TXT` `_dmarc` → `v=DMARC1; p=none;`.
- `TXT` `@` → `google-site-verification=...`.
- `NS`, `SOA`, `_domainconnect` CNAME.

**Open item — HubSpot mail records, still in the zone (flagged August 2, 2026):**
- `TXT` `@` → `v=spf1 include:dc-aa8e722993._spfm... include:7203776.spf02.hubspotemail.net ~all` — the SPF record authorizes both Google *and* HubSpot to send as `@triaperformance.com`.
- `CNAME` `hs1-7203776._domainkey` and `hs2-7203776._domainkey` — HubSpot's DKIM signing keys.

These were originally marked "do not touch — still needed if HubSpot keeps sending the CoachMatch nurture emails." **It doesn't: the nurture sequence runs on n8n + Gmail SMTP and HubSpot sends nothing.** Leaving a live SPF include for a platform you no longer operate means anything sending through that HubSpot portal still passes SPF as you. Removing the include and the two DKIM CNAMEs is deliberately **deferred until HubSpot decommission is formal** (the 2,073-contact import has to happen first — `open-loops.md` NEXT #4), because pulling them early would break the re-engagement blast if it ends up being sent from HubSpot rather than n8n. Do it as the last step of decommission, not before.

**Also noted, not urgent:** an `A` record `n8n` → `100.70.89.17` — the VPS's private Tailscale address, so it resolves to nothing reachable from outside the tailnet. Harmless; revisit only if `n8n.triaperformance.com` should ever be public.

## 2. One-time VPS setup — done, kept for a rebuild

```bash
# Install Caddy — auto-provisions HTTPS via Let's Encrypt, zero manual cert work
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# Open the firewall for web traffic — SSH + Tailscale rules stay untouched
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status verbose   # confirm 80, 443, OpenSSH, tailscale0 all present

# Public webroot — deliberately separate from ~/.hermes (Hermes's data/.env stay isolated)
sudo mkdir -p /var/www/triaperformance
sudo chown -R $USER:$USER /var/www/triaperformance
```

Node is also required on the box — the Eleventy build runs on the VPS, not locally.

The Caddy config is **no longer written by hand.** `automation/Caddyfile` in the repo is the source of truth; the deploy script diffs it against `/etc/caddy/Caddyfile`, validates the repo copy, and only then copies and reloads. Never edit the live file directly.

## 3. The deploy that actually runs

`automation/deploy-website.sh` — the repo copy is the source of truth; the live copy at `~/.hermes/deploy-website.sh` is called by the 6am cron job, which does knowledge-base sync and site deploy in one pass. The script self-updates from the repo at the end of every successful run, so edits reach the box on the next deploy without any manual copy.

What one run does, in order:

1. **`git fetch` + `git reset --hard origin/main` + `git clean -fd`** — not `git pull --ff-only`, which broke the deploy the moment the box had a local commit. The VPS is a strict mirror: it builds and deploys, it never authors. Anything generated on the box (link-check results, build output) lives outside the repo or in `.gitignore`.
2. **`npm ci`, but only when `package-lock.json` actually changed** — tracked by a hash stamp. A nightly unconditional `npm ci` would make the daily job depend on the npm registry being reachable, and one transient failure would kill the knowledge-base sync too. Not `--omit=dev`: Eleventy is a devDependency and is the one package the script needs.
3. **`npx @11ty/eleventy --output=$BUILD_DIR`** into a temp directory (chmod 755 — `mktemp -d` creates 0700, and `rsync -a` would have propagated that to the webroot and made Caddy 403 everything).
4. **Publish guards** — no `index.html` or zero pages means the build failed; the script exits and the live site is left exactly as it was. Nothing half-deploys.
5. **`rsync -a --delete` into `/var/www/triaperformance`**, then `chmod -R a+rX`.
6. **Caddyfile sync** — diff, validate the repo copy, copy and `systemctl reload caddy` only if validation passes. A bad commit fails loudly here and leaves the running config alone.
7. **Post-deploy verification** — real HTTPS requests to `/`, `/planes/running/`, `/members/login/` and `/blog/` via `curl --resolve` (not a `Host:` header — Caddy routes TLS by SNI, and curl sends no SNI for a bare IP, so a Host header reports 000 on a healthy site). Warns if any path isn't 200.
8. **Self-update** — copies the repo's script over the live one, at the end, only after a successful run, so a bad commit can't brick the deploy path.

## 4. Pushing changes

Commit and push to `main`. It goes live either:

- automatically at the next 6am cron run, or
- immediately, by SSHing in and running `~/.hermes/deploy-website.sh` — or asking Hermes to run it via Telegram.

Content lives in `site/` (Eleventy source). `website/` holds only `hubfs/`, the route TrainingPeaks' marketplace hotlinks across ~300 live plans — permanent, not migration debt. New pages need the front-matter decisions listed in the project instructions' page checklist (`noindex`, `transKey`, `noClarity`/`noTracking`); everything else — analytics, canonical, hreflang, sitemap entry — is inherited from `layouts/base.njk`.

## Notes

- Caddy needs port 80 reachable for the Let's Encrypt HTTP challenge — that's why `ufw allow 80/tcp` matters even though the site serves over HTTPS.
- Webroot is intentionally outside `~/.hermes` — a Caddy misconfiguration can't expose Hermes's `.env` or session data.
- Full build/incident detail: `website-build-cutover-runbook.md` and `ai-infrastructure-documentation.md` §15–17.
