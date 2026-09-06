# Unsubscribe & suppression — runbook

**Home doc for the suppression list.** Owns the schema, the endpoint, the token
model, the footer copy in three languages, and the rule every sender must obey.
Built September 6, 2026. **Owns no email copy** other than the footer — bodies
live with their own send.

*Closes the `open-loops.md` item opened August 13, 2026: "No consent/unsubscribe
copy on either email-capture form… harmless for a single transactional send; it
stops being harmless the moment either list gets a sequence." That moment is the
CoachMatch Portuguese backlog (30 recipients).*

---

## The rule

> **Every send checks `email_suppression` first. Every send. No exception for
> mail that feels transactional.**

A suppressed address is suppressed for *everything* — sequences, announcements,
referral asks, lead magnets. The one carve-out a person would expect is genuine
account mail (a password they asked for); if that ever needs to bypass, it gets
an explicit, documented exception, not a quiet one.

```sql
SELECT c.email
FROM candidates c
LEFT JOIN email_suppression s ON lower(s.email) = lower(c.email)
WHERE s.email IS NULL;
```

⚠️ **`LEFT JOIN … IS NULL`, never `NOT IN`.** A single NULL inside a `NOT IN`
subquery makes the whole predicate return zero rows — and a send that mails
nobody looks exactly like a send with nobody due. Same failure family as the
`(not set)` sentinel in `sync_ga4_data.py` and the empty-fetch delete in
`gbp_keywords`: the broken version prints a plausible number.

## Why a random token and not an HMAC

The link carries a **random 32-hex token minted per recipient per send**, looked
up in `unsubscribe_tokens`.

An HMAC of the address would be stateless and tempting, but it needs a shared
secret readable inside an n8n Code node — which means either `$env` access or a
secret pasted into workflow JSON, and **the second is forbidden by this repo's
own rule**. A random token needs no secret at all: the webhook does one `SELECT`.

It also can't be used to enumerate: you cannot construct a working link for an
address whose token you don't already hold, so the endpoint can't be turned into
a mass-unsubscribe against the list.

## Install

**1. Schema** — `members` DB on `analytics-postgres`, so n8n reuses the existing
`Members Postgres` credential and no new credential is created.

```bash
docker exec -i analytics-postgres psql -U analytics -d members < automation/schema-email-suppression.sql
```

**2. Caddy** — `automation/Caddyfile` carries `/api/unsubscribe`. It ships on the
next daily `deploy-website.sh`, which diffs and validates before reloading; to
apply now, run that script manually.

**3. n8n** — import `automation/unsubscribe-workflow.json`, set the
`Members Postgres` credential on **both** Postgres nodes (the repo copy carries
`REPLACE_ME`, never a real id), activate.

**4. Verify end to end** *(do this before any send — it is two minutes)*

```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
INSERT INTO unsubscribe_tokens (token, email, lang, source)
VALUES ('deadbeefdeadbeefdeadbeefdeadbeef', 'ivan+unsubtest@triaperformance.com', 'PORTUGUESE', 'smoke-test');
SQL

curl -s -o /dev/null -w "%{http_code}\n" \
  "https://triaperformance.com/api/unsubscribe?t=deadbeefdeadbeefdeadbeefdeadbeef"   # expect 200
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://triaperformance.com/api/unsubscribe?t=doesnotexist"                        # expect 404

docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
SELECT email, reason, source FROM email_suppression WHERE email LIKE 'ivan+unsubtest%';
DELETE FROM email_suppression   WHERE email LIKE 'ivan+unsubtest%';
DELETE FROM unsubscribe_tokens  WHERE source = 'smoke-test';
SQL
```

⚠️ **The 404 case is the one that actually needs testing.** `Lookup Token` carries
`alwaysOutputData: true` precisely because a Postgres node that matches nothing
emits *no item at all* — the `If` would never run and the webhook would hang
until timeout, showing the clicker a blank page. That is invisible on the happy
path.

## Minting tokens for a send

```bash
python3 automation/mint-unsubscribe-tokens.py <list>.csv --source <send-id>
docker exec -i analytics-postgres psql -U analytics -d members < <send-id>-tokens.sql
```

Input CSV needs `email, lang, firstname`. Output is a merge CSV carrying
`unsubscribe_url`, plus the INSERTs. The script lowercases and de-duplicates
addresses, drops malformed ones, and defaults an unrecognised `lang` to Spanish
with a warning rather than silently.

**Minting a token is not permission to send.** The generated `.sql` ends with a
SELECT that returns any address on the list which is *already* suppressed —
run it, and remove whatever it returns from the merge file.

## Footer copy

Every bulk email ends with this. **Never omit it to make a message feel more
personal** — that is exactly the reasoning that produces a spam complaint.

**ES**
```
Recibís este correo porque pediste información sobre coaching en TrainingPeaks.
Si no querés recibir más, date de baja acá: {{unsubscribe_url}}
```
**EN**
```
You're receiving this because you asked about coaching on TrainingPeaks.
If you'd rather not hear from me, unsubscribe here: {{unsubscribe_url}}
```
**PT**
```
Você recebe este email porque pediu informação sobre coaching na TrainingPeaks.
Se preferir não receber mais, descadastre-se aqui: {{unsubscribe_url}}
```

*Naming the reason they're hearing from you is the half that reduces complaints —
"why am I getting this" is the question a spam click is usually answering.*

## Headers

On every bulk `Send an Email` node, under **Options → Email Headers**:

```
List-Unsubscribe: <mailto:coach@triaperformance.com?subject=unsubscribe>, <{{ $json.unsubscribe_url }}>
```

🚨 **Do NOT add `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.** That header
tells Gmail and Apple Mail to fire a **POST** at the URL, and this webhook is
`GET` only — the unsubscribe button would silently fail for exactly the people
most likely to press it, which is worse than not offering the button. If one-click
is wanted later, add POST to the webhook node **first**, verify it, then add the
header.

The `mailto:` is listed first on purpose: it works even if the endpoint is down.

## Retrofit — the rest of the senders

**Not done yet, and this list is the open part of the item.** Each of these sends
mail today and none of them checks suppression:

- `coachmatch-lead-automation.json` — email 1 (both languages)
- `coachmatch-email-nurture-2-3.json` — emails 2 and 3 (all four branches)
- `subscription-lifecycle-automation.json` — welcome + resend-password *(candidate
  for the account-mail exception; decide explicitly rather than by default)*
- `plan-lead-workflow.json`, `zone-workouts-workflow.json`, `contact-form-workflow.json`
  — lead-magnet delivery
- `automation/twenty_followup_check.py` — WhatsApp, not email, so out of scope
  **until** a suppression concept for WhatsApp exists. It does not today.

*Pattern for each: a Postgres node before the send —*
`SELECT 1 FROM email_suppression WHERE lower(email) = lower($1)` *with
`alwaysOutputData: true`, then an If that only sends when it comes back empty.*
