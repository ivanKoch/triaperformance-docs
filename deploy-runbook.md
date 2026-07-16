# Triaperformance Website — Go-Live Runbook

Domain: `triaperformance.com` · VPS: `179.197.76.70` (same box as Hermes)

## 1. GoDaddy DNS (do this first — propagation takes time, let it run in the background)

1. Log into GoDaddy → **My Products** → find `triaperformance.com` → **DNS** → **DNS Management**.
2. Delete/replace any existing A or CNAME record on `@` that points at the old HubSpot hosting.
3. Add/edit:
   - Type `A`, Name `@`, Value `179.197.76.70`, TTL default (1 hour or less).
   - Type `A`, Name `www`, Value `179.197.76.70`, TTL default.
4. Save. Propagation is often fast but can take up to a few hours — proceed to step 2 while it settles.

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
