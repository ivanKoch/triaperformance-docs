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

~~**Open item — HubSpot mail records, still in the zone (flagged August 2, 2026):**~~ ✅ ***DONE September 8, 2026 — portal deleted and all three records pulled. Verified against the zone export taken the same day. This section is kept as the record of what was removed and what was deliberately not.***
- `TXT` `@` → `v=spf1 include:dc-aa8e722993._spfm... include:7203776.spf02.hubspotemail.net ~all` — the SPF record authorizes both Google *and* HubSpot to send as `@triaperformance.com`.
- `CNAME` `hs1-7203776._domainkey` and `hs2-7203776._domainkey` — HubSpot's DKIM signing keys.

These were originally marked "do not touch — still needed if HubSpot keeps sending the CoachMatch nurture emails." **It doesn't: the nurture sequence runs on n8n + Gmail SMTP and HubSpot sends nothing.** Leaving a live SPF include for a platform you no longer operate means anything sending through that HubSpot portal still passes SPF as you. ~~Removing the include and the two DKIM CNAMEs is deliberately **deferred until HubSpot decommission is formal** (the contact import has to happen first — `open-loops.md` NEXT #4), because pulling them early would break the re-engagement blast if it ends up being sent from HubSpot rather than n8n.~~ ***Unblocked September 8, 2026 — Iván is deleting the portal, so the blast cannot come from HubSpot and the deferral has no remaining condition.*** *Sequence: seed `email_suppression` from the export first (done — `open-loops.md` NEXT #3), then delete the portal, then pull these records.*

🚨 ***Pull exactly three things, and EDIT the SPF string rather than deleting the TXT record.*** *Verified against the real zone export, September 8, 2026:*

| | record | action |
|---|---|---|
| 1 | `TXT` `@` `"v=spf1 include:dc-aa8e722993._spfm.triaperformance.com include:7203776.spf02.hubspotemail.net ~all"` | **edit** → `"v=spf1 include:dc-aa8e722993._spfm.triaperformance.com ~all"` |
| 2 | `CNAME` `hs1-7203776._domainkey` → `triaperformance-com.hs04a.dkim.hubspotemail.net` | **delete** |
| 3 | `CNAME` `hs2-7203776._domainkey` → `triaperformance-com.hs04b.dkim.hubspotemail.net` | **delete** |

⚠️ ***Correction to an earlier note in this section, September 8, 2026: Google is NOT included directly in the apex SPF record.*** *An earlier version of this note said "the Google include lives in the same record", which would send someone looking for `include:_spf.google.com` at the apex, not finding it, and concluding the whole TXT is HubSpot's to delete.* **Workspace is reached through GoDaddy's SPF-merge indirection — the apex includes `dc-aa8e722993._spfm.triaperformance.com`, and *that* record holds `include:_spf.google.com`.** *So there are two things in the zone that look like generated junk and are load-bearing: the `dc-aa8e722993._spfm` TXT record and the `google-site-verification` TXT below. Neither is HubSpot's.*

⚠️ ***Do NOT delete the `TXT` `@` → `google-site-verification=...` record while you are in there.*** *It reads like a HubSpot-era leftover and is not: it is what auto-verified the Search Console Domain property, which is why the GSC backfill reaches `2025-05-06` instead of July 2026. Removing it un-verifies the property and breaks the 05:15 nightly sync. See `ai-infrastructure-documentation.md` §9.*

✅ ***Zone verified clean, 2026-09-08 10:35 export:*** *apex SPF `"v=spf1 include:dc-aa8e722993._spfm.triaperformance.com ~all"`, both `hs*-_domainkey` CNAMEs absent, `dc-aa8e722993._spfm` and `google-site-verification` intact, MX and `_dmarc` untouched. `google._domainkey` added the same day (2048-bit RSA, split across two strings as any key over 255 chars must be).*

🚨 ***Opened by this cleanup and NOT a HubSpot item — steps 2 and 3 removed the zone's ONLY DKIM records.*** *`hs1-`/`hs2-7203776._domainkey` were the only two, and Workspace DKIM has never been configured (there is no `google._domainkey` in the zone).* **So mail sent as `@triaperformance.com` passes SPF and fails DKIM alignment, and `_dmarc` is `p=none`, which is why nothing has ever visibly broken.** *That is survivable for the handful of transactional sends running today and is a real problem for `open-loops.md` NEXT #3 — a cold blast to ~2,000 three-year-old contacts, unsigned, is a spam-folder outcome regardless of what the copy says.* ~~**Fix is free: Workspace Admin → Apps → Google Workspace → Gmail → Authenticate email → generate the key → add the `google._domainkey` TXT here → Start authentication.**~~ ***Key generated, in the zone, and* Start authentication *accepted — September 8, 2026, on the second press. The first returned Google's red "wait up to 48 hours", which resolved on propagation alone; `google._domainkey.triaperformance.com` now answers publicly.*** ⚠️ **Still unverified: a `google._domainkey` TXT with *Start authentication* unpressed looks identical in a zone export to one that is live.** *The only proof is a real message — send one through the n8n + Gmail SMTP path, open it in Gmail, Show original, and look for `dkim=pass header.d=triaperformance.com`. The Gmail web UI is a different sender and does not test the path that matters.* *Tracked as `open-loops.md` NEXT #4. Moving `_dmarc` past `p=none` is a separate decision and should wait until DKIM has been signing for a couple of weeks.*

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

## 5. Backups — `automation/backup-vps.sh` (added September 11, 2026)

One encrypted archive a night, off-site. Covers Twenty (pg_dumpall), `analytics-postgres` (pg_dumpall: analytics, storefront, content, members), `/root/.n8n` (workflows, executions and the encryption key), Hermes config, and the run configuration of every container. The script refuses to finish if any dump is suspiciously small, if the archive does not decrypt and list, or if the off-site copy's size differs from the local one. Failures alert on Telegram if the bot token is configured; success is silent.

Off-site target: Google Drive through rclone, under the Workspace account (already paid for, and nothing else on the VPS depends on it). Retention: 14 days local, 60 days remote.

**Setup, once (on the VPS as root):**

```bash
apt-get install -y gnupg rclone sqlite3
mkdir -p /root/.backup && chmod 700 /root/.backup
openssl rand -base64 48 > /root/.backup/passphrase && chmod 600 /root/.backup/passphrase
cat /root/.backup/passphrase        # paste this into Bitwarden NOW — without it every archive is noise
cat > /root/.backup/.env <<'ENV'
BACKUP_PASSPHRASE_FILE=/root/.backup/passphrase
RCLONE_REMOTE=gdrive:triaperformance-backups
KEEP_DAYS_LOCAL=14
KEEP_DAYS_REMOTE=60
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
ENV
chmod 600 /root/.backup/.env
rclone config      # n) new remote → name: gdrive → storage: drive → scope: drive.file → headless auth: follow the prompt on your Mac
rclone mkdir gdrive:triaperformance-backups && rclone lsd gdrive:
```

**First run, by hand, and read the output:**

```bash
cd /root/.hermes/triaperformance-docs && git pull && chmod +x automation/backup-vps.sh && automation/backup-vps.sh
```

**Cron (03:15, after the 02:00 analytics syncs and before the 06:00 deploy):**

```bash
(crontab -l 2>/dev/null; echo '15 3 * * * cd /root/.hermes/triaperformance-docs && git pull -q && automation/backup-vps.sh >> /root/.backup/logs/backup.log 2>&1') | crontab -
```

**Restore test — do it once after the first run, and again at each quarterly close.** A backup nobody has restored is a hope.

```bash
mkdir -p /tmp/restore && cd /tmp/restore
F=$(ls -t /root/.backup/archives/*.gpg | head -1)
gpg --batch --passphrase-file /root/.backup/passphrase --decrypt "$F" | tar -xz
ls -la . n8n runconfig
zcat twenty.pg_dumpall.sql.gz | grep -c 'CREATE TABLE'          # should be well over 100
zcat analytics.pg_dumpall.sql.gz | grep 'CREATE DATABASE'        # four databases
sqlite3 n8n/database.sqlite 'select count(*) from workflow_entity;'   # your workflow count
rm -rf /tmp/restore
```

**Restoring for real** (a rebuilt VPS): recreate the containers from `runconfig/inspect-*.json` and the compose files in `runconfig/*.tar.gz`; `docker exec -i <twenty-pg> psql -U postgres < twenty.pg_dumpall.sql`; same for `analytics-postgres` with `$PG_USER`; stop n8n, copy `n8n/database.sqlite` and `n8n/config` into `/root/.n8n/`, start n8n; copy `hermes/` into `/root/.hermes/`; Caddyfile from the repo. The order matters only for n8n: the `config` file must be in place before the container starts, or n8n generates a new key and every credential becomes unreadable.

Weekly hygiene pass: `tail -3 /root/.backup/logs/backup.log` and `rclone ls gdrive:triaperformance-backups | tail -3` — a date older than two days is a failure that did not alert.
