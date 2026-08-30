#!/usr/bin/env python3
"""
Copy `topic` from the published .njk files into content_pieces.

    python3 sync-topics.py --dry-run    show what would change
    python3 sync-topics.py              apply

WHY THIS EXISTS
`topic` lives in two places: the front matter of each article (which the site
build reads) and the `content_pieces` row (which the pipeline reads). They are
meant to be the same fact. On Aug 30, 2026 they weren't: 78 files had a topic
and 60 database rows were NULL, because the vocabulary was introduced by
back-filling the files by hand while the pipeline caught up.

That is not cosmetic. `auto_translate` copies the PARENT's topic to its
siblings, so a NULL parent quietly produces NULL siblings — an article that
publishes as a grey rectangle, unreachable from every pill, long after the
front-matter side was fixed.

DIRECTION IS DELIBERATE: files win. The .njk files are what is actually on the
site and what a human last reviewed; the database row is downstream of them.
Where the two disagree the file is taken as correct and the row is corrected —
never the reverse, so this can't overwrite a considered edit with a stale one.

Safe to re-run. It only writes rows that differ.
"""

import argparse
import glob
import os
import re
import sys

from research_agent import load_env, connect

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))

LANG_DIR = {"es": "site/blog", "en": "site/en/blog", "pt": "site/pt/blog"}


def from_files():
    """(language, slug) -> topic, read from the front matter of every article."""
    out = {}
    for lang, d in LANG_DIR.items():
        for path in sorted(glob.glob(os.path.join(REPO, d, "*.njk"))):
            if path.endswith("index.njk"):
                continue
            txt = open(path, encoding="utf-8").read()
            if not txt.startswith("---"):
                continue
            fm = txt.split("---", 2)[1]
            m = re.search(r"^topic:\s*(.+)$", fm, re.M)
            if m:
                slug = os.path.basename(path)[:-4]
                out[(lang, slug)] = m.group(1).strip().strip('"')
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    load_env()
    files = from_files()
    print(f"[topics] {len(files)} article file(s) carry a topic")
    if not files:
        sys.exit("No topics found in the .njk files — is the repo up to date? "
                 "Run `git pull` first.")

    conn = connect()
    with conn.cursor() as cur:
        cur.execute("SELECT language, slug, topic FROM content_pieces")
        rows = cur.fetchall()
    db = {(r[0], r[1]): r[2] for r in rows}
    print(f"[topics] {len(db)} row(s) in content_pieces")

    fill, fix, missing = [], [], []
    for key, topic in files.items():
        if key not in db:
            # Normal for the six hand-written articles that predate the engine.
            missing.append(key)
        elif db[key] is None:
            fill.append((key, topic))
        elif db[key] != topic:
            fix.append((key, topic, db[key]))

    print(f"[topics] {len(fill)} NULL to fill · {len(fix)} disagreeing · "
          f"{len(missing)} file(s) with no database row (expected for "
          f"hand-written articles)")
    for (lang, slug), t in fill[:60]:
        print(f"    fill  {lang} {slug} -> {t}")
    for (lang, slug), t, was in fix:
        print(f"    FIX   {lang} {slug}: {was} -> {t}   (file wins)")

    if args.dry_run:
        print("\n[topics] dry run — nothing written")
        return
    if not fill and not fix:
        print("[topics] already in sync, nothing to do")
        return

    with conn.cursor() as cur:
        for (lang, slug), t in fill:
            cur.execute("UPDATE content_pieces SET topic=%s WHERE language=%s AND slug=%s",
                        (t, lang, slug))
        for (lang, slug), t, _ in fix:
            cur.execute("UPDATE content_pieces SET topic=%s WHERE language=%s AND slug=%s",
                        (t, lang, slug))
    conn.commit()

    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM content_pieces WHERE topic IS NULL")
        left = cur.fetchone()[0]
    conn.close()
    print(f"\n[topics] updated {len(fill) + len(fix)} row(s); "
          f"{left} row(s) still NULL")
    if left:
        print("         (rows with no matching .njk — rejected or unpublished pieces)")


if __name__ == "__main__":
    main()
