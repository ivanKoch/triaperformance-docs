#!/usr/bin/env bash
#
# audit-runtime-paths.sh — "what path does the runtime actually read?"
#
# Created August 12, 2026, out of the fourth confirmed instance of code living
# only on the VPS (the members-area auth service, found Aug 10 — see
# ai-infrastructure-documentation.md §13). §18 migrated the three scripts it
# knew about in July; the auth service was missed for a specific reason worth
# restating:
#
#     A REFERENCE COPY IN THE REPO IS INDISTINGUISHABLE FROM A SOURCE COPY
#     UNTIL YOU CHECK WHAT THE RUNTIME ACTUALLY LOADS.
#
# `automation/members-area/auth_service/app.py` existed in git, looked current,
# and diffed clean against the box. It was still not the source: the live
# container built from /root/.members-auth/auth_service. A rebuild would have
# compiled the OLD code, succeeded, and reported a healthy container.
#
# So this script never asks "does the file exist in the repo". It asks, of each
# runtime, which path it loads from, and whether that path is inside the clone.
#
# READ-ONLY. It runs inspect/list commands and prints findings. It changes
# nothing, so it is safe to run at any time on the live box.
#
# Usage:   bash ~/.hermes/triaperformance-docs/automation/audit-runtime-paths.sh
# Needs:   docker access (sudo if your user isn't in the docker group)
#
# RUN IT FROM A HOST SHELL. The default REPO below is the host path, where
# ~/.hermes/ is the same directory Hermes sees as /opt/data/. Inside the
# hermes-gateway container those paths differ and $HOME is /opt/data/home,
# which is NOT where the clone lives — the §18 note of August 1, 2026 records a
# dispatcher that broke on exactly that mismatch. If you do run it in the
# container, pass the path explicitly:
#     REPO=/opt/data/triaperformance-docs bash .../audit-runtime-paths.sh
#
set -uo pipefail
# NOTE: deliberately no `set -e`. This is a diagnostic — one missing tool or one
# unreadable unit file must not abort the remaining checks, which is exactly the
# failure mode that leaves a system unaudited.

REPO="${REPO:-$HOME/.hermes/triaperformance-docs}"

ok=0; bad=0; manual=0

c_ok=$'\033[32m';  c_bad=$'\033[31m';  c_man=$'\033[33m'
c_hdr=$'\033[1m';  c_off=$'\033[0m'
[ -t 1 ] || { c_ok=; c_bad=; c_man=; c_hdr=; c_off=; }

pass()   { echo "  ${c_ok}IN REPO${c_off}  $1"; ok=$((ok+1)); }
fail()   { echo "  ${c_bad}OUTSIDE${c_off}  $1"; bad=$((bad+1)); }
review() { echo "  ${c_man}CHECK  ${c_off}  $1"; manual=$((manual+1)); }
hdr()    { echo; echo "${c_hdr}=== $1 ===${c_off}"; }

# Is $1 a path inside the repo clone? Compares resolved paths so a symlinked
# route into the clone still counts — the question is what the kernel opens,
# not what the string looks like.
in_repo() {
  local p="${1:-}"
  [ -n "$p" ] || return 1
  local rp; rp="$(readlink -f "$p" 2>/dev/null || echo "$p")"
  local rr; rr="$(readlink -f "$REPO" 2>/dev/null || echo "$REPO")"
  case "$rp" in "$rr"/*|"$rr") return 0 ;; *) return 1 ;; esac
}

echo "Runtime-path audit — $(date -Is)"
echo "Repo clone: $REPO"
if [ ! -d "$REPO/.git" ]; then
  echo "${c_bad}WARNING${c_off}: $REPO is not a git clone. Set REPO=... and re-run."
fi

# ---------------------------------------------------------------------------
# 1. Containers
#
# Compose records its build context in container labels, so for anything
# compose-managed this is answerable in one command. Containers started with a
# bare `docker run` (tp-admin is one) record NO source path at all — the image
# is a black box with respect to where its code came from. Those cannot be
# verified automatically and are reported as CHECK rather than quietly passed.
# ---------------------------------------------------------------------------
hdr "1. Docker containers"
if ! command -v docker >/dev/null 2>&1; then
  review "docker not on PATH — skipped. Re-run where docker lives, or with sudo."
else
  # Process substitution, not a pipe. A piped `while` runs in a SUBSHELL, so the
  # pass/fail counters increment in a copy of the shell and are discarded when it
  # exits — the audit would report "outside: 0" no matter what it found, which is
  # the worst possible failure mode for a script whose whole job is to find
  # things. Caught on the first smoke run. Same reason for the three loops below.
  while read -r name; do
    [ -n "$name" ] || continue
    wdir=$(docker inspect "$name" --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>/dev/null)
    bctx=$(docker inspect "$name" --format '{{index .Config.Labels "com.docker.compose.service.build.context"}}' 2>/dev/null)
    cfgf=$(docker inspect "$name" --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}' 2>/dev/null)
    src="${bctx:-${wdir:-$cfgf}}"

    if [ -n "$src" ] && [ "$src" != "<no value>" ]; then
      if in_repo "$src"; then pass "container $name -> $src"
      else fail "container $name -> $src   (compose builds from outside the clone)"; fi
    else
      # No compose labels. Bind mounts are the other way live code gets in.
      mounts=$(docker inspect "$name" --format '{{range .Mounts}}{{if eq .Type "bind"}}{{.Source}} {{end}}{{end}}' 2>/dev/null)
      if [ -n "${mounts// /}" ]; then
        for m in $mounts; do
          if in_repo "$m"; then pass "container $name bind-mounts $m"
          else fail "container $name bind-mounts $m   (live code from outside the clone)"; fi
        done
      else
        review "container $name — no compose labels, no bind mounts. Built by a bare \`docker build\`, so its source path is NOT recorded anywhere. Find the Dockerfile you built from by hand and confirm it sits in the clone."
      fi
    fi
  done < <(docker ps -a --format '{{.Names}}' 2>/dev/null)
fi

# ---------------------------------------------------------------------------
# 2. Cron
#
# A crontab line names its script directly, so the audit is textual. Two shapes
# are correct per §18: (a) the line points into the clone and is prefixed with
# `git pull`; (b) the line points at a fixed path the caller controls, and the
# file there is a dispatcher that pulls and delegates — checked in section 3.
# ---------------------------------------------------------------------------
hdr "2. Cron jobs (current user + root)"
scan_cron() {
  local who="$1" lines="$2"
  while read -r line; do
    case "$line" in ''|MAILTO=*|PATH=*|SHELL=*) continue ;; esac
    if echo "$line" | grep -q "$REPO"; then
      if echo "$line" | grep -q 'git pull'; then
        pass "cron($who): $line"
      else
        review "cron($who): points into the clone but does NOT \`git pull\` first — it will run whatever revision the box last happened to fetch: $line"
      fi
    else
      review "cron($who): does not reference the clone — confirm the target is a dispatcher: $line"
    fi
  done < <(echo "$lines" | grep -v '^\s*#' | grep -v '^\s*$')
}
scan_cron "user" "$(crontab -l 2>/dev/null)"
scan_cron "root" "$(sudo crontab -l 2>/dev/null)"

# ---------------------------------------------------------------------------
# 3. Fixed-path scripts (Hermes jobs and friends)
#
# These are invoked by a filename the caller owns and we cannot change, so the
# file at that path is SUPPOSED to be a ~6-line dispatcher. A real
# implementation sitting here is the §18 bug. Length is the crude tell; the
# `git pull` + delegation check is the real one.
# ---------------------------------------------------------------------------
hdr "3. Fixed-path scripts (~/.hermes/scripts and similar)"
for d in "$HOME/.hermes/scripts" "$HOME/.analytics" "$HOME/.members-auth" /root/.hermes/scripts /root/.members-auth; do
  [ -d "$d" ] || continue
  while read -r f; do
    [ -n "$f" ] || continue
    in_repo "$f" && { pass "script $f (inside the clone)"; continue; }
    # Dispatcher detection, deliberately not a literal search for "git pull".
    # The real dispatchers call it through subprocess as ["git", "pull", "-q"],
    # which contains no such substring — a first pass looking for the literal
    # string flagged a known-good dispatcher as an orphan. Two independent
    # signals are required instead: it invokes git-pull in some form, AND it
    # names the clone it delegates into. A file doing both is a dispatcher
    # whatever language it is written in; a file doing only one is not.
    if grep -qE 'git.{0,20}pull' "$f" 2>/dev/null && grep -qF "$REPO" "$f" 2>/dev/null; then
      pass "dispatcher $f -> pulls and delegates into the clone"
    else
      n=$(wc -l < "$f" 2>/dev/null || echo '?')
      fail "script $f ($n lines) — outside the clone and not a dispatcher. This is the §18 pattern: version history for this file does not exist."
    fi
    # -L follows symlinks. Without it a fixed path that is a symlink INTO the
    # clone -- a legitimate and tidy arrangement -- is skipped entirely by
    # `-type f` and silently never audited. Silently-not-audited is the one
    # outcome this script exists to prevent.
  done < <(find -L "$d" -maxdepth 2 -type f \( -name '*.py' -o -name '*.sh' \) 2>/dev/null)
done

# ---------------------------------------------------------------------------
# 4. systemd units
# ---------------------------------------------------------------------------
hdr "4. systemd services (ExecStart targets)"
if command -v systemctl >/dev/null 2>&1; then
  while read -r unit; do
    [ -n "$unit" ] || continue
    exec_line=$(systemctl show "$unit" -p ExecStart --value 2>/dev/null)
    target=$(echo "$exec_line" | grep -oE '(/[^ ;{}]+)' | head -1)
    case "$target" in
      /usr/*|/bin/*|/sbin/*|/lib/*|'') continue ;;   # distro-managed, not ours
    esac
    if in_repo "$target"; then pass "systemd $unit -> $target"
    else review "systemd $unit -> $target — confirm this is packaged software, not our code"; fi
  done < <(systemctl list-units --type=service --state=running --no-legend --no-pager 2>/dev/null | awk '{print $1}')
else
  review "systemctl not available — skipped."
fi

hdr "Summary"
echo "  in repo : $ok"
echo "  outside : $bad     <- each of these is a file with no version history"
echo "  to check: $manual"
echo
echo "Anything marked OUTSIDE is the same class of problem as the auth service."
echo "The fix is always one of the two §18 shapes: move the source into the clone"
echo "and point the runtime at it, or leave the fixed path in place and replace"
echo "the file there with a dispatcher that pulls and delegates."
echo
echo "Record what you find in ai-infrastructure-documentation.md §18 as a dated"
echo "note — including the things that came back clean, so the next audit knows"
echo "what was already looked at."
