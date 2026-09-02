#!/usr/bin/env bash
#
# Cron entry point for the content engine's two agents.
#
#   run-agent.sh research    crawl the source blogs and propose ideas   (weekly)
#   run-agent.sh write       draft whatever ideas Iván approved         (daily)
#   run-agent.sh translate   give approved articles their EN/PT siblings (daily)
#   run-agent.sh notify      tell Iván if anything needs him, or broke  (daily)
#   run-agent.sh publish     drain 2 approved articles onto the site    (daily)
#
# WHY A WRAPPER AND NOT TWO RAW CRONTAB LINES
# The standing rule (ai-infrastructure-documentation.md §18) is that a plain
# crontab line can point straight at the repo copy, no dispatcher needed. That
# still holds — the crontab lines below do the `git pull` themselves, so this
# script is always current before it runs. What the wrapper adds is the three
# things an unattended job needs and a one-liner can't express: a lock so two
# runs can't overlap, a log that says when and what, and a status file so a
# failure is discoverable instead of silent.
#
# CRONTAB (crontab -e as root)
#
#   R=/root/.hermes/triaperformance-docs
#   30 6 * * 1  cd $R && git pull -q && automation/content-engine/run-agent.sh research
#   0  7 * * *  cd $R && git pull -q && automation/content-engine/run-agent.sh write
#   30 7 * * *  cd $R && git pull -q && automation/content-engine/run-agent.sh translate
#   30 5 * * *  cd $R && git pull -q && automation/content-engine/run-agent.sh publish
#   0  8 * * *  cd $R && git pull -q && automation/content-engine/run-agent.sh notify
#
# Publish runs at 05:30, half an hour before deploy-website.sh at 06:00, so the
# two articles it commits are live the same morning rather than waiting a day.
#
# Translate runs after write, and half an hour later, because it works on a
# different input: write turns approved IDEAS into drafts, translate turns
# approved ARTICLES into siblings. Yesterday's approvals are what it picks up.
#
# Notify runs last, so the message reflects the morning's work rather than
# yesterday's state.
#
# The `git pull` lives in the crontab line, not in this script, on purpose: a
# script that updates itself mid-run is still executing the old copy. Pulling
# first means the shell reads this file after the update, not before.
#
# WHY WEEKLY FOR RESEARCH, DAILY FOR WRITE
# Ideas need a week of source-blog activity to be worth reading; running the
# research agent daily produces near-duplicates of yesterday's list and trains
# you to skim the review page. Writing is the opposite — it should pick up an
# approval the morning after you make it, so approving is never the thing
# holding a draft back.

set -uo pipefail

REPO="${REPO:-$HOME/.hermes/triaperformance-docs}"
PYTHON="${PYTHON:-$HOME/.analytics/venv/bin/python3}"
LOG_DIR="${LOG_DIR:-$HOME/.hermes/logs}"
STATE_DIR="${STATE_DIR:-$HOME/.hermes/state}"

# Cost guard. An unattended writer over a large approved queue is the only
# place this pipeline can spend money without anyone watching. At ~US$0.08 an
# article the exposure is small, but "small per unit, unbounded count" is the
# shape of every runaway bill, so the count is bounded.
WRITE_LIMIT="${WRITE_LIMIT:-3}"
# Counted in ARTICLES, not generations — each one costs up to two model calls.
TRANSLATE_LIMIT="${TRANSLATE_LIMIT:-4}"   # 2 -> 4, Ivan, Sep 2 2026: 18 pending drained in 9 nights at 2; cost is ~$0.10/article, the constraint is review appetite

AGENT="${1:-}"
case "$AGENT" in
  research)  CMD=(research_agent.py) ;;
  write)     CMD=(writer_agent.py --limit "$WRITE_LIMIT") ;;
  translate) CMD=(writer_agent.py --auto-translate --limit "$TRANSLATE_LIMIT") ;;
  notify)    CMD=(notify.py) ;;
  publish)   CMD=() ;;   # handled below — a webhook poke, not a python script
  *)         echo "usage: $0 {research|write|translate|notify|publish}" >&2; exit 64 ;;
esac

# Label this run for the model_usage table. write and translate are the SAME
# script (writer_agent.py) with different flags, so argv cannot tell them apart
# and per-caller attribution would collapse them into one line. This is the only
# place that knows which mode is running.
export CONTENT_CALLER="$AGENT"

mkdir -p "$LOG_DIR" "$STATE_DIR"
LOG="$LOG_DIR/content-$AGENT.log"
STATE="$STATE_DIR/content-$AGENT.status"
LOCK="$STATE_DIR/content-$AGENT.lock"

# Keep the log from growing without bound. Trimming to the last 2000 lines is
# enough to see several runs back, which is all anyone reads.
if [ -f "$LOG" ] && [ "$(wc -l < "$LOG")" -gt 4000 ]; then
  tail -n 2000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

exec 9>"$LOCK"
if ! flock -n 9; then
  echo "$(date -Is) [$AGENT] previous run still going — skipping" >> "$LOG"
  exit 0
fi

STARTED=$(date -Is)
{
  echo "=============================================================="
  echo "$STARTED  $AGENT  (write_limit=$WRITE_LIMIT translate_limit=$TRANSLATE_LIMIT)"
} >> "$LOG"

cd "$REPO/automation/content-engine" || {
  echo "$STARTED [$AGENT] repo path missing: $REPO" >> "$LOG"
  echo "FAIL $STARTED repo path missing" > "$STATE"
  exit 1
}

if [ "$AGENT" = "publish" ]; then
  # Drain the approved queue. The n8n workflow itself decides how many to take
  # (LIMIT in its query), so this is a poke with no arguments — which is only
  # safe because the webhook is a trigger, not a payload. Firing it twice
  # publishes the next two, never the same two.
  HOOK="${PUBLISH_WEBHOOK:-$(grep -h '^PUBLISH_WEBHOOK=' "$HOME/.hermes/.env" \
        "$HOME/.analytics/.env" 2>/dev/null | head -1 | cut -d= -f2- | tr -d "\"'")}"
  if [ -z "$HOOK" ]; then
    echo "PUBLISH_WEBHOOK not set (add it to ~/.hermes/.env)" >> "$LOG"
    RC=1
  else
    curl -sS --max-time 120 -X POST -H 'Content-Type: application/json' \
         -d '{}' "$HOOK" >> "$LOG" 2>&1
    RC=$?
    echo "" >> "$LOG"
  fi
else
  "$PYTHON" "${CMD[@]}" >> "$LOG" 2>&1
  RC=$?
fi

FINISHED=$(date -Is)
if [ "$RC" -eq 0 ]; then
  echo "$FINISHED  $AGENT OK" >> "$LOG"
  echo "OK $FINISHED" > "$STATE"
else
  echo "$FINISHED  $AGENT FAILED rc=$RC" >> "$LOG"
  # Read by the notifier (still to be built) so a cron that has been broken for
  # a fortnight surfaces as a message rather than as an empty review page that
  # looks like a quiet week.
  echo "FAIL $FINISHED rc=$RC" > "$STATE"
fi
exit "$RC"
