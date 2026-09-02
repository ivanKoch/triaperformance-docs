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

# Other absolute paths that ARE the same clone seen from somewhere else.
#
# Added after the first real run (Aug 12, 2026) reported both Hermes dispatchers
# as orphans. They were correct: the §18 note of August 1 records that Hermes
# runs in Docker with the host's ~/.hermes mounted as /opt/data, so a dispatcher
# MUST reference /opt/data/triaperformance-docs to work at run time. A string
# comparison against the host path calls that a bug. It is the opposite of a bug.
#
# The lesson is the same one this whole script is about, turned on itself: the
# path a runtime uses is not always the path you type.
REPO_ALIASES="${REPO_ALIASES:-/opt/data/triaperformance-docs}"

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
  # Expand a leading ~ before comparing. Cron lines are written with tildes far
  # more often than not, and the first real run flagged a perfectly correct
  # `cd ~/.hermes/triaperformance-docs && git pull` line as suspect purely
  # because "~" is not "/root".
  case "$p" in "~/"*) p="$HOME/${p#\~/}" ;; esac
  local rp; rp="$(readlink -f "$p" 2>/dev/null || echo "$p")"
  local rr; rr="$(readlink -f "$REPO" 2>/dev/null || echo "$REPO")"
  case "$rp" in "$rr"/*|"$rr") return 0 ;; esac
  local a
  for a in $REPO_ALIASES; do
    case "$rp" in "$a"/*|"$a") return 0 ;; esac
  done
  return 1
}

# Does this text reference the clone by ANY of its names? Used for cron lines and
# dispatcher bodies, where we have a string rather than a path to resolve.
mentions_repo() {
  local s="${1:-}" a
  case "$s" in *"$REPO"*) return 0 ;; esac
  case "$s" in *"~/${REPO#$HOME/}"*) return 0 ;; esac
  for a in $REPO_ALIASES; do
    case "$s" in *"$a"*) return 0 ;; esac
  done
  return 1
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
      if in_repo "$src"; then
        pass "container $name -> $src"
      elif [ -n "$bctx" ] && [ "$bctx" != "<no value>" ]; then
        # A real build context outside the clone. This one is unambiguous.
        fail "container $name build context $bctx   (compose builds from outside the clone)"
      else
        # ONLY working_dir was available -- that is where the compose FILE lives,
        # which is NOT the same question as where the image is built from.
        # The members-area compose file deliberately sits outside git because it
        # holds the DB password, while its `build:` context points into the clone
        # (fixed Aug 10, 2026). Reporting that as OUTSIDE, as the first version of
        # this script did, says a fixed thing is broken -- the most expensive kind
        # of false positive, because it invites re-fixing something correct.
        review "container $name — compose file at $src, build context NOT recorded in labels. Where the compose file lives is not where the image is built from. Settle it by reading the file:
             grep -n -A4 -E 'build:|image:' $src/docker-compose.y*ml"
      fi
    else
      # No compose labels. Bind mounts are the other way live code gets in --
      # but MOST bind mounts are data, not code (a database's data directory, an
      # app's state dir), and third-party containers legitimately live outside
      # the clone entirely. The first run flagged the Postgres data volume as
      # "live code from outside the clone", which is nonsense and buried the two
      # findings that mattered under fourteen that didn't. Report, don't judge.
      mounts=$(docker inspect "$name" --format '{{range .Mounts}}{{if eq .Type "bind"}}{{.Source}}:{{.Destination}} {{end}}{{end}}' 2>/dev/null)
      if [ -n "${mounts// /}" ]; then
        for m in $mounts; do
          msrc="${m%%:*}"
          if in_repo "$msrc"; then pass "container $name bind-mounts $m"
          else review "container $name bind-mounts $m — data or third-party state is expected here and is fine. Only a concern if OUR source lives at $msrc."; fi
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
    if mentions_repo "$line"; then
      if echo "$line" | grep -q 'git pull'; then
        pass "cron($who): $line"
      else
        review "cron($who): points into the clone but does NOT \`git pull\` first — it will run whatever revision the box last happened to fetch: $line"
      fi
    else
      review "cron($who): does not reference the clone — confirm the target is a dispatcher, or that it is packaged software: $line"
    fi
  done < <(echo "$lines" | grep -v '^\s*#' | grep -v '^\s*$')
}
user_cron="$(crontab -l 2>/dev/null)"
root_cron="$(sudo crontab -l 2>/dev/null)"
scan_cron "user" "$user_cron"
# Running as root makes these the same crontab, and reporting it twice doubles
# every count in the summary — which is how the first run turned 8 real cron
# lines into 16 findings. Compare before scanning.
if [ "$root_cron" != "$user_cron" ]; then
  scan_cron "root" "$root_cron"
elif [ -n "$root_cron" ]; then
  echo "  (root crontab is identical to the user crontab — you are root. Not re-scanned.)"
fi

# ---------------------------------------------------------------------------
# 3. Fixed-path scripts (Hermes jobs and friends)
#
# These are invoked by a filename the caller owns and we cannot change, so the
# file at that path is SUPPOSED to be a ~6-line dispatcher. A real
# implementation sitting here is the §18 bug. Length is the crude tell; the
# `git pull` + delegation check is the real one.
# ---------------------------------------------------------------------------
hdr "3. Fixed-path scripts (~/.hermes/scripts and similar)"
# Deduplicated: when $HOME is /root these lists collide and every finding is
# printed twice. `~/.hermes` itself is included (not just ~/.hermes/scripts)
# because the first run found `deploy-website.sh` invoked from there by cron and
# never scanned, since the old list only reached one directory deeper.
# Collect first, dedupe, THEN judge. Deduping the directory list is not enough:
# `~/.hermes` and `~/.hermes/scripts` are both scanned deliberately, and with
# -maxdepth 2 they overlap, so every dispatcher was still reported twice. The
# unit that must be unique is the resolved FILE, not the directory it was
# reached through. `~/.hermes` itself is in the list because the first real run
# found `deploy-website.sh` invoked from there by cron and never scanned at all.
scan_dirs=""
for d in "$HOME/.hermes" "$HOME/.hermes/scripts" "$HOME/.analytics" "$HOME/.analytics/scripts" \
         "$HOME/.members-auth" /root/.hermes /root/.hermes/scripts /root/.analytics /root/.members-auth; do
  [ -d "$d" ] && scan_dirs="$scan_dirs $d"
done
if [ -n "${scan_dirs// /}" ]; then
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
    if grep -qE 'git.{0,20}pull' "$f" 2>/dev/null && mentions_repo "$(cat "$f" 2>/dev/null)"; then
      pass "dispatcher $f -> pulls and delegates into the clone"
    else
      n=$(wc -l < "$f" 2>/dev/null || echo '?')
      fail "script $f ($n lines) — outside the clone and not a dispatcher. This is the §18 pattern: version history for this file does not exist."
    fi
    # -L follows symlinks. Without it a fixed path that is a symlink INTO the
    # clone -- a legitimate and tidy arrangement -- is skipped entirely by
    # `-type f` and silently never audited. Silently-not-audited is the one
    # outcome this script exists to prevent.
  done < <(find -L $scan_dirs -maxdepth 2 -type f \( -name '*.py' -o -name '*.sh' \) -print0 2>/dev/null \
             | xargs -0 -r readlink -f 2>/dev/null | sort -u \
             | grep -Ev '/(lazy-packages|site-packages|dist-packages|node_modules|venv|\.venv)/')
    # Vendored third-party code is not OUR source and reporting it as OUTSIDE is
    # noise that trains the reader to skim. Added Sep 2, 2026 after the first
    # real run flagged /root/.hermes/lazy-packages/typing_extensions.py -- 4,317
    # lines of upstream stdlib backport -- alongside three genuine findings.
    # A diagnostic that cries wolf is the same failure as one that under-reports,
    # arriving from the other side.
fi

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
