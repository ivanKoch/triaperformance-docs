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
STATUS = os.path.join(REPO, "data", "plan_link_status.json")

UA = "Mozilla/5.0 (compatible; TriaperformanceLinkCheck/1.0; +https://triaperformance.com)"


def load_inventory():
    with open(INVENTORY, encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))
    plans = []
    for r in rows:
        pid = (r.get("plan_id") or "").strip()
        link = (r.get("link") or "").strip()
        if not pid or pid == "Not built":
            continue
        if (r.get("is_published") or "").strip() != "TRUE":
            continue
        if not link or link == "Expired":
            continue
        plans.append({"id": pid, "url": link, "name": (r.get("plan_name") or "").strip()})
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
    args = ap.parse_args()

    plans = load_inventory()
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
