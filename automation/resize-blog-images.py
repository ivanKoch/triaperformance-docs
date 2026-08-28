#!/usr/bin/env python3
"""
Resize photo originals into blog card images.

    _incoming/<topic>/*        ->  site/assets/images/blog/topics/<topic>-N.jpg
    _incoming/articles/<slug>* ->  site/assets/images/blog/articles/<slug>.jpg

USAGE
    python3 automation/resize-blog-images.py --dry-run    show what would happen
    python3 automation/resize-blog-images.py              do it

WHY A SCRIPT AND NOT A ONE-OFF COMMAND
There is no image pipeline on the VPS — whatever lands in the repo is what gets
served, at full size, to every visitor forever. So resizing is not a nicety, and
it has to happen the same way every time, including for the batch added six
months from now by someone who has forgotten the numbers.

WHAT IT DOES
  - fills 1400x875 (16:10) and centre-crops the overflow, biased slightly ABOVE
    centre because these are photos of people and heads sit high in the frame
  - strips EXIF — camera model, timestamps, and GPS coordinates that have no
    business being served from a public URL
  - JPEG quality 82, progressive

WHY 1400x875
The largest a card ever renders is ~700px (the lead card, spanning two of three
columns in a 1080px wrap), so 1400 covers retina and nothing beyond it. The
lead card crops to 2:1 and the rest to 16:10; `object-fit: cover` in the CSS
does that second crop, so one stored size serves both. Keep subjects roughly
centred and they survive it.

NUMBERING, AND THE ONE THING TO KNOW
Files in a topic folder become `<topic>-1.jpg`, `-2.jpg` … in sorted order, and
the blog picks one per article from a hash of the article's slug. So ADDING
photos to a topic later renumbers that pool and reshuffles which article shows
which photo. That is harmless — nobody remembers an article's photo — but if a
particular article must keep a particular image, put it in
_incoming/articles/<slug>.jpg instead, which pins it.
"""

import argparse
import os
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is not installed. Run:  pip3 install Pillow")

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
INCOMING = os.path.join(REPO, "_incoming")
OUT = os.path.join(REPO, "site", "assets", "images", "blog")

W, H = 1400, 875
QUALITY = 82
SRC_EXT = (".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".tif", ".tiff")

# Must match writer_agent.TOPICS and `topics` in site/_data/i18n.json. A folder
# named anything else is skipped loudly rather than silently producing images
# no card can ever reference.
TOPICS = ("running", "cycling", "swimming", "triathlon", "nutrition",
          "recovery", "physiology", "strength", "weight-loss")


def convert(src, dst, dry):
    if dry:
        print(f"    would write {os.path.relpath(dst, REPO)}")
        return 0
    with Image.open(src) as im:
        # EXIF orientation is applied and then dropped — a phone photo saved
        # without this is sideways in every browser.
        im = ImageOps.exif_transpose(im)
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")
        # centering=(0.5, 0.4) crops slightly above centre: in photos of people
        # the subject's head is high in the frame, and a true centre crop
        # decapitates them often enough to be worth this line.
        im = ImageOps.fit(im, (W, H), method=Image.LANCZOS, centering=(0.5, 0.4))
        im.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    kb = os.path.getsize(dst) / 1024
    print(f"    {os.path.relpath(dst, REPO)}  ({kb:.0f} KB)")
    return os.path.getsize(dst)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not os.path.isdir(INCOMING):
        sys.exit(f"No {os.path.relpath(INCOMING, REPO)}/ folder. Create it and put "
                 f"photos in subfolders named after topics:\n  " + "\n  ".join(TOPICS))

    os.makedirs(os.path.join(OUT, "topics"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "articles"), exist_ok=True)

    total_in = total_out = count = 0
    for folder in sorted(os.listdir(INCOMING)):
        src_dir = os.path.join(INCOMING, folder)
        if not os.path.isdir(src_dir):
            continue
        if folder != "articles" and folder not in TOPICS:
            print(f"  SKIPPED {folder}/ — not a topic. Valid: {', '.join(TOPICS)}",
                  file=sys.stderr)
            continue

        files = sorted(f for f in os.listdir(src_dir)
                       if f.lower().endswith(SRC_EXT))
        if not files:
            continue
        print(f"\n  {folder}/  ({len(files)} file(s))")

        for i, f in enumerate(files, 1):
            src = os.path.join(src_dir, f)
            total_in += os.path.getsize(src)
            if folder == "articles":
                # Named for the article slug, so the original filename carries
                # the meaning and is preserved rather than numbered.
                dst = os.path.join(OUT, "articles", os.path.splitext(f)[0] + ".jpg")
            else:
                # A single photo keeps the bare topic name; several get numbered.
                stem = folder if len(files) == 1 else f"{folder}-{i}"
                dst = os.path.join(OUT, "topics", stem + ".jpg")
            total_out += convert(src, dst, args.dry_run)
            count += 1

    if not count:
        sys.exit("\nNothing to do — no images found in _incoming/*/")

    print(f"\n  {count} image(s)"
          + (f"  {total_in/1e6:.1f} MB in -> {total_out/1e6:.1f} MB out"
             if not args.dry_run else "  (dry run, nothing written)"))
    if not args.dry_run:
        print("\n  Now delete the originals — _incoming/ is gitignored, but the "
              "files are still sitting on disk:\n    rm -rf _incoming")


if __name__ == "__main__":
    main()
