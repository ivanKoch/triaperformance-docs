# Triaperformance Website — Go-Live Runbook

Domain: `triaperformance.com` · VPS: `179.197.76.70` (same box as Hermes)

## 1. GoDaddy DNS (do this first — propagation takes time, let it run in the background)

Based on the actual exported zone file (`triaperformance.com.txt`, pulled 2026-07-16). Only two records are touched — everything email-related is left completely alone, since MX/SPF/DKIM/DMARC are a separate system from A/CNAME hosting records and changing hosting records cannot affect mail delivery.

**Delete these 3 records** (all HubSpot website hosting — being replaced):
- `A` — Name `@` — Value `199.60.103.177`
- `A` — Name `@` — Value `199.60.103.77`
- `CNAME` — Name `www` — Value `7203776.group26.sites.hubspot.net.` (must be deleted, not edited — a name can't hold both a CNAME and an A record at once)

**Add these 2 records** (point both root and www at the VPS):
- `A` — Name `@` — Value `179.197.76.70` — TTL 1 hour
- `A` — Name `www` — Value `179.197.76.70` — TTL 1 hour

**Do not touch — these keep your Gmail/Google Workspace email working:**
- All 5 `MX` records (`aspmx.l.google.com` + `alt1-4.aspmx.l.google.com`) — this is what actually routes your mail to Gmail. Completely separate from website hosting; nothing above affects it.
- `TXT` `@` → `v=spf1 include:dc-aa8e722993._spfm... include:7203776.spf02.hubspotemail.net ~all` — SPF, authorizes both Google and HubSpot to send as you. Still needed if HubSpot keeps sending the CoachMatch nurture emails.
- `TXT` `dc-aa8e722993._spfm` → `v=spf1 include:_spf.google.com ~all` — part of the same SPF chain above.
- `TXT` `_dmarc` → `v=DMARC1; p=none;` — DMARC policy.
- `CNAME` `hs1-7203776._domainkey` and `hs2-7203776._domainkey` — HubSpot's DKIM signing keys, still needed for the same reason as the SPF include.
- `TXT` `@` → `google-site-verification=...` — Search Console/Workspace verification.
- `NS` records, `SOA`, `_domainconnect` CNAME — leave as-is, unrelated.

**One thing to note, not urgent:** there's an existing `A` record `n8n` → `100.70.89.17` — that's the VPS's private Tailscale address, not a public IP, so this record currently doesn't resolve to anything reachable from outside your tailnet. Harmless to leave for now; flag if you actually want `n8n.triaperformance.com` publicly reachable later.

Save changes. Propagation is often fast but can take up to a few hours — proceed to step 2 while it settles.

## 2. VPS setup (SSH in as usual, run in order)

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

# First deploy — pull latest from the already-cloned knowledge base repo, copy the website/ folder out
cd ~/.hermes/triaperformance-docs && git pull
rsync -a --delete ~/.hermes/triaperformance-docs/website/ /var/www/triaperformance/

# Caddy config
sudo tee /etc/caddy/Caddyfile > /dev/null << 'EOF'
triaperformance.com, www.triaperformance.com {
    root * /var/www/triaperformance
    file_server
    encode gzip
}
EOF
sudo systemctl reload caddy

# Auto-deploy going forward — replaces the plain "git pull" cron with pull+sync,
# so the daily 6am job now updates both the KB and the live site from one job
cat > ~/.hermes/deploy-website.sh << 'EOF'
#!/bin/bash
cd ~/.hermes/triaperformance-docs && git pull
rsync -a --delete ~/.hermes/triaperformance-docs/website/ /var/www/triaperformance/
EOF
chmod +x ~/.hermes/deploy-website.sh
(crontab -l 2>/dev/null | grep -v 'git pull >> ~/.hermes/logs/kb-sync.log'; echo "0 6 * * * ~/.hermes/deploy-website.sh >> ~/.hermes/logs/kb-sync.log 2>&1") | crontab -
```

## 3. Verify

```bash
curl -I https://triaperformance.com
```

Should return `HTTP/2 200`. If it errors before DNS has propagated, Caddy retries the certificate request automatically in the background — no action needed, just re-check in a few minutes.

## 4. Pushing future changes

Once Claude (or you) commits and pushes new `website/` content to GitHub, it goes live either:
- automatically at the next 6am cron run, or
- immediately, by SSHing in and running `~/.hermes/deploy-website.sh` — or asking Hermes to run it via Telegram.

## Notes

- Caddy needs port 80 reachable to complete the Let's Encrypt HTTP challenge — that's why the `ufw allow 80/tcp` step matters even though the site is served over HTTPS.
- Webroot is intentionally outside `~/.hermes` — a Caddy misconfiguration can't expose Hermes's `.env` or session data.
- This deploys the current single-page homepage. Additional pages just need to land in the `website/` folder in the repo; the deploy script picks up anything in that folder automatically.
