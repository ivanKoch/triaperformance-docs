#!/usr/bin/env bash
# Dispatcher for /root/.hermes/deploy-website.sh — §18 shape.
#
# WHY A DISPATCHER AND NOT A CRONTAB REPOINT. The project's standing practice is
# that a script invoked by a plain crontab line can just have the line point into
# the clone. That is wrong for THIS script, and the reason is worth keeping:
# deploy-website.sh does `git fetch && git reset --hard origin/main` on the very
# clone it would be executing from. Bash reads a script lazily, line by line, so
# a reset that lands mid-run can swap the file under the interpreter and execute
# a spliced mixture of two versions. The failure is rare, silent and awful.
#
# So: pull first, then run a PRIVATE COPY that no reset can touch.
#
# Install:
#   cp automation/deploy-website-dispatcher.sh /root/.hermes/deploy-website.sh
#   chmod +x /root/.hermes/deploy-website.sh
# The crontab line does not change.
set -euo pipefail
REPO=/root/.hermes/triaperformance-docs
git -C "$REPO" fetch -q origin
git -C "$REPO" reset -q --hard origin/main
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
cp "$REPO/automation/deploy-website.sh" "$TMP"
exec bash "$TMP" "$@"
