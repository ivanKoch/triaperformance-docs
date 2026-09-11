#!/usr/bin/env bash
#
# Triaperformance VPS backup — reference copy. Live copy runs from the repo clone:
#   /root/.hermes/triaperformance-docs/automation/backup-vps.sh
# via a crontab line that git-pulls first (see deploy-runbook.md §Backups).
#
# What it backs up, every night, into ONE encrypted archive:
#   1. Twenty CRM        — pg_dumpall from the Twenty Postgres container (every customer record)
#   2. analytics-postgres — pg_dumpall: analytics, storefront, content, members (the warehouse,
#                          the content engine, subscriber tokens, suppression list)
#   3. n8n               — /root/.n8n: database.sqlite (every workflow + execution history)
#                          and `config` (the encryption key — without it every stored
#                          credential is unrecoverable)
#   4. Hermes            — ~/.hermes config.yaml, .env, cron/ (not the repo clone, not logs)
#   5. Run configuration — ~/.members-auth, ~/.analytics (.env + compose, not data/venv),
#                          ~/.twenty (.env + compose, not data), /etc/caddy/Caddyfile,
#                          crontab, and `docker inspect` of every container
#
# Then: gpg symmetric encryption (AES256), local retention, rclone copy off-site,
# remote retention, integrity check, and a Telegram line on failure (optional).
#
# Config lives in /root/.backup/.env — never in this file:
#   BACKUP_PASSPHRASE_FILE=/root/.backup/passphrase   # chmod 600; ALSO stored in Bitwarden
#   RCLONE_REMOTE=gdrive:triaperformance-backups        # rclone remote:path, or empty to skip
#   KEEP_DAYS_LOCAL=14
#   KEEP_DAYS_REMOTE=60
#   TELEGRAM_BOT_TOKEN=...   TELEGRAM_CHAT_ID=...       # optional; failures only
#
# Restore is documented next to the crontab line in deploy-runbook.md §Backups.

set -euo pipefail

ENV_FILE="/root/.backup/.env"
[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE"; exit 1; }
set -a; . "$ENV_FILE"; set +a

: "${BACKUP_PASSPHRASE_FILE:=/root/.backup/passphrase}"
: "${RCLONE_REMOTE:=}"
: "${KEEP_DAYS_LOCAL:=14}"
: "${KEEP_DAYS_REMOTE:=60}"
: "${TELEGRAM_BOT_TOKEN:=}"
: "${TELEGRAM_CHAT_ID:=}"

OUT_DIR="/root/.backup/archives"
LOG_DIR="/root/.backup/logs"
STAMP="$(date +%Y%m%d-%H%M)"
NAME="tp-backup-$STAMP"
WORK="$(mktemp -d /tmp/tp-backup.XXXXXX)"
ARCHIVE="$OUT_DIR/$NAME.tar.gz.gpg"
mkdir -p "$OUT_DIR" "$LOG_DIR" "$WORK"
chmod 700 /root/.backup "$OUT_DIR"

log() { echo "[$(date -u +%FT%TZ)] $*"; }

alert() {
  # Failures only. Success is silent; the weekly hygiene pass reads the log.
  local msg="$1"
  log "FAILED: $msg"
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -fsS -m 10 "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
      --data-urlencode "chat_id=$TELEGRAM_CHAT_ID" \
      --data-urlencode "text=VPS backup FAILED: $msg" >/dev/null || true
  fi
}

cleanup() { rm -rf "$WORK"; }
trap 'rc=$?; if [ $rc -ne 0 ]; then alert "step: ${STEP:-unknown} (exit $rc)"; fi; cleanup' EXIT

# A dump smaller than this is a connection that succeeded and returned nothing.
min_bytes() { local f="$1" min="$2"; local s; s=$(stat -c %s "$f"); [ "$s" -ge "$min" ] || { echo "$f is only $s bytes"; return 1; }; }

# ---------------------------------------------------------------- 1. Twenty
STEP="twenty"
TWENTY_PG="$(docker ps --format '{{.Names}}' | grep -iE 'twenty.*(postgres|db)|(postgres|db).*twenty' | head -1 || true)"
[ -n "$TWENTY_PG" ] || { echo "no running Twenty Postgres container found"; exit 1; }
log "Twenty Postgres container: $TWENTY_PG"
docker exec "$TWENTY_PG" pg_dumpall -U postgres --clean --if-exists | gzip -6 > "$WORK/twenty.pg_dumpall.sql.gz"
min_bytes "$WORK/twenty.pg_dumpall.sql.gz" 20000

# ------------------------------------------------------ 2. analytics-postgres
STEP="analytics-postgres"
set -a; . /root/.analytics/.env; set +a       # PG_USER lives here; never retype it
docker exec analytics-postgres pg_dumpall -U "$PG_USER" --clean --if-exists | gzip -6 > "$WORK/analytics.pg_dumpall.sql.gz"
min_bytes "$WORK/analytics.pg_dumpall.sql.gz" 20000
# Sanity: the four databases this box is known to hold must all be in the dump.
for db in analytics storefront content members; do
  zcat "$WORK/analytics.pg_dumpall.sql.gz" | grep -q "CREATE DATABASE $db " || { echo "database $db missing from analytics dump"; exit 1; }
done

# -------------------------------------------------------------------- 3. n8n
STEP="n8n"
mkdir -p "$WORK/n8n"
if command -v sqlite3 >/dev/null 2>&1; then
  # Online, consistent copy — no container stop needed.
  sqlite3 /root/.n8n/database.sqlite ".backup '$WORK/n8n/database.sqlite'"
else
  # Fallback: a stopped copy. A few seconds; the IMAP poll simply runs late once.
  N8N_C="$(docker ps --format '{{.Names}}' | grep -i n8n | head -1 || true)"
  [ -n "$N8N_C" ] || { echo "no running n8n container found"; exit 1; }
  docker stop "$N8N_C" >/dev/null
  cp /root/.n8n/database.sqlite "$WORK/n8n/database.sqlite"
  docker start "$N8N_C" >/dev/null
fi
cp /root/.n8n/config "$WORK/n8n/config"                       # the encryption key
[ -d /root/.n8n/binaryData ] && cp -a /root/.n8n/binaryData "$WORK/n8n/" || true
min_bytes "$WORK/n8n/database.sqlite" 100000
min_bytes "$WORK/n8n/config" 20

# ----------------------------------------------------------------- 4. Hermes
STEP="hermes"
mkdir -p "$WORK/hermes"
for f in config.yaml .env; do [ -f "/root/.hermes/$f" ] && cp "/root/.hermes/$f" "$WORK/hermes/"; done
[ -d /root/.hermes/cron ] && cp -a /root/.hermes/cron "$WORK/hermes/" || true

# ------------------------------------------------------ 5. Run configuration
STEP="runconfig"
mkdir -p "$WORK/runconfig"
for d in /root/.members-auth /root/.analytics /root/.twenty; do
  [ -d "$d" ] || continue
  tar -C "$(dirname "$d")" -czf "$WORK/runconfig/$(basename "$d").tar.gz" \
    --exclude='data' --exclude='venv' --exclude='logs' --exclude='*.sql' --exclude='backups' \
    "$(basename "$d")"
done
[ -f /etc/caddy/Caddyfile ] && cp /etc/caddy/Caddyfile "$WORK/runconfig/Caddyfile"
crontab -l > "$WORK/runconfig/crontab.txt" 2>/dev/null || true
docker ps -a --format '{{.Names}}' | while read -r c; do docker inspect "$c" > "$WORK/runconfig/inspect-$c.json"; done
docker ps -a --format '{{.Names}}\t{{.Image}}\t{{.Status}}' > "$WORK/runconfig/containers.txt"
uname -a > "$WORK/runconfig/host.txt"; date -u +%FT%TZ >> "$WORK/runconfig/host.txt"

# ------------------------------------------------------------ 6. Encrypt
STEP="encrypt"
[ -s "$BACKUP_PASSPHRASE_FILE" ] || { echo "no passphrase at $BACKUP_PASSPHRASE_FILE"; exit 1; }
tar -C "$WORK" -cz . | gpg --batch --yes --symmetric --cipher-algo AES256 \
  --passphrase-file "$BACKUP_PASSPHRASE_FILE" -o "$ARCHIVE"
chmod 600 "$ARCHIVE"

# ------------------------------------------------------------- 7. Verify
STEP="verify"
ENTRIES="$(gpg --batch --quiet --passphrase-file "$BACKUP_PASSPHRASE_FILE" --decrypt "$ARCHIVE" | tar -tz | wc -l)"
[ "$ENTRIES" -ge 10 ] || { echo "archive lists only $ENTRIES entries"; exit 1; }
SIZE="$(du -h "$ARCHIVE" | cut -f1)"
log "archive $ARCHIVE — $SIZE, $ENTRIES entries, decrypts and lists cleanly"

# ------------------------------------------------------------ 8. Off-site
STEP="offsite"
if [ -n "$RCLONE_REMOTE" ]; then
  rclone copy "$ARCHIVE" "$RCLONE_REMOTE/" --quiet
  REMOTE_SIZE="$(rclone size "$RCLONE_REMOTE/$NAME.tar.gz.gpg" --json | sed -n 's/.*"bytes":\([0-9]*\).*/\1/p')"
  LOCAL_SIZE="$(stat -c %s "$ARCHIVE")"
  [ "$REMOTE_SIZE" = "$LOCAL_SIZE" ] || { echo "remote size $REMOTE_SIZE != local $LOCAL_SIZE"; exit 1; }
  rclone delete "$RCLONE_REMOTE/" --min-age "${KEEP_DAYS_REMOTE}d" --quiet || true
  log "off-site copy verified at $RCLONE_REMOTE ($LOCAL_SIZE bytes); remote retention ${KEEP_DAYS_REMOTE}d"
else
  log "RCLONE_REMOTE empty — no off-site copy (local only, which is not a backup if the VPS dies)"
fi

# ------------------------------------------------------- 9. Local retention
STEP="retention"
find "$OUT_DIR" -name 'tp-backup-*.tar.gz.gpg' -mtime "+$KEEP_DAYS_LOCAL" -delete
log "done — local retention ${KEEP_DAYS_LOCAL}d, $(ls "$OUT_DIR" | wc -l) archives kept locally"
