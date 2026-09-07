#!/usr/bin/env python3
"""
Research agent — Agent 1 of the content engine.

Reads the source blogs, cross-references what they're covering against what
Triaperformance uniquely has, and writes scored article ideas into Postgres for
batch review. It writes ideas. It does not write articles, and it never publishes.

THE POINT, restated because it's easy to lose:
    The sources are for TIMING and GAPS, not for topics to copy. Writing about
    a topic because TrainingPeaks wrote about it means competing with
    TrainingPeaks on their own ground with a fraction of their authority.
    Every idea this agent proposes must name something WE have that they don't:
    a plan in the catalog, a section of the methodology doc, a members-area
    artifact, a real athlete case, or 12 months of plan-view data.
    An idea with an empty `our_assets` is an idea anyone could write.

Article types and CTAs are decided HERE, at the idea stage, not after drafting —
a gated teaser is written differently from a plan guide from its first sentence.

USAGE
    python3 research_agent.py --check-sources     verify feeds, write nothing
    python3 research_agent.py --crawl-only        fetch sources, no idea generation
    python3 research_agent.py --dry-run           generate ideas, print, don't save
    python3 research_agent.py                     full run (intended for cron)

ENVIRONMENT (read from ~/.hermes/.env and ~/.analytics/.env automatically)
    PG_HOST/PG_PORT/PG_USER/PG_PASSWORD   Postgres, connected with keyword
                        parameters rather than a postgres:// URI — the password
                        contains characters a URI cannot carry safely.
    GOOGLE_API_KEY      Gemini key, already on the box for Hermes
    IDEA_NOTIFY_WEBHOOK n8n webhook that sends the "ideas ready" email
    CONTENT_MODEL       optional, defaults to gemini-3.8-flash
                        (gemini-3.5-flash until August 17, 2026, then
                        gemini-3.7-flash until September 4, 2026. The 3.5 → 3.7
                        move was paid for by price; 3.7 → 3.8 is NOT — the two
                        are priced identically on both sides. It was made on
                        3.8's agentic benchmarks, which is the axis this agent
                        and Hermes actually run on. §33.)
"""

import argparse
import collections
import glob
import html.entities
import json
import math
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
SOURCES_FILE = os.path.join(HERE, "sources.json")

UA = "Mozilla/5.0 (compatible; TriaperformanceResearch/1.0; +https://triaperformance.com)"

# Feed paths worth trying before falling back to scraping the index page.
FEED_CANDIDATES = ["feed/", "rss/", "rss.xml", "feed.xml", "atom.xml", "index.xml"]


# ---------------------------------------------------------------------------
# Environment
#
# Secrets already exist on this box in ~/.hermes/.env and ~/.analytics/.env.
# Reading them here means nobody has to retype a key into a shell — which is
# both a security improvement (no secrets in shell history) and how the first
# run actually failed: a placeholder string got exported verbatim as the API key.
# Values already set in the environment always win.
# ---------------------------------------------------------------------------
ENV_FILES = [os.path.expanduser("~/.hermes/.env"), os.path.expanduser("~/.analytics/.env")]

GEMINI_KEY_NAMES = ["GOOGLE_API_KEY", "GEMINI_API_KEY", "GOOGLE_GENAI_API_KEY",
                    "GOOGLE_AI_API_KEY"]
# The analytics stack uses PG_* names (confirmed from the real ~/.analytics/.env,
# July 2026). The others are fallbacks in case that ever changes.
PG_PASS_NAMES = ["PG_PASSWORD", "ANALYTICS_DB_PASSWORD", "POSTGRES_PASSWORD",
                 "PGPASSWORD", "DB_PASSWORD"]


def read_env_files():
    """Parse KEY=VALUE out of the known .env files. Returns {name: value}.

    Two precedence rules, and they differ on purpose:

      WITHIN a file, the LAST occurrence wins — standard .env behaviour, and the
      only sane reading of a file edited with `echo VAR=x >> .env`. The first
      version of this used setdefault throughout, so appending a corrected value
      did nothing and the stale line kept winning silently. That cost a debugging
      round trip on a config change that had, in fact, been made correctly.

      ACROSS files, the FIRST file wins — ~/.hermes/.env is the primary store and
      shouldn't be overridden by whatever ~/.analytics/.env happens to define.
    """
    found = {}
    for path in ENV_FILES:
        if not os.path.exists(path):
            continue
        this_file = {}
        with open(path, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                this_file[k.strip()] = v.strip().strip("\"'")   # last wins in-file
        for k, v in this_file.items():
            found.setdefault(k, v)                                # first file wins
    return found


def load_env(verbose=True):
    env = read_env_files()

    if not os.environ.get("GOOGLE_API_KEY"):
        for name in GEMINI_KEY_NAMES:
            if env.get(name):
                os.environ["GOOGLE_API_KEY"] = env[name]
                if verbose:
                    print(f"[env] model key loaded from {name}")
                break

    # Postgres connection is assembled from discrete PG_* values at connect()
    # time — see the note there on why a URI is not used. This only reports.
    if verbose and not os.environ.get("CONTENT_DB_DSN"):
        for name in PG_PASS_NAMES:
            if env.get(name):
                print(f"[env] postgres password available as {name} "
                      f"(user={env.get('PG_USER', 'analytics')} "
                      f"host={env.get('PG_HOST', '127.0.0.1')} db=content)")
                break
    if not os.environ.get("IDEA_NOTIFY_WEBHOOK") and env.get("IDEA_NOTIFY_WEBHOOK"):
        os.environ["IDEA_NOTIFY_WEBHOOK"] = env["IDEA_NOTIFY_WEBHOOK"]


def list_models(api_key):
    """Ask the API which models this key can actually use.

    Model names change and vary by key. Guessing one produces a bare HTTP 404
    with no hint about what went wrong — which is exactly how the writer agent
    first failed, on a model name that was invented rather than looked up.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    with urllib.request.urlopen(url, timeout=30) as r:
        data = json.loads(r.read().decode("utf-8"))
    rows = []
    for m in data.get("models", []):
        if "generateContent" not in m.get("supportedGenerationMethods", []):
            continue
        rows.append((m["name"].replace("models/", ""),
                     m.get("inputTokenLimit", "?"), m.get("outputTokenLimit", "?"),
                     m.get("displayName", "")))
    rows.sort()
    print(f"{len(rows)} models on this key support generateContent:\n")
    print(f"  {'name':42s} {'in':>9} {'out':>7}  display")
    for n, i, o, d in rows:
        print(f"  {n:42s} {i:>9} {o:>7}  {d[:34]}")
    print("\nPick one for writing (prefer a 'pro' tier over 'flash') and set it:")
    print("  export WRITER_MODEL=<name>          # or add WRITER_MODEL=<name> to ~/.hermes/.env")


# Models that exist but can't do prose: image, speech, music, robotics, embedding.
NON_TEXT = ("image", "tts", "robotics", "lyria", "banana", "embedding",
            "computer-use", "veo", "imagen")


def test_models(api_key, only=None):
    """Actually CALL each candidate model with a trivial prompt.

    --list-models is not enough: the listing endpoint reports models the key can
    SEE, not ones it can USE. gemini-2.5-pro appeared there and then returned
    "no longer available to new users" on the first real call. The only reliable
    test of whether a model works is to use it, so that is what this does —
    a five-token prompt each, which costs almost nothing and settles it.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    with urllib.request.urlopen(url, timeout=30) as r:
        listed = json.loads(r.read().decode("utf-8")).get("models", [])

    cands = []
    for m in listed:
        name = m["name"].replace("models/", "")
        if "generateContent" not in m.get("supportedGenerationMethods", []):
            continue
        if any(x in name.lower() for x in NON_TEXT):
            continue
        if only and only not in name:
            continue
        cands.append((name, m.get("outputTokenLimit", 0)))
    cands.sort()

    print(f"calling {len(cands)} text models with a trivial prompt...\n")
    ok, bad = [], []
    payload = {"contents": [{"parts": [{"text": "Reply with the single word: ok"}]}],
               "generationConfig": {"maxOutputTokens": 2048}}
    for name, outlim in cands:
        u = (f"https://generativelanguage.googleapis.com/v1beta/models/"
             f"{name}:generateContent?key={api_key}")
        req = urllib.request.Request(u, data=json.dumps(payload).encode(),
                                     headers={"Content-Type": "application/json"},
                                     method="POST")
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                json.loads(r.read().decode("utf-8"))
            ok.append((name, outlim))
            print(f"  WORKS   {name:38s} out={outlim}")
        except urllib.error.HTTPError as e:
            try:
                msg = json.loads(e.read().decode())["error"]["message"][:80]
            except Exception:
                msg = f"HTTP {e.code}"
            bad.append((name, msg))
            print(f"  no      {name:38s} {msg}")
        except Exception as e:
            bad.append((name, str(e)[:70]))
            print(f"  no      {name:38s} {e}")
        time.sleep(0.4)

    print(f"\n{len(ok)} usable, {len(bad)} unavailable.")
    # Variant suffixes are specialised builds, not better general models —
    # "-customtools" is tuned for custom tool-calling and is the wrong choice for
    # prose. Sorting alphabetically and taking the last entry recommended exactly
    # that, which is why this filters rather than sorts.
    VARIANTS = ("-customtools", "-thinking", "-tuning", "-8b", "-002", "-001")
    pro = [n for n, _ in ok
           if "pro" in n and "latest" not in n
           and not any(n.endswith(v) for v in VARIANTS)]
    flash = [n for n, _ in ok
             if "flash" in n and "lite" not in n and "latest" not in n
             and not any(n.endswith(v) for v in VARIANTS)]

    def newest(names):
        """Highest version number wins — not alphabetical order."""
        def ver(n):
            m = re.search(r"gemini-(\d+)(?:\.(\d+))?", n)
            return (int(m.group(1)), int(m.group(2) or 0)) if m else (0, 0)
        return sorted(names, key=ver)

    # Rewritten August 17, 2026. This block used to print
    #     "Suggested: WRITER_MODEL=<newest pro>"
    # and list flash only as something "worth comparing against". That encoded
    # "pro tier beats flash tier" as a rule, and the rule broke: Google shipped
    # 3.6 and 3.7 on the flash line and left pro at 3.1, so on this key the
    # highest-version usable model is gemini-3.7-flash while the newest pro is
    # gemini-3.1-pro-preview — and Google's own migration guide names 3.7-flash
    # the successor to 3.1-pro-preview. The old code recommended the OLDER model
    # with more confidence than it recommended the newer one.
    #
    # It now reports version order across both tiers and names no winner. A
    # helper that cannot know which model writes better Spanish should not be
    # the thing that decides. See ai-infrastructure-documentation.md §33.
    if pro:
        print("\nUsable pro-tier (oldest to newest):")
        for n in newest(pro):
            print(f"  {n}")
    if flash:
        print("\nUsable flash-tier (oldest to newest):")
        for n in newest(flash):
            print(f"  {n}")

    # A filtered run knows nothing about the models it did not call. Everything
    # below reads as a statement about the KEY ("highest version usable on this
    # key", "no pro model is callable"), and with --only it is computed from a
    # sample the caller chose. Found September 4, 2026, from a real
    # `--test-models --only 3.8` run that printed "No pro model is callable on
    # this key" after calling exactly one flash model.
    #
    # Fourth instance of the pattern this repo keeps rediscovering —
    # check-plan-links.py testing liveness and reading as correctness,
    # audit-runtime-paths.sh reporting outside:0 regardless, and this same
    # function's own August 17 wrong-model recommendation. In all four a tool
    # answered a narrower question than its output appeared to answer.
    #
    # The fix is the August 17 fix again: refuse the claim rather than qualify
    # it. Under --only the summary states its scope and asserts nothing about
    # the key.
    if only:
        print("\n--- scope: --only %r. %d model(s) called. ---" % (only, len(cands)))
        print("This run says NOTHING about models it did not call: not which")
        print("version is highest on this key, not whether a pro model answers.")
        print("Re-run without --only for a statement about the key.")
        return

    both = newest(pro + flash)
    if both:
        top = both[-1]
        tier = "pro" if top in pro else "flash"
        print(f"\nHighest version number usable on this key: {top}  ({tier}-tier)")
        print("\nThat is a version number, NOT a recommendation. Tier no longer "
              "tracks capability — check Google's current model page before "
              "assuming pro beats flash, and settle prose quality by drafting "
              "the same idea both ways and reading them:")
        print("    python3 writer_agent.py --dry-run")
        print(f"    WRITER_MODEL={top} python3 writer_agent.py --dry-run")
        print("\nTo make a choice stick:")
        print(f"    echo 'WRITER_MODEL={top}' >> ~/.hermes/.env")
        print("  ...and check it is not already set there — a duplicate line is "
              "a silent last-writer-wins bug, and .env overrides the built-in "
              "default entirely:")
        print("    grep -n 'WRITER_MODEL\\|CONTENT_MODEL' ~/.hermes/.env ~/.analytics/.env")
    if not pro:
        print("\nNo pro model is callable on this key.")


def show_env():
    """Report which variable NAMES exist. Never prints a value."""
    env = read_env_files()
    print("Variables found in ~/.hermes/.env and ~/.analytics/.env (names only):")
    for k in sorted(env):
        print(f"  {k}")
    print()
    for label, names in (("model key", GEMINI_KEY_NAMES), ("postgres password", PG_PASS_NAMES)):
        hit = next((n for n in names if env.get(n)), None)
        print(f"  {label}: {'found as ' + hit if hit else 'NOT FOUND — looked for ' + ', '.join(names)}")


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------
def fetch(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="replace"), r.headers.get("Content-Type", "")


def looks_like_feed(body, ctype):
    if "xml" in (ctype or "").lower():
        return True
    head = body.lstrip()[:400].lower()
    return head.startswith("<?xml") or "<rss" in head or "<feed" in head


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------
def sanitize_xml(body):
    """Replace HTML entities XML doesn't know about with numeric references.

    Squarespace and some WordPress feeds emit things like &nbsp; or &mdash;,
    which are valid HTML but undefined in XML — the parser dies with
    "undefined entity". High North's feed failed at line 3361 for exactly this.
    """
    def repl(m):
        name = m.group(1)
        if name in ("amp", "lt", "gt", "apos", "quot"):
            return m.group(0)
        ch = html.entities.html5.get(name + ";")
        if ch and len(ch) == 1:
            return f"&#{ord(ch)};"
        return ""  # unknown entity: drop it rather than fail the whole feed
    return re.sub(r"&([A-Za-z][A-Za-z0-9]*);", repl, body)


def parse_feed(body):
    """RSS or Atom -> [{url, title, summary, published_at}]"""
    out = []
    root = ET.fromstring(sanitize_xml(body).encode("utf-8"))
    ns = {"atom": "http://www.w3.org/2005/Atom"}

    for item in root.iter():
        tag = item.tag.split("}")[-1]
        if tag not in ("item", "entry"):
            continue
        get = lambda n: (item.find(n) if item.find(n) is not None else item.find(f"atom:{n}", ns))
        title_el, link_el = get("title"), get("link")
        title = (title_el.text or "").strip() if title_el is not None else ""
        if link_el is not None:
            link = (link_el.text or "").strip() or link_el.attrib.get("href", "")
        else:
            link = ""
        if not link:
            # Podcast feeds routinely omit <link> on items — Megaphone (Fast Talk,
            # Endurance Unlimited) emits none at all, so the old `if title and link`
            # guard below silently dropped EVERY episode and the source reported
            # zero posts with no error. Fall back to the guid when it is a real
            # permalink, then to the audio enclosure, which is at least a stable
            # per-episode URL the evidence check can key on.
            guid_el = get("guid")
            if (guid_el is not None and (guid_el.text or "").strip().startswith("http")
                    and guid_el.attrib.get("isPermaLink") != "false"):
                link = guid_el.text.strip()
        if not link:
            enc = item.find("enclosure")
            if enc is not None and enc.attrib.get("url", "").startswith("http"):
                link = enc.attrib["url"]
        desc = ""
        for cand in ("description", "summary", "content"):
            el = get(cand)
            if el is not None and el.text:
                desc = re.sub(r"<[^>]+>", " ", el.text)
                desc = re.sub(r"\s+", " ", desc).strip()[:600]
                break
        pub = ""
        for cand in ("pubDate", "published", "updated"):
            el = get(cand)
            if el is not None and el.text:
                pub = el.text.strip()
                break
        if title and link:
            out.append({"url": link, "title": title, "summary": desc, "published_raw": pub})
    return out


def parse_html_index(body, base_url, debug=False, min_text=18):
    """Crude fallback: pull article links + their anchor text off a blog index."""
    seen, out, rejected = set(), [], []
    for m in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', body, re.S | re.I):
        href, text = m.group(1), re.sub(r"<[^>]+>", " ", m.group(2))
        text = re.sub(r"\s+", " ", text).strip()
        if not text or len(text) < min_text:
            rejected.append(("short text", text[:40]))
            continue
        if href.startswith("/"):
            href = base_url.rstrip("/").split("/")[0] + "//" + base_url.split("/")[2] + href
        if not href.startswith("http"):
            continue
        # Heuristic: article URLs are deep, category/tag pages aren't.
        if any(x in href for x in ("/category/", "/tag/", "/author/", "/page/", "#")):
            continue
        if href in seen:
            continue
        seen.add(href)
        out.append({"url": href, "title": text[:300], "summary": "", "published_raw": ""})
    if debug:
        print(f"    [debug] matched {len(out)} links, rejected {len(rejected)}")
        for r in rejected[:15]:
            print(f"      rejected ({r[0]}): {r[1]}")
        for o in out[:10]:
            print(f"      kept: {o['title'][:70]}")
    return out


def parse_date(raw):
    if not raw:
        return None
    for fmt in ("%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S %Z",
                "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
        try:
            d = datetime.strptime(raw.strip(), fmt)
            return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


# ---------------------------------------------------------------------------
# Source discovery
# ---------------------------------------------------------------------------
def discover(source, delay=2.0, debug=False):
    """Return (mode, feed_url, posts, error).

    Every failure path falls through to the next strategy. The first version
    returned immediately when a configured feed errored, which meant one 403 or
    one malformed entity took the whole source out — TrainRight and High North
    both died that way on the first real run despite having usable HTML pages.
    """
    site = source["site_url"]
    notes = []

    if source.get("feed_url"):
        try:
            body, ctype = fetch(source["feed_url"])
            if looks_like_feed(body, ctype):
                posts = parse_feed(body)
                if posts:
                    return "feed", source["feed_url"], posts, None
                notes.append("configured feed parsed but was empty")
            else:
                notes.append("configured feed URL did not return XML")
        except Exception as e:
            notes.append(f"configured feed failed ({e}) — falling back")

    if source.get("fetch_mode") in ("auto", "feed", None):
        for cand in FEED_CANDIDATES:
            url = site.rstrip("/") + "/" + cand
            try:
                body, ctype = fetch(url)
            except Exception:
                time.sleep(delay)
                continue
            if looks_like_feed(body, ctype):
                try:
                    posts = parse_feed(body)
                except ET.ParseError as e:
                    time.sleep(delay)
                    continue
                if posts:
                    return "feed", url, posts, None
            time.sleep(delay)

    try:
        body, _ = fetch(site)
        posts = parse_html_index(body, site, debug=debug)
        note = "; ".join(notes) or None
        if posts:
            return "html", None, posts, note
        return "html", None, [], "; ".join(notes + ["index fetched but no article links matched"])
    except Exception as e:
        return "none", None, [], "; ".join(notes + [str(e)])


# ---------------------------------------------------------------------------
# Our own assets — the half of the equation the sources don't have
# ---------------------------------------------------------------------------
def load_our_assets():
    """Summarise what we can write from that a generic endurance blog cannot."""
    import csv

    assets = {"plans_by_topic": {}, "members_artifacts": [], "methodology_sections": [],
              "races": [],
              "lead_magnets": ["zonas-de-entrenamiento", "pre-entreno", "intervalos"]}

    inv = os.path.join(REPO, "data", "training_plans_inventory.csv")
    if os.path.exists(inv):
        with open(inv, encoding="utf-8-sig", newline="") as fh:
            for r in csv.DictReader(fh):
                if r.get("is_published", "").strip() != "TRUE":
                    continue
                key = f"{r.get('sport','').strip()} / {r.get('distance','').strip()}"
                b = assets["plans_by_topic"].setdefault(key, {"es": 0, "en": 0, "pt": 0, "ids": []})
                lang = {"Spanish": "es", "English": "en", "Portuguese": "pt"}.get(
                    r.get("language", "").strip())
                if lang:
                    b[lang] += 1
                if len(b["ids"]) < 5:
                    b["ids"].append(r.get("plan_id", "").strip())

    # site/ is the Eleventy source and the durable location. website/ is the old
    # hand-written tree, still present but scheduled for deletion at cutover —
    # checking site/ first means this keeps working after that happens.
    for candidate in (os.path.join(REPO, "site", "members"),
                      os.path.join(REPO, "website", "members")):
        if os.path.isdir(candidate):
            assets["members_artifacts"] = sorted(
                d for d in os.listdir(candidate)
                if os.path.isdir(os.path.join(candidate, d))
                and d not in ("login", "forgot-password")
            )
            break

    # Races. Each row already carries researched target queries per language and
    # the plan durations available for it — the single highest-intent content
    # angle in the repo, because a race-specific guide meets a reader who has
    # already chosen a date and is looking for exactly one thing.
    races_csv = os.path.join(REPO, "data", "races.csv")
    if os.path.exists(races_csv):
        with open(races_csv, encoding="utf-8-sig", newline="") as fh:
            for r in csv.DictReader(fh):
                name = (r.get("race_name_es") or r.get("race_name_en")
                        or r.get("race_name_pt") or "").strip()
                if not name:
                    continue
                assets["races"].append({
                    "race": name,
                    "country": (r.get("country") or "").strip(),
                    "distance": (r.get("distance") or "").strip(),
                    "market": (r.get("language_market") or "").strip(),
                    "month": (r.get("typical_month") or "").strip(),
                    "plan_weeks": (r.get("plan_duration_weeks_available") or "").strip(),
                    "queries_es": (r.get("target_queries_es") or "")[:200],
                    "queries_en": (r.get("target_queries_en") or "")[:200],
                    "queries_pt": (r.get("target_queries_pt") or "")[:200],
                })

    meth = os.path.join(REPO, "methodology.md")
    if os.path.exists(meth):
        with open(meth, encoding="utf-8") as fh:
            assets["methodology_sections"] = [
                l.strip("# ").strip() for l in fh if l.startswith("## ")
            ][:40]

    return assets


# ---------------------------------------------------------------------------
# Theme clustering — done in code, not by the model.
#
# The first real run produced 10 of 12 ideas with source_count=1: the model was
# reacting to individual posts ("TrainingPeaks wrote X, let's write X for
# amateurs") rather than finding convergence. That is the exact failure the whole
# design was meant to avoid. Finding which themes appear across several sources
# is counting, not judgement — so it happens here and the model is handed the
# result instead of being asked to do it in prose.
# ---------------------------------------------------------------------------
STOPWORDS = set("""
a an and are as at be but by for from has have how in into is it its of on or
that the to was what when where which who why with your you del las los una uno
para por con como que sin sobre más muy the de la el en y a o um uma para com
this these those they their them will can more most just also than then
""".split())

# Words every endurance blog uses constantly. They cluster perfectly and mean
# nothing — "training appears in 4 sources" is not a signal, it's the topic of
# the entire corpus. Excluded so real themes (durability, lactate) surface.
DOMAIN_NOISE = set("""
training train trainings workout workouts athlete athletes coach coaching
running runner runners cycling cyclist cyclists triathlon triathlete session
sessions performance race races racing week weeks plan plans guide tips
fitness fit training's endurance goals goal program programs schedule
treino treinos atleta atletas corrida entrenamiento entrenamientos plan
""".split())
# Function words. These are not "noise because they're common" — several are
# rare in this corpus — they're words that can't carry a theme regardless.
FUNCTION_WORDS = set("""
here there this that these those they them their its it is are was were be been
being have has had do does did will would can could should may might must
you your yours we our ours us they i me my mine he she his her
what when where which who whom why how all any both each few more most other
some such only own same than too very just now then once again ever never
about above after against below between during before under over up down out
off further while because until unless since although though even also still
get gets got make makes making take takes taking use uses used using
way ways thing things part parts lot lots kind sort type
day days week weeks month months year years time times
new old good better best big small long short high low
one two three first second next last another every
into onto from with without within across through per via
como para pero porque cuando donde desde hasta entre sobre bajo
esto esta este esos esas aquel aquella todo toda todos todas
mais menos muito pouco quando onde porque isso essa esse
""".split())
STOPWORDS |= DOMAIN_NOISE | FUNCTION_WORDS


def theme_clusters(posts, min_sources=2, max_doc_freq=0.25):
    """Find themes spanning multiple sources, using two-word phrases.

    Single words don't work here. The first attempt surfaced "here", "time",
    "using" and "build" as top themes, and a document-frequency cutoff didn't
    help because those words appear in only 6% of posts — they are semantically
    empty, not statistically frequent, which is a different problem needing a
    different tool. Bigrams solve it structurally: "fatigue resistance" and
    "lactate threshold" are themes, "here is" and "using your" are not, and a
    phrase built from two content words is almost always meaningful.

    Single words are still allowed through, but only if they are long, rare
    enough to be specific, and not in the stoplist.
    """
    def tokens(t):
        return [w for w in re.findall(r"[a-zA-Záéíóúñçãõü]+", (t or "").lower())
                if len(w) >= 3]

    def phrases(t):
        ws = tokens(t)
        out = set()
        for a, b in zip(ws, ws[1:]):
            if a in STOPWORDS or b in STOPWORDS:
                continue
            out.add(f"{a} {b}")
        for w in ws:
            if len(w) >= 6 and w not in STOPWORDS:
                out.add(w)
        return out

    index = {}
    for p in posts:
        for ph in phrases(p["title"]) | phrases(p.get("summary", "")):
            index.setdefault(ph, []).append(p)

    n_posts = max(len(posts), 1)
    clusters = []
    for phrase, group in index.items():
        if len(group) / n_posts > max_doc_freq:
            continue
        sources = {g.get("source_publisher") or g["source_name"] for g in group}
        if len(sources) >= min_sources and len(group) >= 2:
            clusters.append({
                "theme": phrase,
                "source_count": len(sources),
                "post_count": len(group),
                "is_phrase": " " in phrase,
                "sources": sorted(sources),
                "examples": [{"title": g.get("title", "")[:130], "url": g.get("url", "")}
                             for g in group[:4]],
            })
    # Multi-word themes first: they are specific enough to build an angle on.
    clusters.sort(key=lambda c: (-int(c["is_phrase"]), -c["source_count"], -c["post_count"]))
    return clusters[:25]


# ---------------------------------------------------------------------------
# Duplicate detection against what is already published.
#
# WHY THIS IS CODE AND NOT A PROMPT RULE
# The prompt has ALWAYS carried a list headed "ALREADY PROPOSED OR PUBLISHED (do
# not repeat)". It did not work. On Aug 30 and Sep 2, 2026 the agent proposed a
# second "El método noruego simplificado", a second Valencia marathon plan and a
# second marathon-durability article — with the first one's title sitting in its
# own context window each time. Five near-duplicates in two batches.
#
# This is the same lesson as convergence detection, which went from 2/12 to 8/12
# usable ideas the day it moved out of the prompt and into theme_clusters():
# a model asked to check something against a long list will say it did. Code
# that computes it does.
#
# WHY TITLES AND NOT BODIES
# Body-text similarity finds nothing here — the duplicates sit below 0.27
# Jaccard on their bodies, because two articles about the Norwegian method
# genuinely say different things in different words. What makes them duplicates
# is that they answer the same query. That lives in the title and the slug.
#
# WHY IDF-WEIGHTED
# Sharing "maraton" is meaningless in a corpus that is mostly marathon articles.
# Sharing "durabilidad" is decisive: it appears in exactly two Spanish articles
# and they are the duplicate pair. Rarity within OUR corpus is the signal, so it
# is measured against our corpus rather than assumed.
# ---------------------------------------------------------------------------

DUP_STOP = set("""
de la el los las en y a un una para tu tus por que como con sin del al es no se su lo
the a an of to for your in on and how why what is not with without from at it its this that you
do da de dos das em para por com sem seu sua os as e no na uma ser mais
""".split())

# Above this, the idea is dropped before Iván ever sees it — at these scores the
# two titles answer the same question. Below it, the idea survives with its
# nearest neighbours named, because "close to an existing article" is often
# exactly right: a cluster covering one subject from several angles is what
# topical authority looks like, and pruning that would be the wrong lesson.
DUP_REJECT = 0.45
DUP_FLAG = 0.28


def _dup_terms(*parts):
    out = set()
    for p in parts:
        s = unicodedata.normalize("NFKD", str(p or "").lower().replace("-", " "))
        s = "".join(c for c in s if not unicodedata.combining(c))
        out |= {w for w in re.sub(r"[^a-z0-9\s]", " ", s).split()
                if len(w) > 3 and w not in DUP_STOP}
    return out


def published_corpus(repo):
    """Every article actually on the site, read from its front matter.

    Read from the .njk FILES rather than content_pieces on purpose: the files
    are what the site serves and what Google sees, they include the six
    hand-written articles that predate the engine and have no database row, and
    they exclude rows that were published and later removed. The database is
    downstream of them.
    """
    out = []
    for lang, sub in (("es", "site/blog"), ("en", "site/en/blog"), ("pt", "site/pt/blog")):
        for path in sorted(glob.glob(os.path.join(repo, sub, "*.njk"))):
            if path.endswith("index.njk"):
                continue
            txt = open(path, encoding="utf-8").read()
            if not txt.startswith("---"):
                continue
            fm = txt.split("---", 2)[1]
            g = lambda k: (re.search(rf"^{k}:\s*(.*)$", fm, re.M).group(1).strip().strip('"')
                           if re.search(rf"^{k}:", fm, re.M) else "")
            slug = os.path.basename(path)[:-4]
            out.append({"lang": lang, "slug": slug, "headline": g("headline"),
                        "topic": g("topic"), "trans_key": g("transKey"), "date": g("date"),
                        "_sig": _dup_terms(g("headline"), slug)})
    return out


def corpus_idf(corpus):
    """Per-language inverse document frequency over titles+slugs."""
    idf = {}
    for lang in ("es", "en", "pt"):
        docs = [a["_sig"] for a in corpus if a["lang"] == lang]
        n = len(docs)
        df = collections.Counter(t for d in docs for t in d)
        idf[lang] = {t: math.log((n + 1) / (c + 0.5)) for t, c in df.items()}
    return idf


def dup_score(sig_a, sig_b, weights):
    """Cosine over IDF-weighted term sets. 0 = unrelated, 1 = same terms."""
    w = lambda s: sum(weights.get(t, 2.0) for t in s)
    den = math.sqrt(w(sig_a) * w(sig_b))
    return (w(sig_a & sig_b) / den) if den else 0.0


def nearest_published(title, lang, corpus, idf, k=3):
    """The k published articles closest to this title, in the same language."""
    sig = _dup_terms(title)
    weights = idf.get(lang, {})
    scored = [(dup_score(sig, a["_sig"], weights), a)
              for a in corpus if a["lang"] == lang]
    scored.sort(key=lambda x: -x[0])
    return [(s, a) for s, a in scored[:k] if s > 0.05]


def screen_ideas(ideas, corpus, idf):
    """Drop clones of published articles, and clones of each other.

    Returns (kept, dropped) where dropped carries a human-readable reason.
    Anything merely CLOSE is kept, with the nearest article recorded in
    `_overlap` so it reaches the review page — Gate A cannot reject a duplicate
    it has no way to recognise, and until now nothing told it.
    """
    kept, dropped = [], []
    for idea in ideas:
        title = idea.get("working_title", "")
        lang = idea.get("language", "es")
        near = nearest_published(title, lang, corpus, idf, k=3)

        if near and near[0][0] >= DUP_REJECT:
            s, a = near[0]
            dropped.append((idea, f"{s:.2f} vs published '{a['headline'][:60]}' ({a['slug']})"))
            continue

        # Within-batch: the Aug 30 run proposed two threshold-control articles
        # in a single call. No amount of corpus history catches that — the
        # collision is between two things that do not exist yet.
        sig = _dup_terms(title)
        clash = None
        for k2 in kept:
            if k2.get("language") != lang:
                continue
            s = dup_score(sig, _dup_terms(k2.get("working_title", "")), idf.get(lang, {}))
            if s >= DUP_REJECT:
                clash = (s, k2.get("working_title", ""))
                break
        if clash:
            dropped.append((idea, f"{clash[0]:.2f} vs another idea in this batch: '{clash[1][:60]}'"))
            continue

        # Flag only when at least TWO substantive terms are shared. A single
        # shared word scores surprisingly high when it is rare in our corpus but
        # generic in the language — "Cómo elegir gafas de natación" matched
        # "Cómo elegir tu plan de maratón" on `elegir` alone. One verb in common
        # is not overlapping coverage, and a review page that cries wolf gets
        # ignored, which costs more than the duplicate would.
        if near and near[0][0] >= DUP_FLAG and len(sig & near[0][1]["_sig"]) >= 2:
            # Show the top two, not just the top one. Ranking by score alone
            # sometimes puts a weaker match first — the English durability
            # duplicate scored highest against a first-marathon article rather
            # than against its actual twin. Two lines cost nothing to read and
            # remove that failure mode.
            # The FIRST hit must clear DUP_FLAG — that is what triggered this.
            # The second only has to be relevant (two substantive terms in
            # common), because once we are already showing a warning, naming a
            # second candidate is free and the true twin sometimes scores lower
            # than a noisier neighbour.
            hits = [(s, a) for s, a in near[:2] if len(sig & a["_sig"]) >= 2]
            note = "⚠️ Cercano a artículo(s) ya publicado(s):\n" + "\n".join(
                f"   ({s:.2f}) «{a['headline']}» — /{a['slug']}/" for s, a in hits)
            s, a = hits[0]
            idea["_overlap"] = note
            # Written into `rationale` because that is the field the review page
            # already renders. Gate A could not reject a duplicate it had no way
            # to recognise; now the nearest existing article is on the card next
            # to the Sí / No buttons, which is the only place it is useful.
            idea["rationale"] = note + "\n\n" + (idea.get("rationale") or "")
        kept.append(idea)
    return kept, dropped


def coverage_block(corpus):
    """Article counts per topic and language — the shape of what we cover.

    Handed to the agent because a gap it cannot see is a gap it cannot fill.
    Zero swimming articles in a triathlon coaching business is not something
    source-blog crawling will ever surface.
    """
    per = collections.Counter((a["topic"] or "—", a["lang"]) for a in corpus)
    topics = sorted({t for t, _ in per})
    rows = [{"topic": t, "es": per[(t, "es")], "en": per[(t, "en")], "pt": per[(t, "pt")]}
            for t in topics]
    return rows


PROMPT = """You are the research agent for Triaperformance, a triathlon and running coaching business.

Your job: propose {n} article ideas for their blog. You are NOT writing articles.

CONVERGING THEMES (computed, not guessed)
Below, under THEMES, is the list of subjects that appeared across MULTIPLE sources
in the window, with counts. These are the real timing signals. Prefer them.
Every idea must declare `signal_type`:
  convergence — built on a theme in the THEMES list. You MUST list, in `evidence`,
                the URLs of the actual posts that support it, from at least two
                different PUBLISHERS — not two source names. TrainingPeaks owns
                three of the sources below (its two blogs and the Endurance
                Unlimited podcast); citing two of those is citing one company.
                The count is verified against those URLs in code — claiming a
                theme's headline number without citing posts that are genuinely
                about your angle gets the idea discarded.
  gap         — the sources collectively are NOT covering something Triaperformance
                is well placed to answer. Say in the rationale what is missing.
  evergreen   — no source signal at all; it stands on Triaperformance's own assets
                and search intent. Legitimate, but cap these at a third of the set.
Do NOT claim `convergence` for a theme touched by only one source. That is just
reacting to one blog post, and it produces articles competing with that blog on
its own ground.

BLOGS AND PODCASTS ARE DIFFERENT SIGNALS
Every source post carries `kind`. Read it before you weigh it.
  blog    — a competitor in search results. If they rank for a topic you probably
            will not, so their strong topics are the ones to route AROUND. The
            "do not propose it just because a source covered it" rule below is
            about these.
  podcast — not a search competitor at all. An episode is proof that practitioners
            in this field think a question is worth an hour of audio RIGHT NOW,
            published in a format that will never occupy the search result we
            want. So a podcast theme points the other way from a blog theme: the
            demand is demonstrated and the written answer does not exist yet.
            Two hard constraints:
            (1) You have the episode TITLE and BLURB. You have not heard it, and
                you never will. Never attribute a claim, a number, a study or a
                protocol to an episode, and never write "as discussed on <show>".
                It is evidence that the QUESTION is live. Nothing more.
            (2) A question raised on a podcast still has to be answered from
                methodology.md and our own assets, not from the blurb. If we
                cannot answer it from what we actually know, it is not our idea.

WHAT THE SOURCE POSTS ARE FOR
Below is what competitor/industry blogs published recently. Use them for TIMING
and GAPS only. Do NOT propose an article just because a source covered the topic —
Triaperformance cannot outrank TrainingPeaks on TrainingPeaks' own strong topics.
Propose a topic when EITHER:
  (a) several sources are circling a theme, and Triaperformance can say something
      about it they cannot, or
  (b) the sources are collectively missing something obvious that Triaperformance
      is unusually well placed to answer.

WHAT MAKES AN IDEA GOOD
Every idea must name concrete Triaperformance assets in `our_assets`. If you cannot
name any, the idea is one anyone could write — discard it and propose another.
Available assets are listed under OUR ASSETS below: the plan catalog (with counts
per language), the members-area artifacts, the coaching methodology sections, and
the lead-magnet guides.

ARTICLE TYPES — pick per idea:
  plan_guide    decision guide routing readers to specific plans
  education     topical authority; may sell nothing at all. This is allowed and
                encouraged — traffic and trust are legitimate goals.
  gated_teaser  explains a concept completely, while the *execution artifact*
                (a routine, a calculator) sits behind the All-Access members login.
                HARD RULE: the article must be genuinely complete and useful on its
                own. The paywall holds the artifact, never the understanding.
                Only propose this when a real members artifact exists for it.
  gear          affiliate-oriented
  case_study    a real athlete's transformation, told as a story. Does not chase
                search volume — it sells coaching through evidence. Only propose
                this when methodology.md or the review bank gives you a real
                athlete and a real result to build on. Never invent an athlete.

CTA TYPES: plan | all_access | coaching | affiliate | lead_magnet | none

COHERENCE RULES — these are enforced in code, violations are discarded:
  gated_teaser  MUST use cta_type = all_access. That is what the type means: the
                artifact lives behind the members login. If you want to point at a
                free PDF instead, the type is `education` with cta_type=lead_magnet.
  case_study    MUST use cta_type = coaching or none.
  gear          MUST use cta_type = affiliate.

REQUIRED MIX across the set you return:
  - at least 2 ideas with cta_type = none. An article that ranks and builds trust
    without selling anything is a success, not a fallback.
  - at least 1 case_study, if the assets give you a real athlete to build on.
  - no more than a third with signal_type = evergreen.

RACE-SPECIFIC ANGLES
OUR ASSETS includes a `races` list with real target-race data: distance, market,
typical month, the plan durations available for it, and pre-researched search
queries per language. A race guide is the highest-intent content available —
the reader has already picked a date and wants one specific answer. Propose
these when the race's month is close enough to matter and the plan durations
line up with the time remaining. Use the race's own target_queries as
target_query rather than inventing one.

FORMATS WORTH BORROWING (formats, not topics)
  "Paper review" — take one recent study, extract what it actually changes in
  practice. High authority, low competition, and Triaperformance's methodology
  doc supplies the lens. High North built an archive on this.
  "Inside the data" — one race or one block, the actual files, what happened and
  why. Stryd does this with elite athletes; Triaperformance can do it with real
  coached athletes, which is rarer and more relatable.

LANGUAGE RULES
  es — primary market, anything in the catalog
  en — SEO/acquisition focus. Weight Loss is the strongest English category.
  pt — ONLY marathon, 5k, 10k, 21k and FTP. The Portuguese catalog has nothing
       else, so an idea outside those points readers at plans that don't exist.
       The audience is BRAZIL, not Portugal — the catalog carries Rio, Santiago
       and Lima race editions. Write for Brazilian runners and use Brazilian
       Portuguese. Never write "em Portugal".
  Check the per-language plan counts in OUR ASSETS before proposing: a topic with
  fewer than 5 plans in the target language is too thin to route a reader to.

Return STRICT JSON, no prose, no markdown fence:
{{"ideas":[{{"language":"es","working_title":"...","angle":"what we can say that the sources cannot","target_query":"...","rationale":"why now, why us","article_type":"education","cta_type":"none","cta_target":null,"signal_type":"convergence","theme":"durabilidad","our_assets":["..."],"evidence":["source post url"],"source_count":3,"score":75}}]}}

THEMES APPEARING ACROSS MULTIPLE SOURCES
{themes}

RECENT SOURCE POSTS
{sources}

OUR ASSETS
{assets}

ALREADY PUBLISHED — every article live on the site, per language.
Read this before proposing anything. An idea whose title scores as a near-clone
of one of these is DISCARDED IN CODE before Iván sees it, so proposing one costs
you a slot and gains nothing. This is checked, not trusted.
{published}

HOW WE COVER EACH TOPIC (article counts — the shape of our archive)
{coverage}
A topic with a low count is not a warning, it is an opening. A topic with zero
articles is a hole in the archive that the source blogs will never reveal to
you, because they are not us. Weigh these counts when choosing.

WHEN YOUR IDEA IS CLOSE TO SOMETHING PUBLISHED
Close is not automatically wrong — a cluster covering one subject from several
angles is how topical authority is built. But say so explicitly. If an idea sits
near an existing article, name that article in `rationale` and state in one
sentence what a reader gets here that they do not get there. If you cannot say
it, the honest move is a different idea.

NEVER propose two ideas in this same batch that answer the same question. They
are checked against each other as well as against the archive, and the second
one is discarded.

STILL OPEN, NOT YET WRITTEN (proposed or approved, no article yet — do not repeat):
{existing}
"""


def call_model(prompt, api_key, model, api_versions=("v1beta", "v1"), expect="json"):
    """Call Gemini, trying each API version before giving up.

    Not every model is served on every API version — a model that `--list-models`
    reports on v1beta can still 404 on a generateContent call there. Rather than
    guess which version a given model wants, try them in order.

    Google's own error body is always shown on failure. An earlier version of
    this replaced it with a friendly message about the model name being wrong,
    which threw away the one piece of information that says what actually
    happened — the error text was right there and got discarded.
    """
    gen = {"temperature": 0.85, "maxOutputTokens": 32768}
    if expect == "json":
        gen["responseMimeType"] = "application/json"
    payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": gen}
    last = None
    t0 = time.monotonic()
    for ver in api_versions:
        url = (f"https://generativelanguage.googleapis.com/{ver}/models/"
               f"{model}:generateContent?key={api_key}")
        req = urllib.request.Request(
            url, data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.loads(r.read().decode("utf-8"))
            if ver != api_versions[0]:
                print(f"[model] note: {model} answered on {ver}, not {api_versions[0]}",
                      file=sys.stderr)
            break
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            last = (ver, e.code, body)
            print(f"[model] {ver} returned HTTP {e.code}", file=sys.stderr)
            continue
    else:
        ver, code, body = last
        try:
            msg = json.loads(body)["error"]["message"]
        except Exception:
            msg = body[:600]
        # Billed at zero, but recorded: a burst of failures is a real event and
        # a table that only holds successes cannot show one.
        log_usage(model=model, api_version=ver, ok=False, http_status=code,
                  duration_ms=int((time.monotonic() - t0) * 1000), note=msg[:500])
        sys.exit(f"Model call failed on every API version tried "
                 f"({', '.join(api_versions)}).\n"
                 f"Model: {model}\n"
                 f"Last response (HTTP {code}): {msg}\n\n"
                 f"If this says the model is not found, run:\n"
                 f"  python3 research_agent.py --list-models")

    # Report thinking tokens separately. in + out does not equal total on 3.x
    # pro models — the gap is reasoning tokens, which are billed at the output
    # rate. Hiding them understates the real cost of a call by roughly half.
    u = data.get("usageMetadata") or {}
    pin = u.get("promptTokenCount", 0)
    pout = u.get("candidatesTokenCount", 0)
    tot = u.get("totalTokenCount", 0)
    think = u.get("thoughtsTokenCount") or max(0, tot - pin - pout)
    if u:
        parts = [f"{pin:,} in", f"{pout:,} out"]
        if think:
            parts.append(f"{think:,} thinking (billed as output)")
        parts.append(f"{tot:,} total")
        print(f"[model] {model}: " + " / ".join(parts), file=sys.stderr)

    # One row per call, including the ones that answered on a fallback API
    # version. A retry storm is the exact shape of an unexplained spike, so the
    # row count matters as much as the token count.
    log_usage(model=model, api_version=ver, prompt_tokens=pin, output_tokens=pout,
              thinking_tokens=think, total_tokens=tot, ok=True,
              duration_ms=int((time.monotonic() - t0) * 1000),
              finish_reason=(data.get("candidates") or [{}])[0].get("finishReason"))

    cand = data["candidates"][0]
    text = cand["content"]["parts"][0]["text"]
    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip()

    if expect != "json":
        return text

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        reason = cand.get("finishReason", "unknown")
        print(f"[model] response was not valid JSON ({e}); finishReason={reason}. "
              f"Salvaging complete objects...", file=sys.stderr)
        return {"ideas": salvage_ideas(text)}


def salvage_ideas(text):
    """Pull complete {...} objects out of a truncated ideas array."""
    start = text.find("[")
    if start == -1:
        return []
    ideas, depth, obj_start, in_str, esc = [], 0, None, False, False
    for i, ch in enumerate(text[start:], start):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "{":
            if depth == 0:
                obj_start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and obj_start is not None:
                try:
                    ideas.append(json.loads(text[obj_start:i + 1]))
                except json.JSONDecodeError:
                    pass
                obj_start = None
    print(f"[model] salvaged {len(ideas)} complete ideas from the truncated response",
          file=sys.stderr)
    return ideas


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
def connect():
    """Connect with keyword parameters, never a URI.

    A postgres:// URI breaks when the password contains ":" or "@" — libpq parses
    part of the password as the port and fails with "invalid integer value for
    connection option port". That is exactly what happened here on the first real
    save. Keyword parameters have no delimiters to collide with.
    """
    try:
        import psycopg2
    except ImportError:
        sys.exit("psycopg2 missing. Install with: pip3 install psycopg2-binary "
                 "--break-system-packages, or use ~/.analytics/venv/bin/python3")

    env = read_env_files()
    password = os.environ.get("PG_PASSWORD") or env.get("PG_PASSWORD")
    if not password:
        sys.exit("No Postgres password found. Run --show-env to see what's available.")
    return psycopg2.connect(
        host=os.environ.get("PG_HOST") or env.get("PG_HOST") or "127.0.0.1",
        port=int(os.environ.get("PG_PORT") or env.get("PG_PORT") or 5432),
        user=os.environ.get("PG_USER") or env.get("PG_USER") or "analytics",
        password=password,
        dbname="content",
    )


# ---------------------------------------------------------------------------
# Usage accounting
#
# Every Gemini response carries usageMetadata. call_model already computed it
# and printed it to a log that run-agent.sh trims at 4000 lines — so the numbers
# existed and then expired. They go to Postgres now because five things on this
# box share ONE API key, and a per-key dashboard can never say which of them
# spent the money. Full reasoning in the model_usage block in schema.sql.
#
# This must never be able to fail a run. A drafting job that dies because a
# bookkeeping table was unreachable is a worse bug than having no bookkeeping,
# so everything here is swallowed and reported on stderr.
#
# SystemExit is caught explicitly and that is not paranoia: connect() calls
# sys.exit() when no Postgres password is present, and SystemExit does not
# inherit from Exception. Catching only Exception here would mean a missing
# PG_PASSWORD silently killed the writer mid-article — the instrumentation
# taking down the thing it was added to measure.
# ---------------------------------------------------------------------------
def caller_name():
    """Who is making this call.

    run-agent.sh exports CONTENT_CALLER, which is the only way to tell `write`
    from `translate`: both are writer_agent.py and argv alone cannot separate
    them. The argv fallback is for hand-run invocations.
    """
    name = os.environ.get("CONTENT_CALLER", "").strip()
    if name:
        return name
    base = os.path.basename(sys.argv[0] or "")
    return base[:-3] if base.endswith(".py") else (base or "unknown")


def log_usage(**row):
    """Record one Gemini call. Never raises."""
    fields = {"caller": caller_name(), "model": None, "api_version": None,
              "prompt_tokens": 0, "output_tokens": 0, "thinking_tokens": 0,
              "total_tokens": 0, "duration_ms": None, "ok": True,
              "http_status": None, "finish_reason": None, "note": None}
    fields.update(row)
    conn = None
    try:
        conn = connect()
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO model_usage
                    (caller, model, api_version, prompt_tokens, output_tokens,
                     thinking_tokens, total_tokens, duration_ms, ok,
                     http_status, finish_reason, note)
                VALUES (%(caller)s, %(model)s, %(api_version)s, %(prompt_tokens)s,
                        %(output_tokens)s, %(thinking_tokens)s, %(total_tokens)s,
                        %(duration_ms)s, %(ok)s, %(http_status)s,
                        %(finish_reason)s, %(note)s)
            """, fields)
    except (Exception, SystemExit) as e:
        print(f"[usage] not recorded ({fields['caller']}/{fields['model']}): {e}",
              file=sys.stderr)
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


VALID_TYPES = {"plan_guide", "education", "gated_teaser", "gear", "case_study"}
VALID_CTAS = {"plan", "all_access", "coaching", "affiliate", "lead_magnet", "none"}
VALID_SIGNALS = {"convergence", "gap", "evergreen"}

# An article type implies its offer. The first run produced gated_teaser ideas
# pointing at a free PDF, which is a different funnel wearing the same label.
REQUIRED_CTA = {
    "gated_teaser": {"all_access"},
    "case_study": {"coaching", "none"},
    "gear": {"affiliate"},
}


def verified_source_count(idea, url_to_source):
    """How many DISTINCT sources the idea actually cites.

    The model was setting source_count to the theme's source count, which meant
    an idea about altitude in Mexico City claimed 5 sources because 5 sources had
    written about "marathon". A broad theme launders a weak signal into a strong
    number. The claim is now measured from the evidence URLs instead of believed.

    Counted by PUBLISHER, not by source name (Sept 7, 2026). TrainingPeaks owns
    three of the sources — its two blogs and the Endurance Unlimited podcast — so
    name-counting would have scored one company's editorial calendar as a
    three-source convergence.
    """
    ev = idea.get("evidence") or []
    if isinstance(ev, str):
        ev = [ev]
    return len({url_to_source[u] for u in ev if u in url_to_source})


def save_ideas(conn, ideas, url_to_source=None):
    """Insert ideas, dropping any the model malformed rather than trusting it."""
    url_to_source = url_to_source or {}
    kept, dropped = 0, []
    with conn.cursor() as cur:
        for i in ideas:
            at, ct = i.get("article_type"), i.get("cta_type")
            lang = i.get("language")
            if at not in VALID_TYPES or ct not in VALID_CTAS or lang not in ("es", "en", "pt"):
                dropped.append((i.get("working_title", "?"), f"bad enum {at}/{ct}/{lang}"))
                continue
            if not i.get("our_assets"):
                dropped.append((i.get("working_title", "?"), "no Triaperformance assets named"))
                continue
            allowed = REQUIRED_CTA.get(at)
            if allowed and ct not in allowed:
                dropped.append((i.get("working_title", "?"),
                                f"{at} must use cta {'/'.join(sorted(allowed))}, got {ct}"))
                continue
            sig = i.get("signal_type")
            if sig not in VALID_SIGNALS:
                dropped.append((i.get("working_title", "?"), f"bad signal_type {sig}"))
                continue
            if sig == "convergence":
                verified = verified_source_count(i, url_to_source)
                if verified < 2:
                    dropped.append((i.get("working_title", "?"),
                                    f"claims convergence but only {verified} distinct "
                                    f"source(s) in its cited evidence"))
                    continue
                i["source_count"] = verified  # store the measured value, not the claim
            cur.execute("""
                INSERT INTO content_ideas
                  (language, working_title, angle, target_query, rationale,
                   article_type, cta_type, cta_target, our_assets, evidence,
                   source_count, score)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (lang, i.get("working_title"), i.get("angle", ""), i.get("target_query"),
                  i.get("rationale", ""), at, ct, i.get("cta_target"),
                  json.dumps(i.get("our_assets", [])), json.dumps(i.get("evidence", [])),
                  i.get("source_count", 0), i.get("score")))
            kept += 1
    conn.commit()
    return kept, dropped


def notify_if_ready(conn, threshold):
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM content_ideas WHERE status = 'PROPOSED'")
        pending = cur.fetchone()[0]
    print(f"[notify] {pending} ideas pending, threshold {threshold}")
    if pending < threshold:
        print("[notify] below threshold — no email. Batches, not drips.")
        return
    hook = os.environ.get("IDEA_NOTIFY_WEBHOOK")
    if not hook:
        print("[notify] IDEA_NOTIFY_WEBHOOK not set — skipping email")
        return
    body = json.dumps({"pending": pending,
                       "review_url": "https://triaperformance.com/admin/ideas/"}).encode()
    try:
        req = urllib.request.Request(hook, data=body,
                                     headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=20) as r:
            print(f"[notify] webhook returned {r.status}")
    except Exception as e:
        print(f"[notify] webhook failed: {e}", file=sys.stderr)


# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check-sources", action="store_true")
    ap.add_argument("--crawl-only", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--debug-source", metavar="NAME",
                    help="print link-matching detail for the source whose name contains NAME")
    ap.add_argument("--list-models", action="store_true",
                    help="print the models this API key can SEE (not necessarily use)")
    ap.add_argument("--test-models", action="store_true",
                    help="actually call each text model and report which ones work")
    ap.add_argument("--only", metavar="SUBSTRING",
                    help="with --test-models: only test names containing this")
    ap.add_argument("--show-env", action="store_true",
                    help="list which secret variable NAMES exist in the .env files "
                         "(names only, never values) and exit")
    ap.add_argument("--save", action="store_true",
                    help="with --check-sources: write what was discovered back into "
                         "sources.json, so real runs skip feed probing")
    args = ap.parse_args()

    if args.show_env:
        show_env()
        return

    load_env()

    if args.list_models or args.test_models:
        key = os.environ.get("GOOGLE_API_KEY")
        if not key:
            sys.exit("No API key found. Run --show-env.")
        if args.test_models:
            test_models(key, args.only)
        else:
            list_models(key)
        return

    cfg = json.load(open(SOURCES_FILE, encoding="utf-8"))
    settings = cfg["settings"]
    delay = settings.get("request_delay_seconds", 2.0)

    # --- source discovery -------------------------------------------------
    all_posts, report = [], []
    for src in cfg["sources"]:
        if src.get("active") is False:
            print(f"[source] {src['name']}: skipped (active=false)")
            continue
        dbg = bool(args.debug_source and args.debug_source.lower() in src["name"].lower())
        mode, feed, posts, err = discover(src, delay, debug=dbg)
        posts = posts[: settings.get("max_posts_per_source", 25)]
        report.append((src["name"], mode, feed, len(posts), err))
        print(f"[source] {src['name']}: mode={mode} posts={len(posts)}"
              + (f" feed={feed}" if feed else "")
              + (f" ERROR={err}" if err else ""))
        for p in posts:
            p["source_name"] = src["name"]
            # Convergence must mean "several INDEPENDENT outlets", not "several
            # properties of one publisher". TrainingPeaks alone owns three of the
            # sources below (blog, coach blog, Endurance Unlimited); counting them
            # as three would let one editorial calendar manufacture a theme.
            p["source_publisher"] = src.get("publisher") or src["name"]
            p["source_kind"] = src.get("kind", "blog")
        all_posts.extend(posts)
        time.sleep(delay)

    if args.check_sources:
        print("\n--- summary ---")
        for name, mode, feed, n, err in report:
            status = "OK" if n else "NO POSTS"
            print(f"{status:9s} {name:42s} mode={mode:5s} n={n:3d} {feed or ''} {err or ''}")

        if args.save:
            # Record what actually worked so future runs go straight to the right
            # URL instead of probing six candidate paths per source every time.
            by_name = {r[0]: r for r in report}
            changes = []
            for src in cfg["sources"]:
                name, mode, feed, n, err = by_name.get(src["name"], (None,) * 5)
                if name is None:
                    continue
                if n and mode == "feed" and feed and src.get("feed_url") != feed:
                    src["feed_url"], src["fetch_mode"] = feed, "feed"
                    changes.append(f"{name}: feed -> {feed}")
                elif n and mode == "html" and src.get("fetch_mode") != "html":
                    src["fetch_mode"], src["feed_url"] = "html", None
                    changes.append(f"{name}: html mode (skips feed probing)")
            if changes:
                with open(SOURCES_FILE, "w", encoding="utf-8") as fh:
                    json.dump(cfg, fh, indent=2, ensure_ascii=False)
                    fh.write("\n")
                print("\nsources.json updated:")
                for c in changes:
                    print(f"  {c}")
                print("\nRun this on your Mac and commit the file — the VPS checkout "
                      "is reset on every deploy, so changes made there are lost.")
            else:
                print("\nsources.json already matches what was discovered — nothing to write.")
        else:
            print("\nRe-run with --save to write these results into sources.json "
                  "(do it on your Mac, then commit). Sources that keep failing can be "
                  'switched off with "active": false rather than retried every week.')
        return

    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.get("lookback_days", 120))
    recent = []
    for p in all_posts:
        d = parse_date(p.get("published_raw"))
        if d is None or d >= cutoff:
            recent.append(p)
    print(f"\n[crawl] {len(all_posts)} posts seen, {len(recent)} within lookback window")

    if args.crawl_only:
        for p in recent[:40]:
            print(f"  - [{p['source_name']}] {p['title'][:90]}")
        return

    clusters = theme_clusters(recent)
    print(f"[themes] {len(clusters)} themes appear across 2+ sources")
    for c in clusters[:10]:
        print(f"    {c['theme']:22s} {c['source_count']} sources, "
              f"{c['post_count']} posts  ({', '.join(s2.split(' —')[0] for s2 in c['sources'][:3])})")

    assets = load_our_assets()
    print(f"[assets] {len(assets['plans_by_topic'])} plan topic buckets, "
          f"{len(assets['members_artifacts'])} members artifacts, "
          f"{len(assets['methodology_sections'])} methodology sections, "
          f"{len(assets['races'])} races")

    # What is actually on the site, read from the repo. This replaces the old
    # "SELECT working_title FROM content_ideas" list, which was the wrong list
    # in three ways: idea working titles are not published headlines, rejected
    # ideas were mixed in with live articles, and it carried no language, topic
    # or slug — so nothing could be computed from it and nothing was.
    corpus = published_corpus(REPO)
    idf = corpus_idf(corpus)
    cov = coverage_block(corpus)
    print(f"[corpus] {len(corpus)} published article(s): "
          + " · ".join(f"{r['topic']} {r['es']}/{r['en']}/{r['pt']}" for r in cov))

    existing = []
    conn = None
    if not args.dry_run:
        conn = connect()
        with conn.cursor() as cur:
            # Only ideas with no article yet. A PUBLISHED idea is already in the
            # corpus above, under its real headline; listing it here as well
            # said the same thing twice in two different wordings.
            cur.execute("""SELECT working_title FROM content_ideas
                           WHERE status IN ('PROPOSED','APPROVED','WRITTEN')
                           ORDER BY created_at DESC LIMIT 100""")
            existing = [r[0] for r in cur.fetchall()]

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        sys.exit("No model API key found. Run --show-env to see what's in the .env files.")
    if " " in api_key or len(api_key) < 20:
        sys.exit(f"The API key looks wrong ({len(api_key)} chars, contains a space?). "
                 "It was probably set to placeholder text rather than a real key. "
                 "Unset it and let the script read ~/.hermes/.env: unset GOOGLE_API_KEY")
    # gemini-3.8-flash since September 4, 2026 (3.7-flash from August 17, and
    # 3.5-flash before that). GA, not a -preview alias, so the pinned-release
    # rule in §3 still holds.
    #
    # Note the argument changed shape between the two moves and the docstring
    # says so deliberately: 3.5 → 3.7 halved the price, 3.7 → 3.8 is priced
    # identically ($0.75/$3.75 per 1M to Dec 31, 2026, then $1.50/$7.50 — the
    # same numbers 3.7 carries). Same rate per token is not the same cost per
    # call: 3.8 defaults to reasoning level "medium" and thinking tokens bill at
    # the output rate. model_usage.thinking_tokens is what settles that, and it
    # needs a few real runs before it can. §33.
    model = os.environ.get("CONTENT_MODEL", "gemini-3.8-flash")

    prompt = PROMPT.format(
        n=settings.get("ideas_per_run", 12),
        themes=json.dumps(clusters, ensure_ascii=False, indent=1)[:5000],
        sources=json.dumps([{"source": p["source_name"], "kind": p.get("source_kind", "blog"),
                             "publisher": p.get("source_publisher", p["source_name"]),
                             "title": p["title"],
                             "summary": p.get("summary", "")[:300], "url": p["url"]}
                            for p in recent[:120]], ensure_ascii=False, indent=1),
        assets=json.dumps(assets, ensure_ascii=False, indent=1)[:6000],
        published=json.dumps(
            [{"lang": a["lang"], "topic": a["topic"], "title": a["headline"], "slug": a["slug"]}
             for a in corpus], ensure_ascii=False, indent=1)[:14000],
        coverage=json.dumps(cov, ensure_ascii=False),
        existing=json.dumps(existing, ensure_ascii=False),
    )

    print(f"[model] calling {model}...")
    result = call_model(prompt, api_key, model)
    ideas = result.get("ideas", [])
    print(f"[model] returned {len(ideas)} ideas")

    # The check the prompt could never enforce on itself.
    ideas, dropped = screen_ideas(ideas, corpus, idf)
    if dropped:
        print(f"[dedupe] discarded {len(dropped)} idea(s) as near-duplicates:")
        for idea, why in dropped:
            print(f"    ✕ {idea.get('working_title','?')[:64]}")
            print(f"      {why}")
    flagged = [i for i in ideas if i.get("_overlap")]
    if flagged:
        print(f"[dedupe] {len(flagged)} kept but close to existing coverage "
              f"(noted on the review page):")
        for i in flagged:
            print(f"    ~ {i.get('working_title','?')[:64]}")
    print(f"[dedupe] {len(ideas)} idea(s) survive")

    if args.dry_run:
        from collections import Counter
        for i in ideas:
            ok = []
            allowed = REQUIRED_CTA.get(i.get("article_type"))
            if allowed and i.get("cta_type") not in allowed:
                ok.append("CTA MISMATCH")
            if i.get("signal_type") == "convergence":
                v = verified_source_count(i, {p["url"]: p["source_publisher"]
                                              for p in recent if p.get("url")})
                if v < 2:
                    ok.append(f"UNVERIFIED CONVERGENCE (claims "
                              f"{i.get('source_count')}, evidence shows {v})")
            flag = ("  <<< " + ", ".join(ok)) if ok else ""
            print(f"\n  [{i.get('language')}] {i.get('working_title')}{flag}")
            print(f"      type={i.get('article_type')} cta={i.get('cta_type')} "
                  f"signal={i.get('signal_type')} theme={i.get('theme')} "
                  f"score={i.get('score')} sources={i.get('source_count')}")
            print(f"      angle: {i.get('angle','')[:150]}")
            print(f"      assets: {i.get('our_assets')}")
        print("\n--- mix ---")
        for label, key in (("types", "article_type"), ("ctas", "cta_type"),
                           ("signals", "signal_type"), ("languages", "language")):
            print(f"  {label:10s} {dict(Counter(i.get(key) for i in ideas))}")
        return

    url_to_source = {p["url"]: p["source_publisher"] for p in recent if p.get("url")}
    kept, dropped = save_ideas(conn, ideas, url_to_source)
    print(f"[db] saved {kept} ideas, dropped {len(dropped)}")
    for title, why in dropped:
        print(f"     dropped: {title[:60]} — {why}")

    notify_if_ready(conn, settings.get("notify_threshold", 8))
    conn.close()


if __name__ == "__main__":
    main()
