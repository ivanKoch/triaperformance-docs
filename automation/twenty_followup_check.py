#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json
import sys
import os
from datetime import datetime, timezone, timedelta

API_URL = "http://100.70.89.17:3000/graphql"

LOST_NO_RESPONSE_DAYS = 7  # days silent after touch 3 before auto-marking lost

# The follow-up sequence is three CONSECUTIVE CALENDAR DAYS, counted from the
# lead's creation date. Day 0: the CoachMatch n8n workflow creates the lead,
# sends email 1 and hands Ivan the message-1 wa.me link (whatsappTouchCount = 1).
# Day 1: message 2. Day 2: message 3. Calendar days, not business days and not
# elapsed hours -- a lead that arrives at 23:00 is due for message 2 the next
# morning, not 24 hours later.
#
# Why createdAt and not lastTouchpoint (changed September 2, 2026): the email
# nurture workflow writes lastTouchpoint every time it sends email 2 or 3, and
# this script's window was measured from that same field. So the other channel
# kept pushing this one out -- the nominal 2-day WhatsApp gap became 4+ days in
# real runs, and the sequence was never consecutive. Both channels now run off
# the same fixed createdAt timeline and cannot move each other. lastTouchpoint
# is still read, but only for the auto-LOST check, where "when did we last
# touch this person at all" is exactly the right question.
AR_TZ = timezone(timedelta(hours=-3))  # America/Cordoba. Fixed offset on
                                       # purpose: Argentina has had no DST
                                       # since 2009, and a fixed offset does
                                       # not depend on tzdata being present in
                                       # the Hermes container.

# Markets where the CoachMatch n8n workflow deliberately skips WhatsApp outreach
# (the "Skip WhatsApp Outreach — BR/AR" filter node). Those leads still get
# created as MESSAGE_SENT and still run the 3-email nurture, so this script --
# which filtered on leadStatus alone -- kept building WhatsApp nudges for them.
# Matched lowercased against Twenty's addressCountry.
NO_WHATSAPP_COUNTRIES = {"brazil", "brasil", "argentina"}

def load_api_key():
    key = os.environ.get("TWENTY_API_KEY")
    if key:
        return key
    for path in ["/root/.hermes/.env", "/opt/data/.env", os.path.expanduser("~/.hermes/.env")]:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    for line in f:
                        if "TWENTY_API_KEY" in line:
                            parts = line.strip().split("=", 1)
                            if len(parts) == 2:
                                return parts[1].strip().strip('"').strip("'")
            except Exception:
                pass
    return None

def run_graphql_query(query, variables=None):
    api_key = load_api_key()
    if not api_key:
        print("Error: TWENTY_API_KEY is not configured.", file=sys.stderr)
        sys.exit(1)

    req_data = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=req_data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "Hermes-Agent-Cron"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if "errors" in res_data:
                print(f"GraphQL Error: {res_data['errors']}", file=sys.stderr)
                return None
            return res_data.get("data")
    except Exception as e:
        print(f"Connection Error: {e}", file=sys.stderr)
        return None

# Follow-up copy, keyed by which touch this nudge is about to become.
# Touch 1 is the initial outreach, sent by the CoachMatch n8n workflow on lead
# creation (not this script). This script only ever sends touch 2 (first
# automated nudge) or touch 3 (final message in the sequence) -- there is
# deliberately no message 4; a lead sitting at touch 3 for too long gets
# auto-marked LOST_NO_RESPONSE instead (see mark_lost below).
MESSAGE_TEMPLATES = {
    2: "Hola {first_name}. ¿Te encuentro con tiempo hoy para discutir sobre tus objetivos deportivos?",
    3: (
        "Hola {first_name}. Ultimo mensaje de mi parte, si aún sigues interesado en "
        "coaching personalizado me avisas. De lo contrario te dejo nuestros links para "
        "seguir en contacto en caso que quieras retomar esta conversación en el futuro.\n"
        "• Quieres ver lo que nuestros atletas están logrando y preparando? ¡Échale un "
        "vistazo a nuestro Instagram! 👇\n"
        "https://www.instagram.com/triaperformance/\n"
        "• Y si te interesa saber qué dicen de nosotros, aquí tienes las reseñas de "
        "nuestros atletas: 👇\n"
        "https://maps.app.goo.gl/Dfw4166sxw3WGwA3A\n"
        "• Nuestra web con planes de coaching, subscripciones y plantillas para seguir "
        "por tu cuenta https://triaperformance.com"
    ),
}

def local_date(dt):
    """The calendar date in Ivan's timezone -- the unit this sequence counts in."""
    return dt.astimezone(AR_TZ).date()


def parse_iso(value):
    """Twenty returns ISO-8601 with a trailing Z, which fromisoformat won't take."""
    if not value:
        return None
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(value)
    except Exception as parse_err:
        print(f"Error parsing date {value}: {parse_err}", file=sys.stderr)
        return None


def expected_touch(created_at, now):
    """Which message number this lead should be at today: 1 on the day it
    arrived, 2 the next calendar day, 3 the day after. Capped at 3 -- there is
    deliberately no message 4.

    Returning the message the lead is *due for* rather than a "has enough time
    passed" boolean buys two things: a second run on the same day sends nothing
    (wa_touch already equals the expected number), and a missed day resumes at
    the next message in sequence instead of skipping one."""
    if created_at is None:
        return 1
    days = (local_date(now) - local_date(created_at)).days
    return max(1, min(days + 1, 3))


def build_whatsapp_link(first_name, calling_code, phone_number, message_number):
    if not phone_number:
        return None
    digits = f"{calling_code or ''}{phone_number}".replace("+", "").replace(" ", "").replace("-", "")
    message = MESSAGE_TEMPLATES[message_number].format(first_name=first_name)
    encoded_message = urllib.parse.quote(message)
    return f"https://wa.me/{digits}?text={encoded_message}"

def mark_whatsapp_touch(person_id, new_touch_count, now_iso):
    """Optimistic write: firing this nudge counts as the touch, same as Ivan's
    manual process. If it fails, the lead just gets nudged again tomorrow
    rather than silently getting stuck."""
    mutation = """
    mutation UpdatePerson($id: ID!, $data: PersonUpdateInput!) {
      updatePerson(id: $id, data: $data) { id }
    }
    """
    variables = {
        "id": person_id,
        "data": {
            "whatsappTouchCount": new_touch_count,
            "lastTouchpoint": now_iso,
        },
    }
    return run_graphql_query(mutation, variables)

def mark_lost(person_id):
    """Touch 3 sent, no response for LOST_NO_RESPONSE_DAYS+ days -- close the
    loop automatically. Only leadStatus changes; lastTouchpoint is left as-is
    since no new touch actually happened."""
    mutation = """
    mutation UpdatePerson($id: ID!, $data: PersonUpdateInput!) {
      updatePerson(id: $id, data: $data) { id }
    }
    """
    variables = {
        "id": person_id,
        "data": {
            "leadStatus": "LOST_NO_RESPONSE",
        },
    }
    return run_graphql_query(mutation, variables)

def main():
    now = datetime.now(timezone.utc)
    now_str = now.replace(microsecond=0).isoformat().replace("+00:00", "Z")

    # No server-side date filter any more. The old one filtered on
    # lastTouchpoint, which is the field the email workflow keeps moving -- a
    # lead emailed this morning was excluded from this query entirely, so its
    # WhatsApp nudge could never be built. Due-ness is now decided per lead
    # against createdAt below. The MESSAGE_SENT pool stays small because the
    # auto-LOST branch drains it, and `first: 200` is the safety ceiling.
    query = """
    query FindPeople($status: String!) {
      people(filter: { leadStatus: { eq: $status } }, first: 200) {
        edges {
          node {
            id
            name { firstName lastName }
            emails { primaryEmail }
            phones { primaryPhoneNumber primaryPhoneCallingCode }
            leadStatus
            createdAt
            lastTouchpoint
            emailTouchCount
            whatsappTouchCount
            addressCountry
          }
        }
      }
    }
    """

    variables = {
        "status": "MESSAGE_SENT",
    }

    data = run_graphql_query(query, variables)
    if data is None:
        print("Failed to query Twenty CRM GraphQL API.", file=sys.stderr)
        sys.exit(1)

    people_edges = data.get("people", {}).get("edges", [])
    flagged_lines = []
    lost_lines = []

    for edge in people_edges:
        node = edge.get("node", {})
        name_obj = node.get("name") or {}
        first = name_obj.get("firstName") or ""
        last = name_obj.get("lastName") or ""
        name = f"{first} {last}".strip() or f"Unknown (ID: {node.get('id')})"

        # lastTouchpoint answers "how long have they been silent" (the LOST
        # check); createdAt answers "where in the 3-day sequence are they"
        # (which message is due). Two different questions, two different fields.
        touchpoint_dt = parse_iso(node.get("lastTouchpoint"))
        created_dt = parse_iso(node.get("createdAt"))
        days_since = (now - touchpoint_dt).total_seconds() / 86400.0 if touchpoint_dt else None

        days_str = f"{int(days_since)} day{'s' if int(days_since) != 1 else ''}" if days_since is not None else "unknown time"
        email_touch = node.get("emailTouchCount") or 0

        # BR/AR leads never get WhatsApp outreach, so there is no nudge to build
        # and nothing to notify about. They close on the email sequence instead:
        # all 3 nurture emails sent, then LOST_NO_RESPONSE_DAYS of silence.
        if (node.get("addressCountry") or "").lower().strip() in NO_WHATSAPP_COUNTRIES:
            if email_touch >= 3 and days_since is not None and days_since > LOST_NO_RESPONSE_DAYS:
                result = mark_lost(node.get("id"))
                if result is None:
                    lost_lines.append(f"- {name} · ⚠️ tried to mark LOST_NO_RESPONSE but the Twenty update failed")
                else:
                    lost_lines.append(f"- {name} · {days_str} since last touch, no response after 3 emails · marked LOST_NO_RESPONSE")
            continue

        phones_obj = node.get("phones") or {}
        phone_number = phones_obj.get("primaryPhoneNumber")
        calling_code = phones_obj.get("primaryPhoneCallingCode")

        # No phone on file -- already being reached some other way (email),
        # nothing for this WhatsApp watchdog to do. Skip entirely so it
        # doesn't clutter the digest.
        if not phone_number:
            continue

        # Every MESSAGE_SENT lead is created with whatsappTouchCount = 1 by the
        # n8n workflow, so this should never actually be missing -- the "or 1"
        # is just a defensive fallback, not an expected path.
        wa_touch = node.get("whatsappTouchCount") or 1

        if wa_touch >= 3:
            # Final message already sent. Only act once it's been silent long
            # enough; otherwise leave it alone (don't list it every day).
            if days_since is not None and days_since > LOST_NO_RESPONSE_DAYS:
                result = mark_lost(node.get("id"))
                if result is None:
                    lost_lines.append(f"- {name} · ⚠️ tried to mark LOST_NO_RESPONSE but the Twenty update failed")
                else:
                    lost_lines.append(f"- {name} · {days_str} since last touch, no response after 3 messages · marked LOST_NO_RESPONSE")
            continue

        due_touch = expected_touch(created_dt, now)
        if wa_touch >= due_touch:
            # Already at today's message in the sequence. Nothing due -- and
            # this is also what makes a second run on the same day a no-op.
            continue

        message_number = wa_touch + 1  # 2 or 3
        wa_link = build_whatsapp_link(first, calling_code, phone_number, message_number)

        line = f"- {name} · {days_str} since last touch · emails sent: {email_touch}, WhatsApp: {wa_touch}"
        line += f"\n  📱 (mensaje {message_number}) {wa_link}"
        result = mark_whatsapp_touch(node.get("id"), message_number, now_str)
        if result is None:
            line += "\n  ⚠️ Could not update whatsappTouchCount/lastTouchpoint in Twenty"
        flagged_lines.append(line)

    if flagged_lines:
        print("Follow-ups due today (day 1 = message 2, day 2 = message 3):")
        for line in flagged_lines:
            print(line)

    if lost_lines:
        print("\nMarked as lost (no response after 3 touches, 7+ days silent):")
        for line in lost_lines:
            print(line)

if __name__ == "__main__":
    main()
