"""
Tiny auth-check + login service for the /members/ area.

Not public-facing on its own -- only ever called by Caddy on the same VPS
(forward_auth for /members/check, reverse_proxy for the login/logout POSTs).
Bind to 127.0.0.1 only, same "own lane, local-only" pattern as everything else
on this box.

Env vars required:
  MEMBERS_DB_DSN   e.g. "host=127.0.0.1 port=5432 dbname=members user=... password=..."
                   Must resolve to the same analytics-postgres container that
                   already holds the pixel/storefront tables -- test connectivity
                   from inside this container before assuming it works.
"""

import os
from flask import Flask, request, redirect, make_response
import psycopg2

app = Flask(__name__)

DB_DSN = os.environ["MEMBERS_DB_DSN"]
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


def lookup_token(token, record_access=False):
    """Returns preferred_language if the token is a real, active subscriber token.
    If record_access is True, also bumps access_count/last_accessed_at -- used on
    /members/check (every page load), not on /members/login (that's a login event,
    not a page visit, and would double-count the same request)."""
    if not token:
        return None
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT preferred_language FROM subscriber_tokens WHERE token = %s AND active = TRUE",
                (token,),
            )
            row = cur.fetchone()
            if not row:
                return None
            if record_access:
                cur.execute(
                    "UPDATE subscriber_tokens SET access_count = access_count + 1, last_accessed_at = now() WHERE token = %s",
                    (token,),
                )
                conn.commit()
            return row[0]
    finally:
        conn.close()


@app.route("/members/check")
def check():
    """Called by Caddy's forward_auth on every /members/* request -- this is what
    actually counts as "a visit" for access_count, since the cookie can live for a
    year without the person ever hitting /login again."""
    token = request.cookies.get(COOKIE_NAME)
    language = lookup_token(token, record_access=True)
    if language:
        resp = make_response("", 200)
        # Forwarded back to the client by Caddy -- lets static pages/JS in
        # /members/ know which language to render without a second DB call.
        resp.headers["X-Member-Language"] = language
        return resp
    return ("", 401)


@app.route("/members/login", methods=["POST"])
def login():
    """One endpoint for all three languages -- the ES, EN and PT login pages all
    POST here. The page only supplies `lang` so a failed attempt lands back on
    the screen the person was actually reading."""
    token = request.form.get("password", "").strip()
    form_lang = request.form.get("lang", "")
    next_url = safe_next(request.form.get("next"))
    language = lookup_token(token)
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
