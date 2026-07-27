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

ENVIRONMENT (all read from ~/.hermes/.env or the shell)
    CONTENT_DB_DSN      postgres://analytics:...@127.0.0.1:5432/content
    GOOGLE_API_KEY      Gemini key, already on the box for Hermes
    IDEA_NOTIFY_WEBHOOK n8n webhook that sends the "ideas ready" email
    CONTENT_MODEL       optional, defaults to gemini-3.5-flash
"""

import argparse
import json
import os
import re
import sys
import time
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
def parse_feed(body):
    """RSS or Atom -> [{url, title, summary, published_at}]"""
    out = []
    root = ET.fromstring(body.encode("utf-8"))
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


def parse_html_index(body, base_url):
    """Crude fallback: pull article links + their anchor text off a blog index."""
    seen, out = set(), []
    for m in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', body, re.S | re.I):
        href, text = m.group(1), re.sub(r"<[^>]+>", " ", m.group(2))
        text = re.sub(r"\s+", " ", text).strip()
        if not text or len(text) < 25:
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
def discover(source, delay=2.0):
    """Return (mode, feed_url, posts, error)."""
    site = source["site_url"]

    if source.get("feed_url"):
        try:
            body, ctype = fetch(source["feed_url"])
            if looks_like_feed(body, ctype):
                return "feed", source["feed_url"], parse_feed(body), None
        except Exception as e:
            return "feed", source["feed_url"], [], f"configured feed failed: {e}"

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
        posts = parse_html_index(body, site)
        if posts:
            return "html", None, posts, None
        return "html", None, [], "index fetched but no article links matched"
    except Exception as e:
        return "none", None, [], f"{e}"


# ---------------------------------------------------------------------------
# Our own assets — the half of the equation the sources don't have
# ---------------------------------------------------------------------------
def load_our_assets():
    """Summarise what we can write from that a generic endurance blog cannot."""
    import csv

    assets = {"plans_by_topic": {}, "members_artifacts": [], "methodology_sections": [],
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

    meth = os.path.join(REPO, "methodology.md")
    if os.path.exists(meth):
        with open(meth, encoding="utf-8") as fh:
            assets["methodology_sections"] = [
                l.strip("# ").strip() for l in fh if l.startswith("## ")
            ][:40]

    return assets


# ---------------------------------------------------------------------------
# Idea generation
# ---------------------------------------------------------------------------
PROMPT = """You are the research agent for Triaperformance, a triathlon and running coaching business.

Your job: propose {n} article ideas for their blog. You are NOT writing articles.

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
  Choose `none` freely. An article that ranks and builds trust without selling
  is a success. Do not attach a CTA that the article doesn't naturally earn.

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

Return STRICT JSON, no prose, no markdown fence:
{{"ideas":[{{"language":"es","working_title":"...","angle":"what we can say that the sources cannot","target_query":"...","rationale":"why now, why us","article_type":"education","cta_type":"none","cta_target":null,"our_assets":["..."],"evidence":["source post url"],"source_count":2,"score":75}}]}}

RECENT SOURCE POSTS
{sources}

OUR ASSETS
{assets}

ALREADY PROPOSED OR PUBLISHED (do not repeat):
{existing}
"""


def call_model(prompt, api_key, model):
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{model}:generateContent?key={api_key}")
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.85, "maxOutputTokens": 8192,
                             "responseMimeType": "application/json"},
    }
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read().decode("utf-8"))
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip()
    return json.loads(text)


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
def connect():
    dsn = os.environ.get("CONTENT_DB_DSN")
    if not dsn:
        sys.exit("CONTENT_DB_DSN is not set. See the header of this file.")
    try:
        import psycopg2
    except ImportError:
        sys.exit("psycopg2 missing. Install with: pip3 install psycopg2-binary --break-system-packages")
    return psycopg2.connect(dsn)


VALID_TYPES = {"plan_guide", "education", "gated_teaser", "gear", "case_study"}
VALID_CTAS = {"plan", "all_access", "coaching", "affiliate", "lead_magnet", "none"}


def save_ideas(conn, ideas):
    """Insert ideas, dropping any the model malformed rather than trusting it."""
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
    args = ap.parse_args()

    cfg = json.load(open(SOURCES_FILE, encoding="utf-8"))
    settings = cfg["settings"]
    delay = settings.get("request_delay_seconds", 2.0)

    # --- source discovery -------------------------------------------------
    all_posts, report = [], []
    for src in cfg["sources"]:
        mode, feed, posts, err = discover(src, delay)
        posts = posts[: settings.get("max_posts_per_source", 25)]
        report.append((src["name"], mode, feed, len(posts), err))
        print(f"[source] {src['name']}: mode={mode} posts={len(posts)}"
              + (f" feed={feed}" if feed else "")
              + (f" ERROR={err}" if err else ""))
        for p in posts:
            p["source_name"] = src["name"]
        all_posts.extend(posts)
        time.sleep(delay)

    if args.check_sources:
        print("\n--- summary ---")
        for name, mode, feed, n, err in report:
            status = "OK" if n else "NO POSTS"
            print(f"{status:9s} {name:42s} mode={mode:5s} n={n:3d} {feed or ''} {err or ''}")
        print("\nPut any discovered feed URLs into sources.json as feed_url, "
              "and set fetch_mode explicitly, so real runs skip discovery.")
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

    assets = load_our_assets()
    print(f"[assets] {len(assets['plans_by_topic'])} plan topic buckets, "
          f"{len(assets['members_artifacts'])} members artifacts, "
          f"{len(assets['methodology_sections'])} methodology sections")

    existing = []
    conn = None
    if not args.dry_run:
        conn = connect()
        with conn.cursor() as cur:
            cur.execute("SELECT working_title FROM content_ideas ORDER BY created_at DESC LIMIT 150")
            existing = [r[0] for r in cur.fetchall()]

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        sys.exit("GOOGLE_API_KEY is not set.")
    model = os.environ.get("CONTENT_MODEL", "gemini-3.5-flash")

    prompt = PROMPT.format(
        n=settings.get("ideas_per_run", 12),
        sources=json.dumps([{"source": p["source_name"], "title": p["title"],
                             "summary": p.get("summary", "")[:300], "url": p["url"]}
                            for p in recent[:120]], ensure_ascii=False, indent=1),
        assets=json.dumps(assets, ensure_ascii=False, indent=1)[:6000],
        existing=json.dumps(existing, ensure_ascii=False),
    )

    print(f"[model] calling {model}...")
    result = call_model(prompt, api_key, model)
    ideas = result.get("ideas", [])
    print(f"[model] returned {len(ideas)} ideas")

    if args.dry_run:
        for i in ideas:
            print(f"\n  [{i.get('language')}] {i.get('working_title')}")
            print(f"      type={i.get('article_type')} cta={i.get('cta_type')} "
                  f"score={i.get('score')} sources={i.get('source_count')}")
            print(f"      angle: {i.get('angle','')[:150]}")
            print(f"      assets: {i.get('our_assets')}")
        return

    kept, dropped = save_ideas(conn, ideas)
    print(f"[db] saved {kept} ideas, dropped {len(dropped)}")
    for title, why in dropped:
        print(f"     dropped: {title[:60]} — {why}")

    notify_if_ready(conn, settings.get("notify_threshold", 8))
    conn.close()


if __name__ == "__main__":
    main()
