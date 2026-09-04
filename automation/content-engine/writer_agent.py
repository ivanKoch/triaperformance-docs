#!/usr/bin/env python3
"""
Writer agent — Agent 2 of the content engine.

Takes ideas Iván approved and turns each into a draft article, stored in
Postgres for review at /admin/drafts/. It writes drafts. It does not publish,
and it does not decide what to write about.

    content_ideas.status = APPROVED   ->   this script   ->   content_pieces.DRAFTED

WHY NOT HERMES: this is one long generation from a carefully assembled prompt,
not an agentic loop that needs tools or memory. Hermes earns its keep when
something must decide what to do next; here the decision was already made at the
idea stage. Same reasoning as the research agent — and it matches the standing
rule from ai-infrastructure-documentation.md problem #7: narrow the agent to
calling tested logic rather than authoring it.

WHY A STRONGER MODEL: the research agent runs flash because idea generation is
short and structured. Long-form writing in a specific brand voice is exactly the
sustained-reasoning task flash is documented to be weak at. Set WRITER_MODEL.

USAGE
    python3 writer_agent.py --queue              show approved ideas awaiting a draft
    python3 writer_agent.py --dry-run            write one draft, print it, save nothing
    python3 writer_agent.py --limit 3            draft the top 3 approved ideas
    python3 writer_agent.py --translate 7        produce EN+PT siblings of piece 7
    python3 writer_agent.py                      draft everything in the queue

ENVIRONMENT (read automatically from ~/.hermes/.env and ~/.analytics/.env)
    GOOGLE_API_KEY   Gemini key
    WRITER_MODEL     defaults to gemini-3.1-pro-preview.
                     A "-preview" tier is not what we wanted — the pinned-version
                     rule from ai-infrastructure-documentation.md would prefer a
                     stable release. But as of July 2026 every stable pro model
                     on this key (2.5-pro, 3-pro-preview) returns "no longer
                     available to new users", so preview is the only pro tier
                     that answers. Consequence: Google may withdraw it. If the
                     writer suddenly fails, that is the first thing to check:
                       python3 research_agent.py --test-models

                     NOTE, August 17, 2026 — the paragraph above is still true
                     about *pro* models, and that is now the whole point: Google
                     shipped 3.6 and 3.7 on the flash line and left pro at 3.1.
                     There is no 3.7 Pro. Google's own migration guide names
                     gemini-3.7-flash the recommended target for 3.5-flash,
                     3-flash-preview AND 3.1-pro-preview — i.e. it claims to
                     supersede the model this default names, while being GA
                     rather than -preview and ~1/3 the cost.

                     The default has deliberately NOT been changed. Every
                     3.7 benchmark Google published is coding and agentic; none
                     of it measures Spanish prose in a specific brand voice,
                     which is this agent's only job. "WHY A STRONGER MODEL"
                     above is a claim about tiers, and the tiers moved.

                     UPDATE, September 4, 2026 — the reasoning above is
                     unchanged and the comparison target moved to
                     gemini-3.8-flash. Google's 3.8 evidence is DeepSWE, Vals
                     Finance Agent V2, Harvey Legal and HLE-Verified: coding,
                     agentic, multi-step reasoning. Nothing on multilingual or
                     long-form prose, which is the only thing this agent does.
                     So 3.8 gives this decision no new information — it changes
                     which model to draft against, not how to decide. The
                     research agent and Hermes moved to 3.8 that day; this
                     default did not, for the third release running.

                     DECIDED, September 4, 2026 (Iván): the writer uses pro.
                     Settled, not deferred. The comparison this docstring used
                     to prescribe -- draft the same idea on both and read the
                     Spanish -- was open from August 17 across three Flash
                     releases and was closed by a call rather than by a test,
                     which is a legitimate way for a question like this to end.

                     Do NOT re-open this on the next Flash release and do NOT
                     re-propose the comparison. This docstring is where a future
                     session goes looking, and it had been carrying "settle it
                     by comparison" as a live instruction.

                     What WOULD legitimately re-open it: Google publishing
                     multilingual or long-form-prose evaluation for the flash
                     line, or gemini-3.1-pro-preview ceasing to answer --
                     confirmed callable September 4, 2026, and the check is
                       python3 research_agent.py --test-models
                     A new flash release on coding and agentic benchmarks is
                     not a reason, however large the numbers; that is the proxy
                     substitution ai-infrastructure-documentation.md §33
                     rejected in August.
    PG_*             Postgres connection
"""

import argparse
import glob
import json
import os
import re
import sys
import unicodedata

from research_agent import load_env, connect, call_model, read_env_files

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))

# Real published articles, used as voice examples. Few-shot on actual output
# beats any amount of describing the voice in prose.
STYLE_EXAMPLES = {
    "es": "site/blog/entrenar-el-umbral-sin-tiras-de-lactato.njk",
    "en": "site/en/blog/threshold-training-without-lactate-strips.njk",
    "pt": "site/pt/blog/treinar-o-limiar-sem-tiras-de-lactato.njk",
}

BLOG_DIR = {"es": "site/blog", "en": "site/en/blog", "pt": "site/pt/blog"}

# CLOSED vocabulary — the blog listing's topic filter reads this and nothing
# else. Kept in lockstep with `topics` in site/_data/i18n.json, which holds the
# per-language labels; these slugs are the data, those are presentation.
#
# Why a second field when `category` already existed: `category` is free text,
# and across the first 60 articles the writer invented 35 distinct values in
# three languages — "Entrenamiento", "Training", "Treinamento", "Training
# Science", "Treinamento de Corrida" and so on. Nothing that varies per article
# and per language can drive a filter. `category` survives as the fine-grained
# label on the article page; `topic` is the structural key.
#
# `weight-loss` is a theme sitting among sports, which is untidy — it is here on
# commercial grounds: weight-loss plans are around half of recent plan sales,
# and filing those articles under running and cycling buries them.
TOPICS = ("running", "cycling", "swimming", "triathlon", "nutrition",
          "recovery", "physiology", "strength", "weight-loss")


def slugify(text):
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^a-zA-Z0-9\s-]", "", text).strip().lower()
    return re.sub(r"[\s_-]+", "-", text)[:70].strip("-")


def read_repo(path, limit=None):
    full = os.path.join(REPO, path)
    if not os.path.exists(full):
        return ""
    s = open(full, encoding="utf-8").read()
    return s[:limit] if limit else s


def style_example(lang):
    """The body of a real published article in this language, front matter stripped."""
    raw = read_repo(STYLE_EXAMPLES.get(lang, STYLE_EXAMPLES["es"]))
    return raw.split("---", 2)[-1].strip()[:7000]


def brand_voice():
    """The voice section of the brand guidelines, verbatim."""
    doc = read_repo("brand-guidelines.md")
    m = re.search(r"## 8\. Voice(.*?)(?=\n## )", doc, re.S)
    return m.group(1).strip() if m else ""


def methodology_for(idea):
    """Pull the methodology sections this idea claims to draw on."""
    doc = read_repo("methodology.md")
    assets = idea.get("our_assets") or []
    if isinstance(assets, str):
        assets = json.loads(assets)
    wanted = [a for a in assets if re.match(r"^\s*\d+\.", str(a).split(":")[-1].strip())
              or "methodology" in str(a).lower()]
    out = []
    for a in wanted:
        num = re.search(r"(\d+)\.", str(a))
        if not num:
            continue
        m = re.search(rf"^## {num.group(1)}\..*?(?=\n## |\Z)", doc, re.S | re.M)
        if m:
            out.append(m.group(0)[:3000])
    return "\n\n".join(out)


def plan_candidates(plans, idea):
    """Plans matching the idea's topic, as id + name + language.

    The writer names a plan_id; the planCard shortcode joins the real URL at
    build time. This list is what it may choose from — nothing else exists.
    """
    assets = idea.get("our_assets") or []
    if isinstance(assets, str):
        assets = json.loads(assets)
    langmap = {"es": "Spanish", "en": "English", "pt": "Portuguese"}
    want_lang = langmap[idea["language"]]
    keys = [str(a).split("(")[0].strip() for a in assets if "/" in str(a)]
    out = []
    for p in plans["all"]:
        if p["language"] != want_lang:
            continue
        topic = f"{p['sport']} / {p['distance']}"
        if any(k and k in topic for k in keys):
            out.append({"plan_id": p["id"], "name": p["name"][:80],
                        "weeks": p["weeks"], "difficulty": p["difficulty"],
                        "metric": p["metric"], "gym": p["strength"], "price": p["price"]})
    return out[:40]



# ---------------------------------------------------------------------------
# INTERNAL LINKS
#
# The writer invents internal URLs. It has invented the same ones twice: on
# Sept 1, 2026 `/calculadora-de-zonas/cycling/` (an English path segment inside
# a Spanish URL) and `/coaching/` (never a page — Coaching is the homepage
# anchor `/#coaching`); on Sept 4 both were back, in different articles, plus
# five more. Every one is a plausible guess at a page the model believes should
# exist.
#
# `tests/internal-links.test.js` catches them at build time, which is how they
# were found — but it runs on demand and it runs AFTER the article is written,
# reviewed and published. The plan links have not had this problem once, and the
# reason is structural: the writer names a plan_id and the shortcode joins the
# real URL. It links from data instead of from memory.
#
# This is that same fix for pages. The URL set is derived from `site/` at run
# time, so it cannot go stale the way a hand-kept whitelist would — that was the
# objection recorded in tests/internal-links.test.js, and it is answered by
# deriving rather than by listing.
#
# The set is deliberately PUBLIC pages only. `/members/*` is gated: an article
# linking one sends a non-subscriber into a login wall, which is the gated_teaser
# rule ("link {all_access_path} for the membership") broken in the one place it
# matters. One live article did exactly that until Sept 4, 2026.
# ---------------------------------------------------------------------------

LANG_PREFIX = {"es": "", "en": "/en", "pt": "/pt"}

# Assets an article may legitimately deep-link. Extensions, not paths, so a new
# guide in the same folder needs no change here.
LINKABLE_ASSET_DIRS = ("/assets/guias/",)


def _front_matter(path):
    txt = open(path, encoding="utf-8").read()
    if not txt.startswith("---"):
        return {}, txt
    fm = txt.split("---", 2)[1]
    get = lambda k: (m.group(1).strip().strip('"')
                     if (m := re.search(rf"^{k}:\s*(.*)$", fm, re.M)) else "")
    return {"title": get("title"), "headline": get("headline"),
            "noindex": get("noindex").lower() == "true",
            "lang": get("lang")}, txt


def _dir_data_noindex(root, dirpath):
    """`noindex` as Eleventy resolves it: directory data files, then front matter.

    Not a detail. The whole /members/ tree is gated by ONE line in
    site/members/members.json, not by front matter on 40 pages — so a check that
    reads only front matter would hand the writer every gated page in the site
    and call them public. Walking the directory chain means a folder gated in
    future is excluded here the day it is gated, with no second edit.
    """
    flag = False
    parts = os.path.relpath(dirpath, root).split(os.sep)
    parts = [] if parts == ["."] else parts
    for i in range(len(parts) + 1):
        d = os.path.join(root, *parts[:i])
        for jf in sorted(glob.glob(os.path.join(d, "*.json"))):
            try:
                data = json.load(open(jf, encoding="utf-8"))
            except (ValueError, OSError):
                continue
            if isinstance(data, dict) and "noindex" in data:
                flag = bool(data["noindex"])
    return flag


def site_links(lang):
    """Every public URL an article in `lang` may link, read from site/.

    Derived, not listed: a directory holding an index.njk/index.md IS a page,
    which is exactly Eleventy's own rule (only the three plan templates and
    sitemap.njk set an explicit permalink, and none of them belongs here).

    Excluded on purpose:
      * `noindex: true` — gated or private pages (/members/*, /ai-systems/).
      * the other two languages — a Spanish article linking /en/all-access/ is
        a broken promise even though the URL resolves.
      * plan pages — those are planCard's job and always have been.
    """
    root = os.path.join(REPO, "site")
    prefix = LANG_PREFIX[lang]
    out = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames
                       if d not in ("_includes", "_data", "assets", "p")]
        idx = next((f for f in ("index.njk", "index.md") if f in filenames), None)
        if not idx:
            continue
        rel = os.path.relpath(dirpath, root)
        url = "/" if rel == "." else "/" + rel.replace(os.sep, "/") + "/"
        # Language ownership by path prefix. "" (Spanish) owns everything that
        # is not under /en/ or /pt/.
        owner = "/en" if url.startswith("/en/") else "/pt" if url.startswith("/pt/") else ""
        if owner != prefix:
            continue
        fm, _ = _front_matter(os.path.join(dirpath, idx))
        if fm.get("noindex") or _dir_data_noindex(root, dirpath):
            continue
        out.append({"url": url,
                    "page": fm.get("headline") or fm.get("title") or url})
    # Published articles in this language, from the files the site serves — the
    # same source research_agent.published_corpus() reads, and the same reason.
    blog_dir = {"es": "site/blog", "en": "site/en/blog", "pt": "site/pt/blog"}[lang]
    for path in sorted(glob.glob(os.path.join(REPO, blog_dir, "*.njk"))):
        if path.endswith("index.njk"):
            continue
        fm, _ = _front_matter(path)
        slug = os.path.basename(path)[:-4]
        out.append({"url": f"{prefix}/blog/{slug}/",
                    "page": fm.get("headline") or slug})
    return sorted(out, key=lambda r: r["url"])


def allowed_urls(lang):
    """The link whitelist as a set, plus the anchors that are real pages."""
    urls = {r["url"] for r in site_links(lang)}
    # Homepage section anchors. These are sections, not pages, so no index.njk
    # exists for them and they have to be named. `#coaching` is the one the
    # writer has invented as `/coaching/` twice.
    home = LANG_PREFIX[lang] + "/"
    urls |= {home + a for a in ("#coaching", "#planes", "#contacto")}
    return urls


def check_links(body, lang):
    """Reject internal links that do not exist. The hard stop.

    A prompt rule is a request; this is the check. The repo has learned that
    difference twice already — the duplicate-idea screen went from a prompt line
    the agent said it had followed to `screen_ideas()` computing it, and plan
    links have never broken because the shortcode makes inventing one impossible.
    """
    allowed = allowed_urls(lang)
    problems = []
    seen = set()
    for raw in re.findall(r'href="([^"]+)"', body):
        # Own-domain absolute URLs are the same link with a hostname glued on,
        # and they slipped past the build guard for exactly that reason.
        m = re.match(r"https?://(?:www\.)?triaperformance\.com(/.*)?$", raw)
        if m:
            problems.append(f"absolute own-domain link {raw} — write it root-relative")
            raw = m.group(1) or "/"
        if not raw.startswith("/") or raw.startswith("//"):
            continue
        if raw in seen:
            continue
        seen.add(raw)
        path = raw.split("?")[0]
        if path.startswith(LINKABLE_ASSET_DIRS):
            continue
        base, _, frag = path.partition("#")
        if base and not base.endswith("/"):
            base += "/"
        candidate = base + ("#" + frag if frag else "")
        if candidate in allowed or (not frag and base in allowed):
            continue
        problems.append(
            f"links {raw}, which is not a page of the {LANG_NAME[lang]} site")
    return problems

PROMPT = """You are writing a blog article for Triaperformance, Iván Koch's triathlon and running coaching business. Write it in {language_name}, natively — not translated.

THE IDEA (already approved; do not change its angle or its offer)
{idea}

BRAND VOICE — follow this exactly
{voice}

A REAL PUBLISHED ARTICLE, for tone and structure. Match this register, this level
of specificity, and this willingness to state an opinion. Do not copy its content.
<example>
{example}
</example>

TRIAPERFORMANCE METHODOLOGY — the source of anything technical you assert
{methodology}

PLANS YOU MAY LINK (only these; see the rule below)
{plans}

PAGES YOU MAY LINK (only these; url + what the page is)
{site_links}

HARD RULES
0. NEVER WRITE AN INTERNAL URL FROM MEMORY. Every internal link must be copied,
   character for character, from the page list above. If the page a sentence
   wants does not appear there, it does not exist — rewrite the sentence without
   the link. Do not guess a slug, do not translate a slug, and do not add a
   sport to the end of one. A draft containing a URL that is not on that list is
   rejected before review, so this costs you the whole article.
1. NEVER write a TrainingPeaks URL. To link a plan, emit the shortcode exactly:
   {{% planCard "PLAN_ID", "one sentence on who this plan is for" %}}
   using a plan_id from the list above. A URL you invent will be a dead link.
2. Article type is `{article_type}` and the offer is `{cta_type}`. Honour it:
   - plan_guide  -> route to specific plans with planCard
   - education   -> may sell nothing. Do not force a CTA the article hasn't earned.
   - gated_teaser-> the article must be COMPLETE and useful standing alone. The
                    paywall holds the *execution artifact* (a routine, a
                    calculator, a spreadsheet), NEVER the understanding. Link
                    {all_access_path} for the membership.
   - case_study  -> only real athletes and real numbers from the methodology doc.
                    Never invent an athlete, a time, or a result.
   - gear        -> affiliate-oriented.
3. ONE topic. If you find yourself changing subject, cut the section instead.
   Every section must hand off to the next.
4. Numbers over adjectives. Any figure must come from the methodology or the
   plan list above. Do not invent statistics, study findings or percentages.
5. No hype vocabulary. No exclamation marks. Second person, informal-professional.
6. PLAN SPREAD. If you link more than two plans, the set must vary on the axes a
   reader actually chooses by — `weeks` (12 vs 18) AND `metric` (pace vs hr).
   Six plans that are all `metric: pace` tells every heart-rate athlete you have
   nothing for them. Both fields are in the plan list above; read them. If the
   catalogue genuinely only offers one metric for this topic, say so in one
   sentence rather than leaving the reader to notice.
7. `category` is written in {language_name}, like every other field. Not English.

STRUCTURE
- 1200-1700 words.
- Plain HTML: <p>, <h2>, <h3>, <ul>/<li>, <table>, <strong>, <em>, <hr>.
- No <h1> — the layout renders the headline.
- Use <div class="datanote">...</div> for a boxed callout: a key number, a
  worked example, or the offer. Two or three at most.
- End with a section that concedes the strongest counter-argument honestly,
  then says why the advice still holds.

OUTPUT FORMAT — exactly this, nothing before or after. Two blocks separated by
the ===BODY=== marker. The article HTML goes AFTER the marker, as plain text —
never inside the JSON, and never escaped.

`topic` is ONE of exactly these, verbatim, lowercase — it drives the blog's
topic filter and anything else is dropped: {topic_list}
Pick the one a reader browsing for this article would click. `category` is your
own free-text label for the article page and may be more specific.

===META===
{{"headline":"the H1","short_title":"3-5 words for the breadcrumb","title":"SEO title | Triaperformance","standfirst":"one sentence under the H1","description":"meta description, 150-160 chars","topic":"one slug from the list above","category":"2-3 words","reading_time":8,"slug":"url-slug-in-{language_code}"}}
===BODY===
<p>the full article HTML, written normally</p>
"""

TRANSLATE_PROMPT = """Adapt this published Triaperformance article into {language_name}.

This is NOT a translation. Write it natively for that market, and adapt anything
the local catalogue changes — different plans available, different prices,
different races. Keep the argument, the structure and the opinions identical.

MARKET NOTES
{market_notes}

BRAND VOICE
{voice}

PLANS AVAILABLE IN THIS LANGUAGE (only these)
{plans}

PAGES YOU MAY LINK IN THIS LANGUAGE (only these; url + what the page is)
{site_links}

THE SOURCE ARTICLE
Headline: {headline}
Standfirst: {standfirst}
<body>
{body}
</body>

RULES
- INTERNAL LINKS ARE NOT TRANSLATED, THEY ARE REPLACED. The source article's
  URLs belong to the source language and none of them is valid here. For every
  link in the source, find the equivalent page in the list above and copy that
  URL exactly; if there is no equivalent, keep the sentence and drop the link.
  Never take a source URL and translate its words — that is how
  `/pt/calculadora-de-zonas/running/` was written for a page that is
  `/pt/calculadora-de-zonas/corrida/`.
- Same planCard rule: {{% planCard "PLAN_ID", "..." %}}, only ids from the list.
  If a plan referenced in the source has no equivalent here, drop that card
  rather than substituting something that isn't the same plan. The list above is
  already filtered to this market and this topic — an id that is not in it does
  not exist for this reader, whatever the source article linked.
- If you link more than two plans, vary them on `weeks` and on `metric`
  (pace vs hr). All-one-metric is a dead end for half the audience.
- `category` is written in {language_name}, not English and not Spanish.
- Prices and product scope differ per market — use the ones in the market notes.
- Keep every number that is physiological (percentages, durations, protocols).
- NEVER CHANGE THE RACE. If the source article is about a specific race, this
  version is about that same race. Two reasons, both hard:
  (a) hreflang. These language versions are declared to search engines as the
      SAME page translated. An English article about a different race is not a
      translation of the Spanish one, and the declaration becomes false.
  (b) Search intent. Someone searching "Valencia marathon training plan" in
      English has already entered Valencia. That is high-intent, low-competition
      traffic. Substituting a large domestic race trades it for a keyword we
      would be competing for against every coach in that country.
  The races listed in the market notes are for articles that name no specific
  race — use them as examples, never as replacements.
- If you do change any other concrete referent for this market, every claim
  downstream of it must be true of the NEW one. Course profile, elevation,
  weather and date are properties of a specific race, not of races in general.
  If you don't know them, write without that specificity. Never invent a date,
  a course description or a finisher time.

OUTPUT FORMAT — exactly this, nothing before or after:

===META===
{{"headline":"...","short_title":"...","title":"... | Triaperformance","standfirst":"...","description":"...","category":"...","reading_time":8,"slug":"url-slug"}}
===BODY===
<p>the full article HTML, written normally, NOT inside the JSON</p>
"""

# The race lists here are EXAMPLES for articles that name no specific race.
# They are not substitutions: an English article about the race the Spanish one
# covers is the point, since the reader searching it in English has already
# entered that race. See the "NEVER CHANGE THE RACE" rule in TRANSLATE_PROMPT.
MARKET_NOTES = {
    "en": "Audience is English-speaking, mostly but not only the US — many read "
          "in English while racing in Europe. All-Access is US$39.99/mo and "
          "includes every plan in the catalogue. Link /en/all-access/. Give paces "
          "in both min/km and min/mile. If the article needs an example race and "
          "the source names none: NYC, Chicago, Boston, California International.",
    # CORRECTED September 4, 2026. This read "covers running, cycling and
    # triathlon plans only (not swimming, HYROX or weight loss)" and "the
    # Portuguese catalogue only has marathon, 5k, 10k, 21k and FTP". Both were
    # false, and they are the SAME false belief that /pt/all-access/ carried
    # until it was fixed earlier the same day: the narrow list is a legacy of
    # the product's TrainingPeaks Payments title, never a scope decision. The
    # live Portuguese catalogue is 53 plans across running (28), cycling (9),
    # triathlon (8), swimming (4) and duathlon (4), weight-loss and HYROX
    # included — so this note was steering Brazilian readers away from 22 plans
    # they can already run. Counts are not restated in prose anywhere: the page
    # renders plans.counts.byLang.pt, and this note names no number on purpose.
    "pt": "Audience is BRAZIL, not Portugal — write Brazilian Portuguese. Acesso "
          "Total is US$29.99/mo and includes every plan in the PORTUGUESE "
          "catalogue — running, cycling, triathlon, swimming and duathlon, "
          "weight-loss and HYROX included. Link /pt/all-access/. Plans in other "
          "languages are not part of this product: the plan list above is "
          "already filtered, so link only from it. If an example race is needed "
          "and the source names none: Rio, São Paulo.",
    "es": "Audience is Spain and Latin America. All-Access is US$39.99/mo and "
          "includes every plan. Link /all-access/. Use voseo where natural.",
}
LANG_NAME = {"es": "Spanish", "en": "English", "pt": "Portuguese"}


def parse_draft(text):
    """Split the model's reply into metadata JSON and raw HTML body.

    The first version asked for everything in one JSON object with the article
    inside a `body` string. A 1,500-word HTML article contains hundreds of
    quotes and angle brackets, and one missed escape invalidates the whole
    response — which is exactly what happened: a complete, good article was
    thrown away over a stray quote 9,500 characters in. Keeping the prose
    outside the JSON removes the failure mode rather than defending against it.

    But we accept the old shape too. A generation costs real money, and a reply
    that happens to be valid JSON with a body in it is a perfectly good article
    — refusing it because it arrived in last week's format is throwing away
    something that works. Parse what the model sent; only fail if it's
    unusable.
    """
    text = text.strip()
    if "===BODY===" not in text:
        # No marker. If it's parseable JSON carrying a body, take it.
        cleaned = re.sub(r"^```(?:json)?|```$", "", text, flags=re.M).strip()
        try:
            draft = json.loads(cleaned)
        except json.JSONDecodeError as e:
            raise ValueError(
                "model reply has no ===BODY=== marker and is not valid JSON "
                f"({e}); got: " + text[:300].replace("\n", " ")) from None
        if not isinstance(draft, dict) or not draft.get("body"):
            raise ValueError("model reply has no ===BODY=== marker and no body "
                             "field; got: " + text[:300].replace("\n", " "))
        return draft
    meta_part, body = text.split("===BODY===", 1)
    meta_part = meta_part.replace("===META===", "").strip()
    meta_part = re.sub(r"^```(?:json)?|```$", "", meta_part, flags=re.M).strip()
    draft = json.loads(meta_part)
    body = re.sub(r"^```(?:html)?|```$", "", body.strip(), flags=re.M).strip()
    draft["body"] = body
    return draft


def build_draft(idea, plans, model, api_key):
    cands = plan_candidates(plans, idea)
    prompt = PROMPT.format(
        language_name=LANG_NAME[idea["language"]],
        language_code=idea["language"],
        idea=json.dumps({k: str(v) for k, v in idea.items()
                         if k in ("working_title", "angle", "rationale", "target_query",
                                  "article_type", "cta_type", "cta_target", "our_assets")},
                        ensure_ascii=False, indent=1),
        voice=brand_voice(),
        example=style_example(idea["language"]),
        methodology=methodology_for(idea)[:8000],
        plans=json.dumps(cands, ensure_ascii=False, indent=1)[:4000] or "none — do not link plans",
        article_type=idea["article_type"],
        cta_type=idea["cta_type"],
        topic_list=", ".join(TOPICS),
        all_access_path={"es": "/all-access/", "en": "/en/all-access/",
                         "pt": "/pt/all-access/"}[idea["language"]],
        site_links="\n".join(f"{r['url']}  — {r['page']}"
                             for r in site_links(idea["language"])),
    )
    return parse_draft(call_model(prompt, api_key, model, expect="text"))


def validate(draft, plans, lang):
    """Reject anything the writer got structurally wrong before it reaches review."""
    problems = []
    for field in ("headline", "title", "description", "body", "slug"):
        if not draft.get(field):
            problems.append(f"missing {field}")
    # An off-list topic isn't a cosmetic problem: the listing filter matches on
    # the slug, so a card with an invented topic renders with no label and is
    # unreachable from every pill. Better to reject the draft than to publish an
    # article that can only be found by scrolling.
    if draft.get("topic") not in TOPICS:
        problems.append(f"topic {draft.get('topic')!r} is not one of: {', '.join(TOPICS)}")
    body = draft.get("body", "")
    if "trainingpeaks.com" in body.lower():
        problems.append("contains a hand-written TrainingPeaks URL — must use planCard")
    if "<h1" in body.lower():
        problems.append("contains an <h1>; the layout renders the headline")
    # The build guard catches a plan_id that doesn't resolve. It cannot catch a
    # plan_id that resolves to the WRONG LANGUAGE — a Spanish TrainingPeaks plan
    # linked from an English article builds cleanly and sells nothing. This is
    # the only place that can be caught, so it is caught here.
    want_lang = LANG_NAME[lang]
    for pid in re.findall(r'planCard\s+"(\d+)"', body):
        p = plans["byId"].get(pid)
        if not p:
            problems.append(f"planCard references unlinkable plan {pid}")
        elif p["language"] != want_lang:
            problems.append(
                f"planCard {pid} is a {p['language']} plan in a {want_lang} article")
    problems += check_links(body, lang)
    words = len(re.sub(r"<[^>]+>", " ", body).split())
    if words < 700:
        problems.append(f"only {words} words — too thin")
    return problems


def save_piece(conn, draft, idea=None, parent=None, lang=None, model=None):
    lang = lang or idea["language"]
    trans_key = (parent["trans_key"] if parent
                 else slugify(draft.get("short_title") or draft["headline"]))
    slug = slugify(draft["slug"] or draft["headline"])
    # A translation INHERITS its parent's topic rather than choosing again.
    # Language siblings are declared to search engines as the same page, so two
    # of them under different topics would put the same article in two places
    # in the filter and make the pill row disagree with the language switcher.
    topic = (parent.get("topic") if parent and parent.get("topic")
             else draft.get("topic"))
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO content_pieces
              (idea_id, parent_id, language, slug, title, headline, short_title,
               standfirst, description, category, topic, trans_key, reading_time,
               body, original_body, model_used, file_path)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (language, slug) DO NOTHING
            RETURNING id
        """, (idea["id"] if idea else None, parent["id"] if parent else None,
              lang, slug, draft["title"], draft["headline"], draft.get("short_title"),
              draft.get("standfirst"), draft["description"], draft.get("category"),
              topic, trans_key, draft.get("reading_time"), draft["body"], draft["body"],
              model, f"{BLOG_DIR[lang]}/{slug}.njk"))
        row = cur.fetchone()
        if row and idea:
            cur.execute("UPDATE content_ideas SET status='WRITTEN' WHERE id=%s", (idea["id"],))
    conn.commit()
    return row[0] if row else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--queue", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--translate", type=int, metavar="PIECE_ID")
    ap.add_argument("--auto-translate", action="store_true",
                    help="find every approved/published original missing a language "
                         "sibling and write it. --limit caps how many ARTICLES "
                         "(each costs up to two generations).")
    args = ap.parse_args()

    load_env()
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        sys.exit("No model API key found. Run: python3 research_agent.py --show-env")
    # Say where the value came from. "model: X" alone is not enough when X is
    # not what you just configured — the question is always which source won.
    env_model = read_env_files().get("WRITER_MODEL")
    if os.environ.get("WRITER_MODEL"):
        model, src = os.environ["WRITER_MODEL"], "shell environment"
    elif env_model:
        model, src = env_model, "~/.hermes/.env or ~/.analytics/.env"
    else:
        model, src = "gemini-3.1-pro-preview", "built-in default"
    print(f"[writer] model: {model}  (from {src})")

    # Plan catalogue, from the same CSV and link-status file the site build reads.
    plans = load_plans()

    conn = connect()

    if args.translate:
        translate(conn, args.translate, plans, model, api_key, args.dry_run)
        return

    if args.auto_translate:
        auto_translate(conn, plans, model, api_key, args.dry_run, args.limit)
        return

    import psycopg2.extras
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT * FROM ideas_awaiting_draft")
        queue = cur.fetchall()

    print(f"[writer] {len(queue)} approved idea(s) awaiting a draft")
    for q in queue:
        print(f"    [{q['id']}] {q['language']} · {q['article_type']} · {q['working_title'][:60]}")
    if args.queue or not queue:
        return

    for idea in (queue[: args.limit] if args.limit else queue):
        print(f"\n[writer] drafting idea {idea['id']}: {idea['working_title'][:60]}")
        draft = build_draft(dict(idea), plans, model, api_key)
        problems = validate(draft, plans, idea["language"])
        if problems:
            print("  REJECTED — " + "; ".join(problems), file=sys.stderr)
            continue
        if args.dry_run:
            print(f"  headline: {draft['headline']}")
            print(f"  slug    : {draft['slug']}")
            print(f"  words   : {len(re.sub(r'<[^>]+>', ' ', draft['body']).split())}")
            print(f"  planCards: {re.findall(r'planCard .([0-9]+)', draft['body'])}")
            print("\n" + draft["body"][:1500] + "\n...")
            break
        pid = save_piece(conn, draft, idea=dict(idea), model=model)
        print(f"  saved as piece {pid} — review at /admin/drafts/")

    conn.close()


def load_plans():
    """Same catalogue the site build reads, filtered to linkable plans."""
    import csv as _csv
    inv = os.path.join(REPO, "data", "training_plans_inventory.csv")
    status_path = os.path.join(REPO, "data", "plan_link_status.json")
    dead = set()
    if os.path.exists(status_path):
        st = json.load(open(status_path, encoding="utf-8")).get("plans", {})
        dead = {k for k, v in st.items() if v.get("status") in (404, 410)}
    byId, all_ = {}, []
    with open(inv, encoding="utf-8-sig", newline="") as fh:
        for r in _csv.DictReader(fh):
            pid = (r.get("plan_id") or "").strip()
            if not pid or pid in byId or pid in dead:
                continue
            if (r.get("is_published") or "").strip() != "TRUE":
                continue
            link = (r.get("link") or "").strip()
            if not link or link == "Expired":
                continue
            p = {"id": pid, "name": (r.get("plan_name") or "").strip(),
                 "language": (r.get("language") or "").strip(),
                 "sport": (r.get("sport") or "").strip(),
                 "distance": (r.get("distance") or "").strip(),
                 "difficulty": (r.get("difficulty") or "").strip(),
                 "weeks": (r.get("weeks") or "").strip(),
                 "price": (r.get("price") or "").strip(),
                 "metric": "hr" if r.get("hr_based") == "TRUE" else (
                     "power" if r.get("power_based") == "TRUE" else "pace"),
                 "strength": r.get("strength") == "TRUE"}
            byId[pid] = p
            all_.append(p)
    print(f"[writer] {len(all_)} linkable plans loaded")
    return {"byId": byId, "all": all_}


def auto_translate(conn, plans, model, api_key, dry_run, limit=0):
    """Give every signed-off article its two missing language siblings.

    Runs unattended off the daily cron, so it is deliberately conservative:

    - Only APPROVED or PUBLISHED sources. A translation inherits its parent's
      argument wholesale, so translating a draft you haven't read yet would
      multiply an unreviewed opinion by three.
    - Only originals (parent_id IS NULL). Translating a translation compounds
      drift, and the result would claim the wrong parent.
    - Skips languages that already exist, so re-running costs nothing.

    The siblings land in DRAFTED like anything else — this automates the typing,
    not the judgement.
    """
    import psycopg2.extras
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT p.id, p.language, p.headline,
                   (SELECT count(*) FROM content_pieces c WHERE c.parent_id = p.id) AS siblings
            FROM content_pieces p
            WHERE p.parent_id IS NULL
              AND p.status IN ('APPROVED', 'PUBLISHED')
              AND (SELECT count(*) FROM content_pieces c WHERE c.parent_id = p.id) < 2
            ORDER BY p.id
        """)
        queue = cur.fetchall()

    print(f"[writer] {len(queue)} article(s) missing a language sibling")
    for q in queue:
        print(f"    [{q['id']}] {q['language']} · {2 - q['siblings']} missing · "
              f"{q['headline'][:55]}")
    if not queue:
        return
    for q in (queue[:limit] if limit else queue):
        translate(conn, q["id"], plans, model, api_key, dry_run)


def translate(conn, piece_id, plans, model, api_key, dry_run):
    import psycopg2.extras
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT * FROM content_pieces WHERE id=%s", (piece_id,))
        src = cur.fetchone()
    if not src:
        sys.exit(f"piece {piece_id} not found")
    if src["status"] not in ("APPROVED", "PUBLISHED"):
        sys.exit(f"piece {piece_id} is {src['status']} — approve it before translating, "
                 "so the siblings inherit an article you've actually signed off on")

    # Languages this piece already has. Without this check a re-run regenerates
    # a sibling that exists, pays for it, and then loses it to the
    # ON CONFLICT (language, slug) DO NOTHING in save_piece — a silent charge
    # for nothing. Matters far more now that a cron does the re-running.
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT language FROM content_pieces WHERE parent_id=%s", (piece_id,))
        already = {r["language"] for r in cur.fetchall()}

    # Which plans the source article linked, so the siblings are offered the
    # SAME topic in their own market — not the first 40 rows of the catalogue,
    # which for English is mostly not marathon plans at all.
    src_topics = set()
    for pid in re.findall(r'planCard\s+"(\d+)"', src["body"] or ""):
        p = plans["byId"].get(pid)
        if p:
            src_topics.add((p["sport"], p["distance"]))

    targets = [l for l in ("es", "en", "pt")
               if l != src["language"] and l not in already]
    if already:
        print(f"[writer] piece {piece_id} already has: {', '.join(sorted(already))}")
    if not targets:
        print(f"[writer] piece {piece_id} has all three languages — nothing to do")
        return
    for lang in targets:
        print(f"\n[writer] adapting piece {piece_id} into {LANG_NAME[lang]}")
        # An article that linked no plans is an EDUCATION piece, and it gets no
        # plan list at all. Ivan's call, Sep 2 2026: passing one is too risky.
        #
        # This used to read `not src_topics or (...) in src_topics`, so an empty
        # src_topics short-circuited to True and handed the translator EVERY plan
        # in the target language -- 111 English rows, 53 Portuguese -- as link
        # candidates for a piece the Spanish original had deliberately not used
        # to sell anything. Two costs: tokens spent reading a catalogue that
        # should not be used, and a real chance the sibling comes back MORE
        # commercial than its source. An empty list is the honest signal.
        if src_topics:
            cands = [p for p in plans["all"] if p["language"] == LANG_NAME[lang]
                     and (p["sport"], p["distance"]) in src_topics]
            topics = ", ".join(sorted(f"{s} {d}" for s, d in src_topics))
            print(f"    {len(cands)} candidate plan(s) in {LANG_NAME[lang]} "
                  f"matching: {topics}")
            if not cands:
                print("    no equivalent plans in this market — the article will "
                      "be written without plan cards", file=sys.stderr)
        else:
            cands = []
            print(f"    source links no plans — education piece, "
                  f"no plan list passed to {LANG_NAME[lang]}")
        prompt = TRANSLATE_PROMPT.format(
            language_name=LANG_NAME[lang], market_notes=MARKET_NOTES[lang],
            voice=brand_voice(),
            # `metric` and `weeks` are what rule 3 below needs to spread across.
            plans=json.dumps([{k: p[k] for k in
                               ("id", "name", "weeks", "difficulty", "metric", "strength")}
                              for p in cands[:40]], ensure_ascii=False)[:4000]
            or "none — do not link plans",
            site_links="\n".join(f"{r['url']}  — {r['page']}"
                                 for r in site_links(lang)),
            headline=src["headline"], standfirst=src["standfirst"] or "",
            body=src["body"])
        draft = parse_draft(call_model(prompt, api_key, model, expect="text"))
        # Topic is inherited, not re-asked. The translator is never given the
        # vocabulary precisely so it cannot pick a different one — siblings are
        # declared as the same page, and the same page cannot sit under two
        # topics. (save_piece enforces the same thing again on write.)
        draft["topic"] = src.get("topic")
        problems = validate(draft, plans, lang)
        if problems:
            print("  REJECTED — " + "; ".join(problems), file=sys.stderr)
            continue
        if dry_run:
            print(f"  {draft['headline']} ({draft['slug']})")
            continue
        pid = save_piece(conn, draft, parent=dict(src), lang=lang, model=model)
        print(f"  saved as piece {pid}")


if __name__ == "__main__":
    main()
