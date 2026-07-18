# Twenty CRM — Deploy Runbook (Step 1 of the HubSpot migration)

Same VPS as Hermes and the website (`179.197.76.70`), own directory, own lane — consistent with how everything else on this box is kept separated. Twenty is **not** public-facing: it's an internal tool you use yourself, so it's bound to the Tailscale interface only (`100.70.89.17`), same pattern as the Hermes dashboard, not the public `0.0.0.0`/port-80-443 pattern used for the website.

Correction on one thing I said earlier: I described Twenty as shipping a "native MCP server" — that's specifically a Twenty **Cloud Pro** feature. Self-hosted gets full feature parity with Cloud Pro otherwise, but the Claude/Hermes integration piece is a separate, actively maintained open-source MCP server that talks to Twenty's REST/GraphQL API (works fine against a self-hosted instance via API key + base URL). Doesn't change the plan, just means there's one more small piece to deploy later — not today's step.

## 1. Set up the working directory + environment file

```bash
mkdir -p ~/.twenty && cd ~/.twenty

# Pull the example env file
curl -o .env https://raw.githubusercontent.com/twentyhq/twenty/refs/heads/main/packages/twenty-docker/.env.example

# Generate the encryption key — this protects every secret Twenty stores (OAuth tokens, API keys, etc).
# Keep it safe; losing it means losing access to those secrets.
openssl rand -base64 32
```

Open `.env` and set:
```ini
ENCRYPTION_KEY=<paste the generated string above>
PG_DATABASE_PASSWORD=<a strong password, no special characters>
SERVER_URL=http://100.70.89.17:3000
```

`SERVER_URL` uses `http` (not `https`) deliberately — you're only ever reaching this over the Tailscale tunnel, which is already encrypted end-to-end, so a second layer of TLS + a Caddy vhost isn't buying anything here. Same reasoning as the Hermes dashboard.

## 2. Get the Docker Compose file

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/twentyhq/twenty/refs/heads/main/packages/twenty-docker/docker-compose.yml
```

## 3. Lock the port to Tailscale only — do this before starting the containers

Open `docker-compose.yml` and find the service that publishes port `3000` (the front-end/server). Its `ports:` line will look like:
```yaml
ports:
  - "3000:3000"
```
Change it to bind explicitly to the Tailscale IP:
```yaml
ports:
  - "100.70.89.17:3000:3000"
```
This is the same fix that was needed for the Hermes dashboard — Docker manipulates iptables directly and a `ufw` rule alone won't restrict a published container port; binding to a specific host IP is what actually works. Double-check there's no other service in the file (worker, postgres, redis) with a `ports:` section publishing to `0.0.0.0` — those should have no `ports:` entry at all, or be internal-only.

## 4. Launch

```bash
docker compose up -d
docker compose ps          # confirm all services are "healthy" or "running"
curl http://localhost:3000 # sanity check from the VPS itself
```

Then from your Mac (on the Tailscale network): open `http://100.70.89.17:3000` in a browser and complete Twenty's own first-run workspace setup (create your admin account, name the workspace).

## 5. Backups

```bash
mkdir -p ~/.twenty/backups
(crontab -l 2>/dev/null; echo "0 2 * * * docker exec twenty-postgres pg_dump -U postgres twenty > ~/.twenty/backups/twenty_\$(date +\%Y\%m\%d).sql") | crontab -
```
Daily dump at 2am server time — same lightweight pattern as the other cron jobs on this box. Worth pruning old backups periodically (not automated here, keep it simple for now).

## 6. Verify

- `http://100.70.89.17:3000` loads and logs in, from your Mac, over Tailscale.
- `curl -I http://179.197.76.70:3000` from anywhere **outside** the tailnet should time out / fail to connect — confirms it's not accidentally public.

## Next (not today's step — later in the sequence)

- Schema design (People/Opportunities/custom fields) — task next in line.
- The community MCP server, once schema is settled, so Claude/Hermes can query and update leads as a tool.
