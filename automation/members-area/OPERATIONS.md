# Members Area — Day-to-Day Operations Cheat Sheet

All commands run on the VPS (`ssh root@179.197.76.70`), against the `members`
database on the `analytics-postgres` container. None of this touches Twenty
directly -- Twenty access and the `subscriber_tokens` table are deliberately
decoupled (see `ai-infrastructure-documentation.md` §13).

## 1. Granting a members token

*(Rewritten September 6, 2026. The previous version documented one path — look
up the person ID in the Twenty UI, generate, INSERT — and then bolted a note on
top saying not to do that. Two real cases were left undocumented: the person who
is not in Twenty at all, and the field-by-field reason `members_access_gap.py`
refuses. Both are below.)*

**Two questions decide the whole thing.**

```
Is the person in Twenty?
│
├── NO ──→ §1a  backfill_existing_customers.py
│                (creates the Person AND emits the token INSERT)
│
└── YES ─→ Is their record correct? — the six checks in §1b
           │
           ├── YES ──→ §1b  members_access_gap.py --only <email> --apply
           │
           └── NO ───→ fix Twenty, then §1b
                       …unless it is a test/QA address, which will never
                       be in Twenty and is refused on purpose → §1c
```

Nothing here sends an email. You send the password yourself, and you pull it
from §3 **at the moment you send it** — never earlier, never in bulk.

---

### 1a. The person is not in Twenty yet

`members_access_gap.py` cannot do this, and that is not a gap to work around:
it *reconciles* Twenty against the token table, so somebody Twenty has never
heard of appears in neither list it builds. `--only` on them returns
`not in the PAYING-NO-ACCESS list`, which is true and unhelpful.

Use the bulk script with a one-row CSV. It owns this case.

```bash
cd ~/.hermes/triaperformance-docs && git pull
set -a; source ~/.hermes/.env; set +a          # TWENTY_API_KEY

cat > /tmp/one.csv <<'CSV'
email,first_name,last_name,customer_type,preferred_language
athlete@example.com,Nombre,Apellido,OPT1_1_COACHING,SPANISH
CSV

python3 automation/members-area/backfill_existing_customers.py /tmp/one.csv /tmp/insert.sql
```

**Required columns: `email`, `customer_type`, `preferred_language`.** Everything
else is optional and only used when it has to CREATE the Person:
`first_name`, `last_name`, `sign_up_date` (plain `YYYY-MM-DD`), `lead_source`
(default `OTHER`), `lead_status` (default `WON_CUSTOMER`), `sport`,
`plan_purchased`. It accepts either camelCase or snake_case headers, so a raw
export works unrenamed.

If the person *is* found in Twenty it PATCHes rather than creates — and that
PATCH is the reason this script is not the default: it will set `leadStatus`
to `WON_CUSTOMER` on someone whose status you had deliberately set to something
else. **On a person already in Twenty and already correct, use §1b instead.**

**It never touches Postgres.** Read the SQL, then run it:

```bash
cat /tmp/insert.sql
docker exec -i analytics-postgres psql -U analytics -d members < /tmp/insert.sql
```

⚠️ **It does not check for an existing token** — its own docstring flags this as
the one thing you must check by hand, or the person ends up with two active
rows:

```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
SELECT email, active, created_at FROM token_roster WHERE email = 'athlete@example.com';
SQL
```

---

### 1b. The person is already in Twenty and correct

This is the everyday case, and the one worth having reflexes for.

```bash
cd ~/.hermes/triaperformance-docs && git pull
set -a; source ~/.hermes/.env; set +a

python3 automation/members_access_gap.py                                  # both lists
python3 automation/members_access_gap.py --only athlete@example.com       # dry run
python3 automation/members_access_gap.py --only athlete@example.com --apply
```

Comma-separate for several. `--grant-all` takes the whole list — **read it
first, your own address is usually in it.**

Run it **on the VPS**: it shells out to `docker exec` for Postgres and needs
Tailscale to reach Twenty at `100.70.89.17:3000`.

#### The six checks, in the order the script applies them

A dry run tells you which one failed. This table tells you why, and — more
usefully — which are **silent**.

| # | What | Must be | If not |
|---|---|---|---|
| 1 | `emails.primaryEmail` | present | **silently skipped** — no row, no message |
| 2 | the email string | must NOT contain `coach+`, `curl`, `prueba`, `test@` | **silently skipped** (`TEST_EMAIL_MARKERS`) → §1c |
| 3 | `customerType` | `OPT1_1_COACHING` or `ALL_ACCESS` | not entitled. `PLAN_BUYER` is excluded on purpose — a marketplace plan buys a plan, not the members area |
| 4 | `churnDate` / `leadStatus` | `churnDate` empty **and** status ≠ `CHURNED_CUSTOMER` | treated as churned, not entitled |
| 5 | `preferredLanguage` | `SPANISH`, `ENGLISH`, `PORTUGUESE`, **or blank** | any *other* value is a refusal. Blank defaults to SPANISH and prints `<-- no preferredLanguage in Twenty, defaulting` |
| 6 | `subscriber_tokens` | **no** row for that email, active or revoked | refusal — reactivate with §5, never insert a second row |

Checks 1–4 decide whether the person reaches the `PAYING, NO MEMBERS ACCESS`
list at all. **Only 5 and 6 produce a `REFUSED` line.** That asymmetry is the
thing to internalise: a person failing 1–4 does not get an error, they get
absence, and `--only` then reports the generic message below.

#### The two messages you will actually see

**`REFUSED  <email>  not in the PAYING-NO-ACCESS list -- re-run without --grant and check`**
One of checks 1–4, and the message cannot tell you which. Run the script bare
and read list 1. In practice it is almost always check 2 (a `coach+` alias) or
check 3 (`customerType` still `PLAN_BUYER` or empty on a freshly created
Person).

**`SHORT READ: --expect 290, fetched 293`**
`--expect` is an optional second guard on top of the `totalCount` check that
always runs. It is a hardcoded number and it goes stale **the next time you add
anyone to Twenty**. Either drop the flag or update it to the count the script
prints on its first line. Do not lower it to make the error go away — a short
read here once named three active athletes as holding stale access.

#### After it applies

It prints `GRANTED` and **not the token**, deliberately. Pull it with §3 when
you message the athlete.

---

### 1c. A test or QA row, or anything that will never exist in Twenty

Both scripts refuse `coach+` addresses by design — the same filter that keeps
your own aliases out of the reconciliation counts, which is what makes those
counts mean what they look like. So this case is manual, and it should stay
manual.

```bash
TOKEN=$(python3 -c "import secrets;print(''.join(secrets.choice('ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789') for _ in range(20)))")
docker exec -i analytics-postgres psql -U analytics -d members <<SQL
INSERT INTO subscriber_tokens
  (twenty_person_id, email, token, preferred_language, active, excluded_from_metrics)
VALUES
  ('QA-FIXTURE', 'coach+whatever@triaperformance.com', '$TOKEN', 'SPANISH', TRUE, TRUE);
SQL
echo "TOKEN: $TOKEN"
```

Two fields carry the weight:

- **`twenty_person_id = 'QA-FIXTURE'`** — the sentinel is a readable string
  rather than a UUID precisely so it can be excluded by eye. It is also what
  keeps the "no stray test rows" assertion at the bottom of this file clean,
  since that check tolerates `%+%` addresses *only* under this sentinel.
- **`excluded_from_metrics = TRUE`** — excludes by *who they are*, so it holds
  on any device and any network. Without it the row inflates every usage query
  in §6, and those are read against close #1's baseline.

`twenty_person_id` is `NOT NULL`, so it needs *something*; `QA-FIXTURE` is the
right something for anything that is not a real Twenty Person.

---

### 1d. Manual fallback — a real athlete, no scripts available

Only when the VPS is all you have, or Twenty is unreachable.

**Step 1** — open their record in Twenty, copy the UUID from the URL
(`https://.../object/person/<this-part>`).

**Step 2 and 3** — generate and insert in one go:

```bash
TOKEN=$(python3 -c "import secrets;print(''.join(secrets.choice('ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789') for _ in range(20)))")
docker exec -i analytics-postgres psql -U analytics -d members <<SQL
INSERT INTO subscriber_tokens (twenty_person_id, email, token, preferred_language, active)
VALUES ('<person-id>', '<email>', '$TOKEN', 'SPANISH', TRUE);
SQL
echo "TOKEN: $TOKEN"
```

`preferred_language` is `SPANISH`, `ENGLISH` or `PORTUGUESE` and must match what
Twenty holds, or the login routes them to the wrong language.

> ~~**The query below has no `token` column, on purpose.**~~ *(Note added Aug 10, 2026, after the whole table — 36 live tokens — was pasted into a chat transcript twice in one session.)* **That warning failed. It happened again on Aug 12, which makes three times in three days, and the reason is not carelessness: the query anyone actually types is `SELECT *`, and the useful diagnostic is the same keystrokes as the dangerous one.**
>
> **So §2 below no longer queries the table at all — it queries `token_roster`, a view that does not contain the column.** You cannot leak a token through it by accident, including with `SELECT *`. Use it for anything roster-shaped: who has access, who has never logged in, language mix. Use §3 to pull **one** person's token, which is the only case that ever legitimately needs one.
>
> *If you find yourself typing `SELECT * FROM subscriber_tokens`, that is the thing to stop doing — and it is now the only way to get it wrong, which is the point.*

## 2. Query the roster (no tokens — use this by default)

```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "SELECT * FROM token_roster ORDER BY created_at DESC;"
```

Sorted by language instead, which is the useful cut when checking that nobody is on the wrong one:

```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "SELECT preferred_language, email, active, access_count
     FROM token_roster
    ORDER BY CASE preferred_language WHEN 'ENGLISH' THEN 1 WHEN 'PORTUGUESE' THEN 2 ELSE 3 END, email;"
```

*The view is defined in `schema.sql`. If it does not exist yet on a given box, re-run that file — it is `CREATE OR REPLACE`, so it is safe to run against a live database.*

## 3. Query a specific person
```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "SELECT * FROM subscriber_tokens WHERE email = 'someone@example.com';"
```

## 4. Deactivate a token (revoke access)
```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "UPDATE subscriber_tokens SET active = FALSE, revoked_at = now() WHERE email = 'someone@example.com' AND active = TRUE;"
```

## 5. Reactivate a token (restore access)
```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "UPDATE subscriber_tokens SET active = TRUE, revoked_at = NULL WHERE email = 'someone@example.com';"
```
Note: if someone has more than one row (e.g. re-subscribed, or backfilled
twice), this reactivates *all* their rows. To target one specific token
instead, swap the `WHERE` clause for `WHERE token = '<exact-token>'`.

## 6. Usage — which athlete used which tool

*(Added September 5, 2026, with `member_access_log`. Before this, `access_count`
was a single mutable counter per token: it could say "eight people have ever
opened the members area" and nothing else — not who, not which tool, not
whether it was this month. `access_count` is still written alongside, because
close #1 baselined on it and `token_roster` reads it.)*

**Everything one athlete has opened:**
```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
SELECT path, visits, first_seen, last_seen
FROM member_tool_usage
WHERE email = 'athlete@example.com'
ORDER BY last_seen DESC;
SQL
```

**Which tools are being used at all, and by how many different athletes:**
```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
SELECT path,
       count(DISTINCT email) AS athletes,
       sum(visits)           AS visits,
       max(last_seen)        AS last_seen
FROM member_tool_usage
GROUP BY path
ORDER BY athletes DESC, visits DESC;
SQL
```

**Who has opened the members area since the announcement, and who still has not:**
```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
SELECT r.email,
       r.preferred_language,
       count(l.id) FILTER (WHERE l.occurred_at >= DATE '2026-09-08') AS visits_since,
       max(l.occurred_at)                                            AS last_seen
FROM token_roster r
LEFT JOIN member_access_log l
       ON l.token_id = r.id AND l.event_type = 'page'
WHERE r.active
GROUP BY r.email, r.preferred_language
ORDER BY visits_since DESC, r.email;
SQL
```
*Change the date to the send date. This is the read on the announcement: the
baseline is close #1's 38 tokens / 2 real users / 7 accesses.*

**Raw recent activity (tokenless — `member_activity` never carries the token):**
```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
SELECT occurred_at, email, event_type, path, link_code
FROM member_activity
ORDER BY occurred_at DESC
LIMIT 50;
SQL
```

**Exclude yourself or a tester from every usage view:**
```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
UPDATE subscriber_tokens
SET excluded_from_metrics = TRUE
WHERE email IN ('coach@triaperformance.com', 'tester@example.com');
SQL
```
*This excludes by **who they are**, so it holds on any device and any network —
which is the whole reason it exists. The GA4 internal-traffic rule is IP-based
and cannot reach a tester's phone on someone else's wifi.*

## 7. The TrainingPeaks workout links (`/w/`)

**How each link is performing:**
```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
SELECT link_code, link_slot, clicks, athletes, anonymous_clicks, last_click
FROM workout_link_clicks
ORDER BY clicks DESC;
SQL
```

🔑 ***`anonymous_clicks` is the column to read first.*** *It counts clicks that
arrived with no members cookie — an athlete who clicked from a workout, met the
login wall and stopped. **That population is invisible to any UTM scheme**,
because Caddy nests the query string inside `next=` and GA4 does not parse it.
A code with clicks and no athletes is not a dead link; it is a login problem.*

**Which athletes clicked a given code:**
```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
SELECT occurred_at, COALESCE(email, '(anónimo)') AS athlete, destination
FROM member_activity
WHERE event_type = 'link' AND link_code = 'activacion-vo2'
ORDER BY occurred_at DESC;
SQL
```

**Codes being clicked that are not in the registry** (a typo pasted into a
workout — permanent, since a published plan is a static snapshot, so it has to
be fixed by adding the code rather than by editing the workout):
```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
SELECT link_code, count(*) AS clicks, max(occurred_at) AS last_click
FROM member_access_log
WHERE event_type = 'link' AND link_slot IS NULL
GROUP BY link_code
ORDER BY clicks DESC;
SQL
```
*An unknown code never 404s — it logs itself and falls back to the athlete's
members home. This query is how you find out it happened.*

## Others worth having

**Count active subscribers:**
```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "SELECT count(*) FROM subscriber_tokens WHERE active = TRUE;"
```

**Who's never actually logged in** (access_count = 0 — useful for a
retention check-in, since these are people who were granted access but
never used it):
```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "SELECT email, created_at FROM subscriber_tokens WHERE active = TRUE AND access_count = 0 ORDER BY created_at;"
```

**Find duplicate active tokens** (data hygiene — same person with more than
one active row, e.g. from re-running a backfill):
```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "SELECT email, count(*) FROM subscriber_tokens WHERE active = TRUE GROUP BY email HAVING count(*) > 1;"
```

**Permanently delete a token row** (rare — normally deactivate instead;
only for cleaning up genuine test/junk data):
```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "DELETE FROM subscriber_tokens WHERE email = 'someone@example.com';"
```

## QA fixtures — three permanent test rows, one per language

*(Added August 10, 2026, during the members-area i18n branch.)*

Three rows live in `subscriber_tokens` permanently, marked
`twenty_person_id = 'QA-FIXTURE'`:

| Email | Language |
|---|---|
| `coach+qa-es@triaperformance.com` | SPANISH |
| `coach+qa-en@triaperformance.com` | ENGLISH |
| `coach+qa-pt@triaperformance.com` | PORTUGUESE |

**Read their tokens whenever you need them — this table is the log:**
```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "SELECT email, token, preferred_language FROM subscriber_tokens WHERE twenty_person_id = 'QA-FIXTURE' ORDER BY email;"
```
The values are deliberately **not** written down anywhere else. They are live
credentials into paid content; the no-secrets-in-docs rule applies to them
exactly as it does to anything else, and the query above makes a written copy
pointless. Bitwarden if you want them on a phone — never a repo file.

**Why plus-aliases on `coach@` rather than `example.com` or `.invalid`.**
These serve two different jobs and a non-deliverable address only covers one:
auth and routing tests (login language routing, gate redirects, logout) never
send mail, but email-content tests (welcome, resend-password) need a real
inbox. Plus-addressing routes to Iván's own mailbox — confirmed working
Aug 10, 2026 — so one set of fixtures covers both, instead of improvising a
throwaway address every time an email template changes.

**⚠️ Exclude them from every usage query.** These rows accumulate
`access_count` and are otherwise indistinguishable from real athletes. Any
"how many members actually use this" question must carry:
```sql
AND twenty_person_id <> 'QA-FIXTURE'
```
That is the entire reason the sentinel is a readable string rather than a
random UUID. This is the same mistake already paid for once with the
pixel data, where three personal IPs had to be excluded from
`plan_views_clean` after the numbers had already been read (see
`ai-infrastructure-documentation.md` §9) — the exclusion is cheap up front
and expensive to retrofit.

**Do not delete them in a test cleanup.** They are supposed to be there. The
"no test rows remain" assertion below is written to allow exactly these three
and nothing else:
```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "SELECT email FROM subscriber_tokens WHERE (email LIKE '%example.com' OR email LIKE 'test%' OR email LIKE '%+%') AND twenty_person_id <> 'QA-FIXTURE';"
```

**Check who has NOT been granted access at all** — that's a Twenty question,
not a Postgres one (compare Twenty's People list, filtered by `customerType`,
against the emails already in `subscriber_tokens`). No single command for
this yet; worth building if the athlete list grows large enough to make
manual comparison unreliable.
