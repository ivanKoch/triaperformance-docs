"""
Tiny auth-check + login service for the /members/ area, plus the /w/ workout-link
redirector.

Not public-facing on its own -- only ever called by Caddy on the same VPS
(forward_auth for /members/check, reverse_proxy for the login/logout POSTs and
for /w/*). Bind to 127.0.0.1 only, same "own lane, local-only" pattern as
everything else on this box.

Env vars required:
  MEMBERS_DB_DSN     e.g. "host=127.0.0.1 port=5432 dbname=members user=... password=..."
                     Must resolve to the same analytics-postgres container that
                     already holds the pixel/storefront tables -- test connectivity
                     from inside this container before assuming it works.
  MEMBERS_DATA_DIR   Directory holding library.json and workoutLinks.json, mounted
                     read-only from the repo clone on the VPS
                     ($HOME/.hermes/triaperformance-docs/site/_data). Defaults to
                     /app/data. Both files are re-read when their mtime changes,
                     so `git pull` publishes a new link with no restart and no
                     image rebuild -- the same reason every VPS script runs from
                     the repo rather than from a copy on the box.
"""

import json
import os
import time

from flask import Flask, request, redirect, make_response
import psycopg2

app = Flask(__name__)

DB_DSN = os.environ["MEMBERS_DB_DSN"]
DATA_DIR = os.environ.get("MEMBERS_DATA_DIR", "/app/data")
COOKIE_NAME = "members_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 365  # 1 year

# ---------------------------------------------------------------------------
# Language routing (added August 10, 2026, members-area i18n branch).
#
# The members area is one Caddy-gated tree with the language in a path segment
# (/members/, /members/en/, /members/pt/) rather than a language prefix like the
# public site, so a single `handle /members/*` forward_auth keeps covering all
# three. Which language a subscriber sees is NOT decided by the login page they
# happened to open -- it is decided here, from the token's own
# `preferred_language`, which is the only thing that actually knows. That column
# has existed since the schema was written and this is the first thing to use it
# for anything beyond a debug read.
#
# DB values are SPANISH / ENGLISH / PORTUGUESE (cached from Twenty's enum), not
# ISO codes -- see automation/members-area/schema.sql. Anything unrecognised
# falls back to Spanish, which is both the majority and the safe default.
# ---------------------------------------------------------------------------
LANG_HOME = {
    "SPANISH": "/members/",
    "ENGLISH": "/members/en/",
    "PORTUGUESE": "/members/pt/",
}
DEFAULT_HOME = "/members/"

# DB enum -> the two-letter key library.json is stored under.
LANG_CODE = {"SPANISH": "es", "ENGLISH": "en", "PORTUGUESE": "pt"}

# Where to send someone back to when a login FAILS, or after logout. Keyed by
# the ISO code the login page posts in its hidden `lang` field -- that is a
# statement about which page they were looking at, not about who they are, and
# on a failed login we have no token to ask.
LOGIN_PAGE = {
    "es": "/members/login",
    "en": "/members/en/login",
    "pt": "/members/pt/login",
}
DEFAULT_LOGIN = "/members/login"


def login_page_for(form_lang):
    return LOGIN_PAGE.get((form_lang or "").strip().lower(), DEFAULT_LOGIN)


def safe_next(raw):
    """Accept only same-site absolute paths.

    `next` reaches us from a query string via a hidden form field, so it is
    attacker-controlled in the ordinary sense: without this check, a crafted
    link could bounce a subscriber to any host immediately after a successful
    login, wearing our domain in the address bar on the way. "//evil.com" and
    "/\\evil.com" are both protocol-relative and must be rejected along with
    anything not starting with "/".
    """
    if not raw or not raw.startswith("/"):
        return None
    if raw.startswith("//") or raw.startswith("/\\"):
        return None
    return raw


def get_conn():
    return psycopg2.connect(DB_DSN)


# ---------------------------------------------------------------------------
# Data files, re-read on mtime change (added September 5, 2026).
#
# library.json is the repo's single source for what the members library holds
# and where each tool lives IN EACH LANGUAGE; workoutLinks.json maps a short /w/
# code to one of its keys. Resolving the destination here rather than baking it
# into the link is what lets ONE pasted link send a Spanish athlete to
# /members/activacion/ and an English athlete to /members/en/activation/ -- and
# it is why this build added no second inventory of URLs.
# ---------------------------------------------------------------------------
_cache = {}


def _load_json(name):
    path = os.path.join(DATA_DIR, name)
    try:
        mtime = os.path.getmtime(path)
    except OSError:
        return _cache.get(name, {}).get("data", {})
    entry = _cache.get(name)
    if entry and entry["mtime"] == mtime:
        return entry["data"]
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except (OSError, ValueError):
        # A malformed file must not take the redirector down -- keep serving the
        # last good copy. A link pasted into a published TrainingPeaks plan is
        # permanent; a bad deploy must not turn it into a dead end.
        return entry["data"] if entry else {}
    _cache[name] = {"mtime": mtime, "data": data}
    return data


def link_for(code):
    """Returns the registry entry for a /w/ code, or None."""
    for row in _load_json("workoutLinks.json").get("links", []):
        if row.get("code") == code:
            return row
    return None


def destination_for(tool_key, lang_code):
    """The members URL for a library.json key in one language.

    Returns None when that tool is not live in that language -- which is a real
    state today (recovery is Spanish-only), not a defect. The caller falls back
    to the athlete's own members home rather than dropping them onto a page in a
    language they do not read.
    """
    lib = _load_json("library.json").get(lang_code) or {}
    for item in lib.get("live", []):
        if item.get("key") == tool_key:
            return item.get("memberUrl")
    return None


def accept_language_code(header):
    """Best-effort language for an anonymous click. A click from a TrainingPeaks
    workout by someone with no members cookie still has to land somewhere, and
    the browser's own preference beats defaulting everyone to Spanish."""
    for part in (header or "").split(","):
        tag = part.split(";")[0].strip().lower()
        if tag.startswith("en"):
            return "en"
        if tag.startswith("pt"):
            return "pt"
        if tag.startswith("es"):
            return "es"
    return "es"


# ---------------------------------------------------------------------------
# Access logging (added September 5, 2026).
#
# 🚨 EVERY CALL IS BEST-EFFORT AND SWALLOWS ITS OWN ERRORS. This service is the
# auth gate for all paid content: an analytics write must never be able to 500 a
# subscriber out of the members area. If the log table is missing, locked or the
# disk is full, the page still serves.
# ---------------------------------------------------------------------------
SKIP_SUFFIXES = (
    ".css", ".js", ".map", ".json", ".xml", ".txt", ".ico", ".svg",
    ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif",
    ".woff", ".woff2", ".ttf", ".pdf", ".mp3", ".mp4", ".webmanifest",
)


def is_page_request(path):
    """Members assets live under /assets/, so in practice forward_auth fires once
    per page -- but a future asset placed under /members/ should not become a
    phantom visit."""
    if not path:
        return False
    return not path.lower().endswith(SKIP_SUFFIXES)


def log_event(event_type, token_id, path, code=None, slot=None, destination=None):
    # Opens its OWN connection rather than reusing the auth lookup's. That is a
    # deliberate ~2ms on a local socket, bought for one property: a failing
    # INSERT here cannot poison the transaction that decides whether a paying
    # subscriber gets in. Do not "optimise" this into the auth query without
    # replacing the isolation with a savepoint.
    try:
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO member_access_log "
                    "(event_type, token_id, path, link_code, link_slot, destination) "
                    "VALUES (%s, %s, %s, %s, %s, %s)",
                    (event_type, token_id, path, code, slot, destination),
                )
            conn.commit()
        finally:
            conn.close()
    except Exception:
        pass


def lookup_token(token, record_access=False):
    """Returns (token_id, preferred_language) for a real, active subscriber token,
    or (None, None).

    If record_access is True, also bumps access_count/last_accessed_at AND writes
    one member_access_log row -- used on /members/check (every page load), not on
    /members/login (that's a login event, not a page visit, and would double-count
    the same request).

    access_count is kept alongside the log deliberately: close #1 baselined on it
    (38 tokens / 2 real users / 7 accesses) and `token_roster` reads it, so
    removing it would break a comparison that has not been made yet.
    """
    if not token:
        return (None, None)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, preferred_language FROM subscriber_tokens "
                "WHERE token = %s AND active = TRUE",
                (token,),
            )
            row = cur.fetchone()
            if not row:
                return (None, None)
            token_id, language = row[0], row[1]
            if record_access:
                cur.execute(
                    "UPDATE subscriber_tokens "
                    "SET access_count = access_count + 1, last_accessed_at = now() "
                    "WHERE id = %s",
                    (token_id,),
                )
                conn.commit()
            return (token_id, language)
    finally:
        conn.close()


@app.route("/members/check")
def check():
    """Called by Caddy's forward_auth on every /members/* request -- this is what
    actually counts as "a visit" for access_count, since the cookie can live for a
    year without the person ever hitting /login again.

    Since September 5, 2026 it also writes the per-event row. Caddy's forward_auth
    sets X-Forwarded-Uri automatically, so the path the athlete asked for is
    already here -- no Caddyfile change was needed to learn which tool they opened.
    The QUERY STRING IS DROPPED: this table is read far more often than the roster
    is, and there is no reason for it to accumulate whatever ends up in a URL.
    """
    token = request.cookies.get(COOKIE_NAME)
    raw_uri = request.headers.get("X-Forwarded-Uri", "")
    path = raw_uri.split("?", 1)[0]
    token_id, language = lookup_token(token, record_access=True)
    if language:
        if is_page_request(path):
            log_event("page", token_id, path)
        resp = make_response("", 200)
        # Forwarded back to the client by Caddy -- lets static pages/JS in
        # /members/ know which language to render without a second DB call.
        resp.headers["X-Member-Language"] = language
        return resp
    return ("", 401)


@app.route("/w/<code>")
def workout_link(code):
    """The TrainingPeaks workout link. Deliberately OUTSIDE the /members/ gate.

    Three things this does that a UTM-tagged member URL cannot:

    1. It records the click even when the athlete never gets in. A UTM on a gated
       URL is inert -- Caddy nests the whole query string inside `next=` and GA4
       does not parse it (ai-infrastructure-documentation.md, Sept 2 addendum) --
       and the population that matters most right now is the athlete who clicks
       from a workout, meets the login wall and stops. That click lands here as a
       row with token_id NULL.
    2. It knows WHO clicked. The members cookie is path=/, so it reaches this
       route; identity comes from the token, not from a device-grain analytics id.
    3. It is permanent and repointable. A TrainingPeaks plan is a static snapshot,
       so a link pasted into a workout is frozen into every future application of
       that plan. Owning the path means the members area can be restructured, or
       retired entirely, by editing a registry -- the workouts are never touched.

    An unknown code NEVER 404s. A typo pasted into a hundred workouts is
    permanent, so it degrades to the members home and is logged under its own
    code, where `workout_link_clicks` will show it.
    """
    entry = link_for(code)
    token = request.cookies.get(COOKIE_NAME)
    token_id, language = lookup_token(token)

    if language:
        lang_code = LANG_CODE.get(language, "es")
        home = LANG_HOME.get(language, DEFAULT_HOME)
    else:
        lang_code = accept_language_code(request.headers.get("Accept-Language"))
        home = {"es": "/members/", "en": "/members/en/", "pt": "/members/pt/"}[lang_code]

    destination = None
    if entry:
        destination = destination_for(entry.get("tool"), lang_code)
    # No entry, or the tool is not live in this athlete's language (recovery is
    # Spanish-only today). Either way, their own members home beats a page they
    # cannot read and beats a dead end.
    if not destination:
        destination = home

    log_event(
        "link",
        token_id,
        "/w/" + code,
        code=code,
        slot=(entry or {}).get("slot"),
        destination=destination,
    )

    resp = make_response(redirect(destination, code=302))
    # A cached redirect is an unlogged click. 302 + no-store, so every click from
    # a workout is a row.
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    resp.headers["Pragma"] = "no-cache"
    return resp


def campaign_link_for(code):
    """Look up a /c/ code in campaignLinks.json. Same mtime-cached read as
    link_for(); a malformed file keeps serving the last good copy, because a
    link already sitting in somebody's inbox cannot be recalled."""
    for row in _load_json("campaignLinks.json").get("links", []):
        if row.get("code") == code:
            return row
    return None


def log_campaign_click(code, click_id, destination, user_agent):
    """One row per /c/ click. Swallows every error for the same reason
    log_event() does -- an analytics write must never cost a real click."""
    try:
        conn = get_conn()
        with conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO campaign_link_clicks "
                "(code, click_id, destination, user_agent) VALUES (%s, %s, %s, %s)",
                (code, click_id or None, destination, (user_agent or "")[:500]),
            )
        conn.close()
    except Exception:
        pass

@app.route("/c/<code>")
def campaign_link(code):
    """Campaign redirect for email sends. Outside every gate, like /w/.

    Why this exists when the emails already carry UTMs: a UTM only reports on a
    page that runs OUR GA4. The single most important click in an All-Access
    email goes to checkout.trainingpeaks.com, which does not -- so before this
    route the highest-intent click in the funnel was structurally invisible.
    A redirect we own is counted before the browser ever leaves.

    Identity is `k`, the per-recipient click_id minted with the send. It is NOT
    the unsubscribe token, deliberately: checkout links get forwarded, and a
    forwarded unsubscribe token would let the recipient of the forward
    unsubscribe the sender.

    An unknown code never 404s -- same rule as /w/, for the same reason: the
    link is already in somebody's inbox and cannot be recalled. It degrades to
    the registry fallback and is still logged under its own code, so a typo
    shows up as clicks rather than as silence.
    """
    entry = campaign_link_for(code)
    registry = _load_json("campaignLinks.json")
    destination = (entry or {}).get("destination") or \
        registry.get("fallback") or DEFAULT_HOME

    log_campaign_click(
        code,
        request.args.get("k"),
        destination,
        request.headers.get("User-Agent"),
    )

    resp = make_response(redirect(destination, code=302))
    # A cached redirect is an unlogged click.
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    resp.headers["Pragma"] = "no-cache"
    # This link is in an email; it must not leak the recipient's id onward.
    resp.headers["Referrer-Policy"] = "no-referrer"
    return resp


@app.route("/members/login", methods=["POST"])
def login():
    """One endpoint for all three languages -- the ES, EN and PT login pages all
    POST here. The page only supplies `lang` so a failed attempt lands back on
    the screen the person was actually reading."""
    token = request.form.get("password", "").strip()
    form_lang = request.form.get("lang", "")
    next_url = safe_next(request.form.get("next"))
    _token_id, language = lookup_token(token)
    if not language:
        return redirect(login_page_for(form_lang) + "?error=1")
    # No explicit destination means they came to the login page directly rather
    # than being bounced off a gated page -- route them to their own language's
    # members home. When `next` IS set, Caddy put it there because they were
    # trying to reach a specific page, and that intent wins.
    if not next_url:
        next_url = LANG_HOME.get(language, DEFAULT_HOME)
    resp = make_response(redirect(next_url))
    resp.set_cookie(
        COOKIE_NAME,
        token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=True,
        samesite="Lax",
        path="/",
    )
    return resp


@app.route("/members/logout", methods=["POST"])
def logout():
    """The members-home nav posts a hidden `lang` so logging out returns you to
    the login screen in the language you were just reading. Without it an EN
    subscriber logs out and lands on the Spanish page."""
    resp = make_response(redirect(login_page_for(request.form.get("lang", ""))))
    resp.delete_cookie(COOKIE_NAME, path="/")
    return resp


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8091)
