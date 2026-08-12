#!/usr/bin/env python3
"""
Plan link checker — verifies every published plan URL in the inventory.

WHY: articles link to TrainingPeaks plans. If a plan gets unpublished or its
URL changes, the link rots silently and a buyer hits a dead page. The website
build refuses to publish a link this script has marked dead.

This replaces a hand-maintained list of "known dead" plan IDs that was copied
out of old crawl notes and turned out to be 100% wrong (July 2026): one ID was
live and buyable, the other five had already been removed from the inventory.
Ground truth comes from checking, not from notes.

RATE LIMITING: TrainingPeaks throttles aggressively — earlier crawls tripped it
at both 6 and 2 parallel workers. This is deliberately sequential with a delay.
~320 plans at 1.5s is roughly 8 minutes. Run it weekly, not on every build.

USAGE
    python3 automation/check-plan-links.py                 # check everything
    python3 automation/check-plan-links.py --limit 20      # quick smoke test
    python3 automation/check-plan-links.py --delay 3       # slower, if throttled
    python3 automation/check-plan-links.py --only-unknown  # skip already-OK plans

Writes data/plan_link_status.json, which site/_data/plans.js reads at build time.
"""

import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INVENTORY = os.path.join(REPO, "data", "training_plans_inventory.csv")

# Default output is the committed copy in the repo. On the VPS the checkout is
# reset --hard on every deploy, so a cron there must write somewhere durable:
#   PLAN_LINK_STATUS=~/.hermes/plan_link_status.json python3 automation/check-plan-links.py
# and the deploy exports the same variable so the build reads it.
STATUS = os.environ.get("PLAN_LINK_STATUS") or os.path.join(
    REPO, "data", "plan_link_status.json"
)

UA = "Mozilla/5.0 (compatible; TriaperformanceLinkCheck/1.0; +https://triaperformance.com)"


def load_inventory(include_unpublished=False):
    """Plans to check.

    THE `include_unpublished` FLAG IS THE WHOLE POINT OF THE AUDIT MODE.

    By default this function skips every row where is_published != TRUE, which
    is right for the build guard: the build only ever links to published plans,
    so checking the rest is wasted requests against a throttling host.

    But it makes this script structurally incapable of finding the error that
    has actually occurred four times in a week -- a plan flagged FALSE that is
    live and buyable on TrainingPeaks. The filter takes `is_published` as its
    INPUT, so the output can only ever confirm the TRUE set. Three of the four
    known cases (Lima, the PT triathlon siblings, both EN Ironman plans) were
    FALSE-but-live, and every one of them was found by hand.

    This is the same trap `open-loops.md` warns about in words -- "do not verify
    the inventory against a file derived from the inventory" -- sitting in code,
    where the derivation is the filter on line one. A checker that only looks
    where the flag tells it to look cannot audit the flag.
    """
    with open(INVENTORY, encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))
    plans = []
    for r in rows:
        pid = (r.get("plan_id") or "").strip()
        link = (r.get("link") or "").strip()
        if not pid or pid == "Not built":
            continue
        published = (r.get("is_published") or "").strip() == "TRUE"
        if not published and not include_unpublished:
            continue
        if not link or link == "Expired":
            continue
        plans.append({"id": pid, "url": link, "name": (r.get("plan_name") or "").strip(),
                      "published": published, "language": (r.get("language") or "").strip()})
    # de-duplicate by id, first row wins (the inventory has a few duplicate IDs)
    seen, out = set(), []
    for p in plans:
        if p["id"] in seen:
            continue
        seen.add(p["id"])
        out.append(p)
    return out


def check(url, timeout=20):
    """Return an HTTP status code, or 0 on a network-level failure."""
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--delay", type=float, default=1.5, help="seconds between requests")
    ap.add_argument("--limit", type=int, default=0, help="check only the first N plans")
    ap.add_argument("--only-unknown", action="store_true",
                    help="skip plans already recorded as ok")
    ap.add_argument("--audit", action="store_true",
                    help="check UNPUBLISHED plans too and report is_published "
                         "disagreements in both directions. Writes a separate "
                         "report and leaves plan_link_status.json untouched.")
    args = ap.parse_args()

    plans = load_inventory(include_unpublished=args.audit)
    previous = {}
    if os.path.exists(STATUS):
        with open(STATUS, encoding="utf-8") as fh:
            previous = json.load(fh).get("plans", {})

    if args.only_unknown:
        plans = [p for p in plans if previous.get(p["id"], {}).get("status") != 200]
    if args.limit:
        plans = plans[: args.limit]

    print(f"checking {len(plans)} plan URLs at {args.delay}s intervals "
          f"(~{len(plans) * args.delay / 60:.0f} min)")

    results = dict(previous)
    dead, throttled, ok, inconclusive = [], 0, 0, 0

    for i, p in enumerate(plans, 1):
        code = check(p["url"])

        # Only a definite 404/410 counts as dead. A timeout, a DNS failure, a 429
        # or a 5xx says something about the network or TrainingPeaks, not about
        # the plan — recording those as dead would block the website build on a
        # transient blip. Anything inconclusive is left as whatever we knew before.
        if code == 200:
            ok += 1
            results[p["id"]] = {
                "status": 200,
                "url": p["url"],
                "checked_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
        elif code in (404, 410):
            dead.append((p["id"], code, p["name"][:60]))
            results[p["id"]] = {
                "status": code,
                "url": p["url"],
                "checked_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
            print(f"  [{i}/{len(plans)}] {code} DEAD  {p['id']}  {p['name'][:60]}")
        elif code == 429:
            throttled += 1
            print(f"  [{i}/{len(plans)}] 429 throttled on {p['id']} — backing off 60s")
            time.sleep(60)
        else:
            inconclusive += 1
            print(f"  [{i}/{len(plans)}] {code or 'network error'} inconclusive on {p['id']} "
                  f"— leaving previous status untouched")

        if i % 25 == 0:
            print(f"  ...{i}/{len(plans)} checked ({ok} ok, {len(dead)} bad)")
        time.sleep(args.delay)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "checked": len(plans),
        "ok": ok,
        "bad": len(dead),
        "inconclusive": inconclusive,
        "plans": results,
    }

    if args.audit:
        # Deliberately a SEPARATE file. plan_link_status.json is an input to the
        # website build; an audit run covers a different population (it includes
        # unpublished plans), so writing it there would silently change what the
        # build believes it knows about. The audit reads, it does not overwrite.
        report = os.path.join(REPO, "data", "plan_publish_audit.json")
        should_be_false, should_be_true, unresolved = [], [], []
        for p in plans:
            st = results.get(p["id"], {}).get("status")
            if st == 200 and not p["published"]:
                should_be_true.append(p)
            elif st in (404, 410) and p["published"]:
                should_be_false.append(p)
            elif st not in (200, 404, 410):
                unresolved.append(p)

        with open(report, "w", encoding="utf-8") as fh:
            json.dump({
                "generated_at": payload["generated_at"],
                "note": ("HTTP 200 means the URL resolves. It is EVIDENCE that a plan is "
                         "live, not proof that it is purchasable -- TrainingPeaks may keep "
                         "a page reachable after a plan stops selling. Treat this as a "
                         "candidate list for Ivan to confirm by eye, never as an "
                         "instruction to flip the flag automatically."),
                "flagged_FALSE_but_link_is_live": [
                    {"plan_id": p["id"], "language": p["language"], "name": p["name"], "url": p["url"]}
                    for p in should_be_true],
                "flagged_TRUE_but_link_is_dead": [
                    {"plan_id": p["id"], "language": p["language"], "name": p["name"], "url": p["url"]}
                    for p in should_be_false],
                "unresolved": [{"plan_id": p["id"], "name": p["name"]} for p in unresolved],
            }, fh, indent=2, ensure_ascii=False)

        print(f"\n=== AUDIT ===")
        print(f"  flagged FALSE but the link is LIVE : {len(should_be_true)}")
        for p in should_be_true:
            print(f"      {p['id']}  {p['language'][:3]:<3} {p['name'][:66]}")
        print(f"  flagged TRUE but the link is DEAD  : {len(should_be_false)}")
        for p in should_be_false:
            print(f"      {p['id']}  {p['language'][:3]:<3} {p['name'][:66]}")
        print(f"  unresolved (throttled/timeout)     : {len(unresolved)}")
        print(f"\n  report written to {report}")
        print("  plan_link_status.json deliberately NOT modified by an audit run.")
        print("  A live URL is evidence, not proof — confirm each one in TrainingPeaks")
        print("  before changing the flag.")
        return

    with open(STATUS, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)

    print(f"\n{ok} ok · {len(dead)} dead · {inconclusive} inconclusive · {throttled} throttle events")
    if inconclusive:
        print("Inconclusive results were NOT recorded as dead — re-run with --only-unknown.")
    if dead:
        print("\nBad links — fix these in TrainingPeaks or in the inventory CSV:")
        for pid, code, name in dead:
            print(f"  {pid}  HTTP {code}  {name}")
    print(f"\nwrote {STATUS}")
    # Non-zero exit if anything is broken, so a cron wrapper can alert.
    sys.exit(1 if dead else 0)


if __name__ == "__main__":
    main()
