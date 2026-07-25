#!/usr/bin/env python3
"""
Bulk-backfill existing customers (All-Access + 1:1 coaching) into Twenty CRM
and generate Members Area access tokens for them.

Why this exists: the normal path (subscription-lifecycle-automation.json)
only fires off real TrainingPeaks subscribe/cancel emails, which only exist
for All-Access. Existing customers -- and all 1:1 coaching athletes, who
have no TP subscription event at all -- need a one-time backfill instead.

What it does, per row in the input CSV:
  1. Checks Twenty for an existing Person by email (same GET + filter the
     n8n workflow uses) -- many 1:1 coaching athletes likely already exist
     there from the live CoachMatch pipeline (running since July 17, 2026 --
     anyone signed up before that date almost certainly won't be there yet).
  2. If found: PATCHes customerType + leadStatus + athleteLevel + addressCountry
     + signUpDate + phones. Deliberately does NOT touch planPurchased/sport/
     leadSource on an update -- those are more likely to already hold real,
     correct data on an existing record, whereas signUpDate is specifically
     the field this backfill exists to populate.
  3. If not found: POSTs a new Person with name, customerType, leadStatus,
     leadSource, sport, signUpDate (plain YYYY-MM-DD), planPurchased,
     preferredLanguage, athleteLevel, addressCountry, phones -- whichever
     of those columns are present in the CSV (all but email/customer_type/
     preferred_language are optional).
  4. Generates a random 20-char token (same alphabet as the n8n workflow's
     Generate Member Token node, for consistency).
  5. Writes ONE multi-row SQL INSERT statement to the output file -- this
     script never touches Postgres directly. You review and run it yourself.

What it does NOT do:
  - Send any email. No SMTP call anywhere in this script, on purpose.
  - Skip people who already have an active token. Check that yourself first
    (query below) and leave already-provisioned people out of the input CSV,
    otherwise they'll end up with two active tokens.

Column names -- accepts either your original export headers or the simpler
snake_case ones (checked in this order, first match wins), so you can point
this at a raw export without renaming columns:
  email             <- email
  first_name        <- first_name
  last_name         <- last_name
  customer_type     <- customerType | customer_type
  preferred_language<- preferredLanguage | preferred_language
  sign_up_date      <- signUpDate | purchase_date        (optional, plain YYYY-MM-DD, sent as Twenty's signUpDate field)
  lead_source       <- leadSource | lead_source           (optional, default OTHER)
  lead_status       <- leadStatus | lead_status            (optional, default WON_CUSTOMER)
  sport             <- sport                                (optional)
  plan_purchased    <- planPurchased | plan_purchased        (optional)

Requires network access to Twenty (Tailscale) -- run this from your Mac
(on the tailnet) or via SSH on the VPS. Stdlib only, no pip installs needed.

Usage:
  export TWENTY_API_KEY="..."          # from Bitwarden -- never paste this in chat
  python3 backfill_existing_customers.py customers.csv token_inserts.sql

Before running, check who already has access so you don't double-provision:
  docker exec -it analytics-postgres psql -U analytics -d members -c \\
    "SELECT email FROM subscriber_tokens WHERE active = TRUE;"
"""

import csv
import json
import os
import secrets
import sys
import urllib.error
import urllib.request

TWENTY_BASE_URL = os.environ.get("TWENTY_BASE_URL", "http://100.70.89.17:3000").strip()
TWENTY_API_KEY = os.environ.get("TWENTY_API_KEY", "").strip()


def auth_header_value(key):
    """Twenty's 'HTTP Header Auth' credential type (used in n8n for this same
    API) does NOT auto-prepend 'Bearer ' -- it has to be typed into the header
    value manually. That means whatever's saved in Bitwarden/n8n may already
    be the full 'Bearer <token>' string, not just the bare token. Handle both
    so a copy-paste either way works."""
    if key.lower().startswith("bearer "):
        return key
    return f"Bearer {key}"

VALID_CUSTOMER_TYPES = {"PLAN_BUYER", "ALL_ACCESS", "OPT1_1_COACHING"}
VALID_LANGUAGES = {"SPANISH", "ENGLISH", "PORTUGUESE"}
VALID_SPORTS = {"RUNNING", "CYCLING", "SWIMMING", "TRIATHLON", "DUATHLON"}
VALID_ATHLETE_LEVELS = {"BEGINNER", "INTERMEDIATE", "ADVANCED"}

TOKEN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"

# Calling code -> ISO 3166-1 alpha-2, for the specific codes seen in this
# dataset only -- NOT a general-purpose phone library. Twenty's phone field
# (like most CRMs using libphonenumber under the hood) wants a country code
# alongside the calling code for correct formatting/validation.
CALLING_CODE_TO_ISO2 = {
    "+57": "CO", "+52": "MX", "+502": "GT", "+595": "PY", "+506": "CR",
    "+56": "CL", "+58": "VE", "+507": "PA", "+371": "LV", "+297": "AW",
    # +1 is shared by the US, Canada, Puerto Rico, Barbados, etc. -- resolved
    # per-row from the addressCountry column instead, see COUNTRY_TO_ISO2.
}

# addressCountry (free text, as typed) -> ISO 3166-1 alpha-2. Covers exactly
# the country strings present in this dataset -- extend as needed for future
# backfills.
COUNTRY_TO_ISO2 = {
    "colombia": "CO", "mexico": "MX", "japon": "JP", "venezuela": "VE",
    "barbados": "BB", "estados unidos": "US", "puerto rico": "PR",
    "aruba": "AW", "guatemala": "GT", "paraguay": "PY", "costa rica": "CR",
    "chile": "CL", "panama": "PA", "argentina": "AR",
}

KNOWN_CALLING_CODES = sorted(
    set(CALLING_CODE_TO_ISO2) | {"+1"}, key=len, reverse=True
)


def parse_phone(raw, country_text):
    """raw is like '+57 316 8296904' -- normally 'calling code, space, local
    number' but at least one row in this dataset is missing the space
    ('+2975946107'), so fall back to matching against KNOWN_CALLING_CODES.
    Returns (calling_code, local_number, iso2) or (None, None, None) if it
    can't be parsed at all."""
    raw = (raw or "").strip()
    if not raw:
        return None, None, None

    if " " in raw:
        calling_code, rest = raw.split(" ", 1)
        local_number = rest.replace(" ", "")
    else:
        calling_code, local_number = None, None
        for code in KNOWN_CALLING_CODES:
            if raw.startswith(code):
                calling_code, local_number = code, raw[len(code):]
                break
        if calling_code is None:
            return None, None, raw  # couldn't even guess the calling code

    iso2 = None
    if calling_code == "+1":
        iso2 = COUNTRY_TO_ISO2.get((country_text or "").strip().lower())
    else:
        iso2 = CALLING_CODE_TO_ISO2.get(calling_code)
    if iso2 is None:
        iso2 = COUNTRY_TO_ISO2.get((country_text or "").strip().lower())

    return calling_code, local_number, iso2


def gen_token(length=20):
    return "".join(secrets.choice(TOKEN_ALPHABET) for _ in range(length))


def sql_escape(value):
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def pick(row, *keys):
    for k in keys:
        v = (row.get(k) or "").strip()
        if v:
            return v
    return ""


def twenty_request(method, path, body=None):
    url = f"{TWENTY_BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", auth_header_value(TWENTY_API_KEY))
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {e.read().decode('utf-8', 'ignore')}")


def find_person_by_email(email):
    result = twenty_request(
        "GET",
        f"/rest/people?filter=emails.primaryEmail[eq]:{email}",
    )
    people = (result.get("data") or {}).get("people") or []
    return people[0] if people else None


def phone_body(row):
    """Best-informed-guess field shape (mirrors the confirmed 'emails' composite
    field) -- NOT verified against a real API response yet. Test on one row
    before trusting this against the full list."""
    if not row.get("phone_calling_code") or not row.get("phone_local_number"):
        return None
    phone = {
        "primaryPhoneNumber": row["phone_local_number"],
        "primaryPhoneCallingCode": row["phone_calling_code"],
    }
    if row.get("phone_iso2"):
        phone["primaryPhoneCountryCode"] = row["phone_iso2"]
    return phone


def create_person(row):
    body = {
        "name": {"firstName": row["first_name"], "lastName": row["last_name"] or "-"},
        "emails": {"primaryEmail": row["email"]},
        "customerType": row["customer_type"],
        "leadStatus": row["lead_status"],
        "leadSource": row["lead_source"],
        "preferredLanguage": row["preferred_language"],
    }
    if row.get("sport"):
        body["sport"] = row["sport"]
    if row.get("sign_up_date"):
        body["signUpDate"] = row["sign_up_date"]
    if row.get("plan_purchased"):
        body["planPurchased"] = row["plan_purchased"]
    if row.get("athlete_level"):
        body["athleteLevel"] = row["athlete_level"]
    if row.get("address_country"):
        body["addressCountry"] = row["address_country"]
    phone = phone_body(row)
    if phone:
        body["phones"] = phone
    result = twenty_request("POST", "/rest/people", body)
    return result["data"]["createPerson"]["id"]


def update_person(person_id, row):
    body = {
        "customerType": row["customer_type"],
        "leadStatus": row["lead_status"],
    }
    if row.get("athlete_level"):
        body["athleteLevel"] = row["athlete_level"]
    if row.get("address_country"):
        body["addressCountry"] = row["address_country"]
    if row.get("sign_up_date"):
        body["signUpDate"] = row["sign_up_date"]
    phone = phone_body(row)
    if phone:
        body["phones"] = phone
    result = twenty_request("PATCH", f"/rest/people/{person_id}", body)
    return result["data"]["updatePerson"]["id"]


def main():
    if not TWENTY_API_KEY:
        sys.exit("Set TWENTY_API_KEY first (from Bitwarden) -- never hardcode it here.")
    if len(sys.argv) != 3:
        sys.exit("Usage: python3 backfill_existing_customers.py <input.csv> <output.sql>")

    input_path, output_path = sys.argv[1], sys.argv[2]
    sql_rows = []
    errors = []

    with open(input_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=2):  # row 1 is the header
            email = pick(row, "email").lower()
            customer_type = pick(row, "customerType", "customer_type").upper()
            language = pick(row, "preferredLanguage", "preferred_language").upper()
            sport = pick(row, "sport").upper()
            lead_source = pick(row, "leadSource", "lead_source").upper() or "OTHER"
            lead_status = pick(row, "leadStatus", "lead_status").upper() or "WON_CUSTOMER"
            plan_purchased = pick(row, "planPurchased", "plan_purchased")
            sign_up_date = pick(row, "signUpDate", "purchase_date")  # plain YYYY-MM-DD, not a datetime
            athlete_level = pick(row, "athleteLevel", "athlete_level").upper()
            address_country = pick(row, "addressCountry", "address_country")
            phone_raw = pick(row, "Whatsapp", "whatsapp", "phone")
            phone_calling_code, phone_local_number, phone_iso2 = parse_phone(phone_raw, address_country)

            if athlete_level and athlete_level not in VALID_ATHLETE_LEVELS:
                errors.append(f"Row {i} ({email}): athleteLevel '{athlete_level}' not a known value -- sending anyway, Twenty will 400 if it's wrong.")
            if phone_raw and not phone_calling_code:
                errors.append(f"Row {i} ({email}): couldn't parse phone '{phone_raw}' -- no calling code recognized, phone NOT set for this person.")
            elif phone_raw and not phone_iso2:
                errors.append(f"Row {i} ({email}): phone '{phone_raw}' parsed as calling code {phone_calling_code}, but couldn't resolve a country code -- sent without primaryPhoneCountryCode, may be rejected or misformatted.")

            if not email:
                errors.append(f"Row {i}: missing email, skipped.")
                continue
            if customer_type not in VALID_CUSTOMER_TYPES:
                errors.append(f"Row {i} ({email}): customer_type '{customer_type}' invalid, skipped.")
                continue
            if language not in VALID_LANGUAGES:
                errors.append(f"Row {i} ({email}): preferred_language '{language}' invalid, skipped.")
                continue
            if sport and sport not in VALID_SPORTS:
                errors.append(f"Row {i} ({email}): sport '{sport}' not a known value -- sending anyway, Twenty will 400 if it's wrong.")

            clean_row = {
                "email": email,
                "first_name": pick(row, "first_name"),
                "last_name": pick(row, "last_name"),
                "customer_type": customer_type,
                "preferred_language": language,
                "sport": sport,
                "lead_source": lead_source,
                "lead_status": lead_status,
                "plan_purchased": plan_purchased,
                "sign_up_date": sign_up_date,
                "athlete_level": athlete_level,
                "address_country": address_country,
                "phone_calling_code": phone_calling_code,
                "phone_local_number": phone_local_number,
                "phone_iso2": phone_iso2,
            }

            try:
                existing = find_person_by_email(email)
                if existing:
                    person_id = update_person(existing["id"], clean_row)
                    print(f"  updated  {email} -> {person_id}")
                else:
                    person_id = create_person(clean_row)
                    print(f"  created  {email} -> {person_id}")
            except RuntimeError as e:
                errors.append(f"Row {i} ({email}): Twenty API error -- {e}")
                continue

            token = gen_token()
            sql_rows.append(
                "  (" + ", ".join([
                    sql_escape(person_id),
                    sql_escape(email),
                    sql_escape(token),
                    sql_escape(clean_row["preferred_language"]),
                    "TRUE",
                ]) + ")"
            )
            print(f"           token: {token}")

    if sql_rows:
        sql = (
            "-- Generated by backfill_existing_customers.py -- review before running.\n"
            "INSERT INTO subscriber_tokens (twenty_person_id, email, token, preferred_language, active)\n"
            "VALUES\n"
            + ",\n".join(sql_rows)
            + "\nON CONFLICT (token) DO NOTHING;\n"
        )
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(sql)
        print(f"\n{len(sql_rows)} people processed. SQL written to {output_path}.")
        print("Run it with:")
        print(f"  docker exec -i analytics-postgres psql -U analytics -d members < {output_path}")
    else:
        print("\nNo rows produced valid output.")

    if errors:
        print(f"\n{len(errors)} row(s) skipped or flagged:")
        for e in errors:
            print(f"  - {e}")


if __name__ == "__main__":
    main()
