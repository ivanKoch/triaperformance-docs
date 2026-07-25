#!/usr/bin/env python3
"""
Takes the active-coaching roster (from fetch_active_coaching_roster.py) plus
a set of Hermes-drafted messages, builds a WhatsApp deep link per athlete,
and emails Ivan the whole list -- one click per athlete, no WhatsApp
automation, no bulk sending.

Deliberately split from fetch_active_coaching_roster.py: fetching the
roster is a pure data question (deterministic), drafting the actual message
text needs real judgment (Hermes/LLM), and this script's job is again purely
mechanical -- build links, build one email, send it. Same three-way split
already used elsewhere in this project (see ai-infrastructure-documentation.md
problem #7): agents draft/decide, hand-written scripts execute.

Usage:
  export SMTP_HOST="..." SMTP_PORT="465" SMTP_USER="..." SMTP_PASSWORD="..."
  python3 send_monday_checkin_digest.py roster.json messages.json

roster.json: the exact JSON printed by fetch_active_coaching_roster.py
  (the {"theme_index": ..., "theme": ..., "roster": [...]} object).

messages.json: {"<email>": "<full drafted message text>", ...} -- one
  complete, ready-to-send message per active athlete (already includes the
  greeting with their name -- this script does NOT concatenate a name onto
  the message, the drafted text is used as-is).

Sends one HTML email to coach@triaperformance.com. Never sends anything to
WhatsApp itself, never contacts an athlete directly -- Ivan clicks each link
by hand.
"""

import html
import json
import os
import smtplib
import sys
import urllib.parse
from email.mime.text import MIMEText

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
SMTP_USER = os.environ.get("SMTP_USER", "").strip()
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "").strip()
DIGEST_TO = os.environ.get("DIGEST_TO", "coach@triaperformance.com").strip()
DIGEST_FROM = os.environ.get("DIGEST_FROM", "Triaperformance Ops <coach@triaperformance.com>").strip()


def build_wa_link(calling_code, phone_number, message):
    digits = (calling_code + phone_number).replace("+", "").replace(" ", "").replace("-", "")
    return f"https://wa.me/{digits}?text={urllib.parse.quote(message)}"


def build_email_html(theme, entries):
    rows = []
    for e in entries:
        name = html.escape(f"{e['first_name']} {e.get('last_name', '')}".strip())
        msg_preview = html.escape(e["message"]).replace("\n", "<br>")
        rows.append(f"""
        <tr>
          <td style="padding:16px;border-bottom:1px solid #e4e6e1;">
            <div style="font-weight:700;font-size:16px;margin-bottom:6px;">{name}
              <span style="font-weight:400;color:#565a52;font-size:13px;">({html.escape(e['preferred_language'])})</span>
            </div>
            <div style="color:#1e2019;font-size:14px;white-space:pre-wrap;margin-bottom:10px;">{msg_preview}</div>
            <a href="{e['wa_link']}" style="display:inline-block;background:#004aad;color:#fff;
               text-decoration:none;padding:8px 16px;border-radius:4px;font-size:14px;font-weight:700;">
               Abrir WhatsApp →
            </a>
          </td>
        </tr>""")

    missing = [e for e in entries if not e.get("wa_link")]
    missing_html = ""
    if missing:
        names = ", ".join(html.escape(f"{e['first_name']} {e.get('last_name','')}".strip()) for e in missing)
        missing_html = f"""<p style="color:#b3261e;font-size:14px;">
          Sin telefono valido, revisar manualmente: {names}</p>"""

    return f"""
    <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;">
      <h2 style="font-size:20px;">Lunes de feedback -- {len(entries)} atletas activos</h2>
      <p style="color:#565a52;font-size:14px;">Pregunta rotativa de esta semana: <strong>{html.escape(theme)}</strong></p>
      {missing_html}
      <table style="width:100%;border-collapse:collapse;">{''.join(rows)}</table>
    </div>
    """


def send_email(subject, html_body):
    if not SMTP_USER or not SMTP_PASSWORD:
        sys.exit("Set SMTP_USER and SMTP_PASSWORD first (from Bitwarden / n8n's SMTP credential).")

    msg = MIMEText(html_body, "html", "utf-8")
    msg["Subject"] = subject
    msg["From"] = DIGEST_FROM
    msg["To"] = DIGEST_TO

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, [DIGEST_TO], msg.as_string())


def main():
    if len(sys.argv) != 3:
        sys.exit("Usage: python3 send_monday_checkin_digest.py <roster.json> <messages.json>")

    with open(sys.argv[1], encoding="utf-8") as f:
        roster_data = json.load(f)
    with open(sys.argv[2], encoding="utf-8") as f:
        messages = json.load(f)

    theme = roster_data.get("theme", "")
    roster = roster_data.get("roster", [])

    entries = []
    for person in roster:
        message = messages.get(person["email"])
        if not message:
            print(f"WARNING: no drafted message for {person['email']}, skipping.", file=sys.stderr)
            continue

        wa_link = None
        if person.get("phone_calling_code") and person.get("phone_number"):
            wa_link = build_wa_link(person["phone_calling_code"], person["phone_number"], message)

        entries.append({
            **person,
            "message": message,
            "wa_link": wa_link,
        })

    if not entries:
        sys.exit("No entries to send -- check roster.json and messages.json match up on email.")

    html_body = build_email_html(theme, entries)
    send_email(f"Lunes de feedback -- {len(entries)} atletas ({theme})", html_body)
    print(f"Sent digest with {len(entries)} athletes to {DIGEST_TO}.")


if __name__ == "__main__":
    main()
