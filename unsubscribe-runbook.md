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

## Status — live, all three languages, September 6, 2026

**Verified against the real stack, not a mock.** Invalid token → HTTP 404 and the trilingual `Enlace no válido` page. Valid tokens, one per language, each returning its own page from the token's `lang` column and echoing the address back:

| lang | bytes | `<h1>` |
|---|---|---|
| SPANISH | 1354 | Listo, te diste de baja |
| ENGLISH | 1353 | You're unsubscribed |
| PORTUGUESE | 1376 | Pronto, você foi descadastrado |

*Three `email_suppression` rows written, `used_at` set, test rows removed.* **The invalid-link page is trilingual on one page by design** — with no matching token there is no row, so there is no language to select.

***`email_suppression.source` is copied from the token, so every unsubscribe records which send produced it.*** *That is the number that says whether a piece of copy is burning the list, and it only works if every send passes a real `--source`.*

## What the build actually cost — three defects, one node, September 6, 2026

**Verified live the same day it was written; the endpoint took four import cycles.** Recorded because every failure printed a plausible success, and the shape repeats.

| # | Defect | What every check reported |
|---|---|---|
| 1 | `respondToWebhook` at typeVersion **1.1** while the instance runs **1.4** | nothing — real mismatch, not the cause |
| 2 | `Build Page` read `$json`, whose upstream is an **INSERT** node, so `email`/`lang` were undefined | page rendered in the **Spanish fallback with a blank address** |
| 3 | Same node was `runOnceForEachItem` while the code **returned an array**, and `.item` needs pairing an INSERT does not carry | **HTTP 200, correct database writes, EMPTY BODY** |

🚨 ***Defect 3 is the one worth remembering: status 200, suppression row present, `used_at` set — and the recipient sees a blank page.*** *Every check that touched the write side passed. The check that found it was `curl … | wc -c`.*

⚠️ **Two rules this leaves behind.**
**(a) In an n8n Code node, read the row you need from the node that produced it — `$('Lookup Token').first().json`, never bare `$json`.** *Whatever sits immediately upstream may be a write node whose output is a query result, not your data.*
**(b) Byte-count the response before grepping it.** *Three rounds of `grep` for the wrong strings hid an empty body; `wc -c` showed it in one command.* **A grep that finds nothing and a body that contains nothing are indistinguishable.**

*Same family as the `(not set)` GA4 sentinel, the empty `gbp_keywords` fetch, and the `Ejercicio N de M` string that rendered Spanish on four translated pages for three weeks: **a verification that only touches the half that works reports success.***

## 🚨 The token IS the identity — never reuse one in a test

*(Learned the hard way, September 6, 2026, on the first real test send.)*

**A test recipient built by editing `email` in the send workflow while keeping a real recipient's `token` will suppress the REAL PERSON.** The endpoint never sees who the mail was addressed to — it does `SELECT email FROM unsubscribe_tokens WHERE token = $1` and suppresses whatever comes back. *Iván changed the address to his own Gmail, clicked his own footer link, and unsubscribed an athlete who was never emailed.*

**So a test recipient gets its own minted token, always:**

```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
INSERT INTO unsubscribe_tokens (token, email, lang, source)
VALUES (encode(gen_random_bytes(16),'hex'), 'you+test@triaperformance.com', 'PORTUGUESE', 'send-test')
RETURNING token;
SQL
```

*Use the returned token in the test row, and clean up with `DELETE … WHERE source = 'send-test'` afterwards.*

**Reverting an accidental unsubscribe** — both effects, in one transaction:

```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
BEGIN;
DELETE FROM email_suppression
WHERE lower(email) = (SELECT lower(email) FROM unsubscribe_tokens WHERE token = '<token>');
UPDATE unsubscribe_tokens SET used_at = NULL WHERE token = '<token>';
COMMIT;
SQL
```

⚠️ **Reverting is only ever legitimate for a self-inflicted test.** *A real person's unsubscribe is never undone from the database — if they ask to be re-added, they say so and it is recorded as their request in `reason`.*

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

## Click tracking — `/c/<code>` (added September 6, 2026)

**Built on the service that already existed, not beside it.** `/w/` (workout links) is served by the members auth service on `127.0.0.1:8091`: JSON registry → 302 → one logged row. `/c/` is the same route shape in the same Flask app, and differs in exactly one respect.

⚠️ **Identity.** `/w/` knows the clicker from the `members_token` cookie. **A cold email recipient has no cookie**, so `/c/` carries `?k=<click_id>`, minted per recipient by `mint-unsubscribe-tokens.py`.

🚨 ***The `click_id` is deliberately NOT the unsubscribe token.*** *Checkout links get forwarded. If the same id served both purposes, the person who received the forward could construct the unsubscribe URL and unsubscribe the sender.* **Two ids, two jobs.** *The redirect also sets `Referrer-Policy: no-referrer`, so the id is never handed to the destination site.*

**Why this exists when the emails already carry UTMs:** a UTM only reports on a page running *our* GA4. **The highest-intent click in an All-Access email goes to `checkout.trainingpeaks.com`, which does not — so before this route that click was structurally uncountable.** A redirect we own is logged before the browser leaves.

**Registry:** `site/_data/campaignLinks.json`, keyed by `code`. Destinations are **absolute and may be off-site** (unlike `workoutLinks.json`, whose values are `library.json` keys). Add a code, `git pull`, and it is live — the service re-reads on mtime, no restart. **An unknown code never 404s**: it falls back to the registry `fallback` and is still logged under its own code, so a typo shows up as clicks rather than silence.

**Link shape in an email:** `https://triaperformance.com/c/aa-pt-checkout?k={{ click_id }}`

**Install:** `docker exec -i analytics-postgres psql -U analytics -d members < automation/schema-campaign-links.sql`, deploy the Caddyfile (`handle /c/*`), and **rebuild/restart the members auth container** — `app.py` changed, and that is the only piece here that needs a restart.

**No IP is stored** in `campaign_link_clicks`. It would be the only personal datum in the table the recipient never handed over, and it answers nothing this list is asked.

## The sequence board — `/admin/secuencias/`

**A static page, same construction as `/admin/enlaces/`**: `handle /admin/secuencias*` declared **above** `handle /admin/*` (or the content-engine admin 404s it), same single-user basic_auth, `file_server`.

Data: `automation/build-sequences-data.py` writes `site/_data/sequences.json` from the **`sequence_stats`** view, run inside `deploy-website.sh` **before** the Eleventy build. **It can never fail the deploy** — no database means the previous JSON is kept and the script exits 0. *A stale table beats no website, and the page prints `generated_at` so a stale one says so.*

🚨 ***Every rate divides by `sent`, never by `minted`.*** *The send workflow skips anyone already suppressed, so a roster count includes people who were never mailed — and dividing an unsubscribe count by that understates the burn rate, which is the one number here that must never look better than it is.* **`sent_at` on `unsubscribe_tokens` is what makes the distinction possible; the send workflow must set it.**

**No open rate, deliberately.** *Since Apple Mail Privacy Protection an open rate measures Apple's proxy, not a person.* The page says so, so nobody adds it later thinking it was an oversight.

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
