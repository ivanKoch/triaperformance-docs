#!/usr/bin/env python3
"""
quick_grant.py — one-command members-area grant for someone who is NOT a Twenty
Person (a friend, family, a tester): mints a token, inserts it under the
QA-FIXTURE sentinel with excluded_from_metrics = TRUE, and emails the login.

This is the scripted form of OPERATIONS.md §1c. For a real athlete use §1a/§1b
(they create or verify the Twenty record and count in metrics); this script
deliberately does neither.

Repo copy: automation/members-area/quick_grant.py (the source of truth).
Live: /root/quick_grant.py on the VPS is a three-line dispatcher that pulls the
repo and runs this file — never edit the live copy.

Usage (on the VPS):
  python3 /root/quick_grant.py someone@example.com
  python3 /root/quick_grant.py someone@example.com --name "Vale" --language SPANISH
  python3 /root/quick_grant.py someone@example.com --count-in-metrics   # only for a real person

History: written August 1, 2026 as a loose file on the box; moved into the repo
September 12, 2026 with three fixes — parameterised SQL (was string-built from the
argument), the documented QA-FIXTURE sentinel (was 'manual-<email>'), and
excluded_from_metrics set by default (was unset, so every personal grant counted
as a real member in the usage figures).
"""

import argparse
import secrets
import smtplib
import ssl
import subprocess
import sys
from email.mime.text import MIMEText
from pathlib import Path

TOKEN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
LOGIN_URL = {
    "SPANISH": "https://triaperformance.com/members/login/",
    "ENGLISH": "https://triaperformance.com/members/en/login/",
    "PORTUGUESE": "https://triaperformance.com/members/pt/login/",
}
ENV_FILE = Path.home() / ".hermes" / ".env"
SENTINEL = "QA-FIXTURE"


def load_env_var(key, path=ENV_FILE):
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith(f"{key}="):
                return line[len(key) + 1:].rstrip("\n")
    raise KeyError(f"{key} not found in {path}")


EMAIL_TEMPLATES = {
    "SPANISH": {
        "subject": "Tu acceso al área de miembros — Triaperformance",
        "body": "Hola {name},\n\nYa tienes acceso al área de miembros de Triaperformance.\n\n"
        "Link de acceso: {login_url}\nTu contraseña: {token}\n\nUn abrazo,\nIván",
    },
    "ENGLISH": {
        "subject": "Your members-area access — Triaperformance",
        "body": "Hi {name},\n\nYou now have access to the Triaperformance members area.\n\n"
        "Login link: {login_url}\nYour password: {token}\n\nBest,\nIván",
    },
    "PORTUGUESE": {
        "subject": "Seu acesso à área de membros — Triaperformance",
        "body": "Olá {name},\n\nVocê já tem acesso à área de membros da Triaperformance.\n\n"
        "Link de acesso: {login_url}\nSua senha: {token}\n\nAbraço,\nIván",
    },
}


def generate_token(length=20):
    return "".join(secrets.choice(TOKEN_ALPHABET) for _ in range(length))


def insert_token(email, token, language, excluded):
    # Values go in as psql variables (-v) and are quoted by psql (:'name'), so
    # nothing from the command line is ever spliced into SQL text.
    sql = (
        "INSERT INTO subscriber_tokens "
        "(twenty_person_id, email, token, preferred_language, active, excluded_from_metrics) "
        "VALUES (:'pid', :'email', :'token', :'lang', TRUE, :'excl'::boolean);"
    )
    subprocess.run(
        [
            "docker", "exec", "-i", "analytics-postgres",
            "psql", "-U", "analytics", "-d", "members", "-v", "ON_ERROR_STOP=1",
            "-v", f"pid={SENTINEL}", "-v", f"email={email}", "-v", f"token={token}",
            "-v", f"lang={language}", "-v", f"excl={'true' if excluded else 'false'}",
            "-c", sql,
        ],
        check=True,
    )


def send_email(to_email, name, token, language):
    tmpl = EMAIL_TEMPLATES[language]
    body = tmpl["body"].format(name=name or "", login_url=LOGIN_URL[language], token=token)
    body = body.replace("Hola ,", "Hola,").replace("Hi ,", "Hi,").replace("Olá ,", "Olá,")
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = tmpl["subject"]
    msg["From"] = "Iván Koch - Triaperformance <coach@triaperformance.com>"
    msg["To"] = to_email
    smtp_user = load_env_var("SMTP_USER")
    smtp_password = load_env_var("SMTP_PASSWORD")
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, [to_email], msg.as_string())


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("email")
    parser.add_argument("--name", default="")
    parser.add_argument("--language", choices=list(EMAIL_TEMPLATES), default="SPANISH")
    parser.add_argument("--count-in-metrics", action="store_true",
                        help="do NOT set excluded_from_metrics (only for a real person who is not in Twenty)")
    args = parser.parse_args()

    email = args.email.strip().lower()
    if "@" not in email or " " in email:
        sys.exit(f"not an email: {args.email!r}")

    token = generate_token()
    insert_token(email, token, args.language, excluded=not args.count_in_metrics)
    print(f"Token inserted for {email} (sentinel {SENTINEL}, excluded_from_metrics={not args.count_in_metrics}).")
    send_email(email, args.name, token, args.language)
    print(f"Login email sent to {email}.")


if __name__ == "__main__":
    main()
