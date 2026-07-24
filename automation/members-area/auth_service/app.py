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
    token = request.form.get("password", "").strip()
    next_url = request.form.get("next") or "/members/"
    language = lookup_token(token)
    if not language:
        return redirect("/members/login?error=1")
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
    resp = make_response(redirect("/members/login"))
    resp.delete_cookie(COOKIE_NAME, path="/")
    return resp


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8091)
