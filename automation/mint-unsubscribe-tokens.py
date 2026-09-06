#!/usr/bin/env python3
"""Mint one unsubscribe token per recipient for a send.

Deliberately decoupled from Twenty: it reads a plain CSV, so the same script
serves the CoachMatch backlog, the members-area announcement, the referral
asks, and whatever comes after. The list is somebody else's problem; this
script only mints, suppresses and formats.

  IN   a CSV with columns: email, lang, firstname   (lang: SPANISH|ENGLISH|PORTUGUESE)
  OUT  <prefix>-merge.csv    one row per recipient, unsubscribe_url included
       <prefix>-tokens.sql   INSERTs to run against the members DB

It does NOT send anything and does NOT talk to Postgres itself -- the SQL is
emitted for Ivan to run, same practice as everything else on this box.

  python3 mint-unsubscribe-tokens.py pt-backlog.csv --source coachmatch-pt-backlog-2026-09

Then, on the VPS:

  docker exec -i analytics-postgres psql -U analytics -d members < pt-backlog-2026-09-tokens.sql
"""
import argparse, csv, os, secrets, sys

BASE = "https://triaperformance.com/api/unsubscribe"
VALID_LANGS = {"SPANISH", "ENGLISH", "PORTUGUESE"}


def sql_quote(s):
    return "'" + str(s).replace("'", "''") + "'"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("infile", help="CSV with email, lang, firstname")
    ap.add_argument("--source", required=True,
                    help="send identifier, stored on both tables (e.g. coachmatch-pt-backlog-2026-09)")
    ap.add_argument("--prefix", help="output filename prefix (default: --source)")
    args = ap.parse_args()
    prefix = args.prefix or args.source

    with open(args.infile, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        sys.exit("no rows in input")

    seen, out, skipped = set(), [], []
    for r in rows:
        email = (r.get("email") or "").strip().lower()
        if not email or "@" not in email:
            skipped.append((r.get("email"), "not an address"))
            continue
        if email in seen:
            skipped.append((email, "duplicate in input"))
            continue
        lang = (r.get("lang") or "SPANISH").strip().upper()
        if lang not in VALID_LANGS:
            skipped.append((email, f"unknown lang {lang!r}, defaulted to SPANISH"))
            lang = "SPANISH"
        seen.add(email)
        token = secrets.token_hex(16)          # 32 hex chars
        out.append({
            "firstname": (r.get("firstname") or "").strip(),
            "email": email,
            "lang": lang,
            "token": token,
            "unsubscribe_url": f"{BASE}?t={token}",
        })

    merge_path = f"{prefix}-merge.csv"
    with open(merge_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["firstname", "email", "lang", "token", "unsubscribe_url"])
        w.writeheader()
        w.writerows(out)

    sql_path = f"{prefix}-tokens.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("BEGIN;\n")
        for r in out:
            f.write(
                "INSERT INTO unsubscribe_tokens (token, email, lang, source) VALUES ("
                f"{sql_quote(r['token'])}, {sql_quote(r['email'])}, "
                f"{sql_quote(r['lang'])}, {sql_quote(args.source)});\n")
        f.write("COMMIT;\n\n")
        f.write("-- Run this BEFORE sending, then re-check the list against\n")
        f.write("-- email_suppression: minting a token is not permission to send.\n")
        f.write("SELECT c.email\n"
                "FROM unsubscribe_tokens c\n"
                "JOIN email_suppression s ON lower(s.email) = lower(c.email)\n"
                f"WHERE c.source = {sql_quote(args.source)};\n")
        f.write("-- Any address this returns is SUPPRESSED. Remove it from the merge file.\n")

    print(f"{len(out)} recipients -> {merge_path}")
    print(f"{len(out)} inserts    -> {sql_path}")
    if skipped:
        print(f"\n{len(skipped)} row(s) skipped:")
        for e, why in skipped:
            print(f"  - {e!r}: {why}")
    print("\nNEXT: run the .sql, then run its final SELECT. If it returns any address,\n"
          "that person has unsubscribed -- take them out of the merge file before sending.")


if __name__ == "__main__":
    main()
