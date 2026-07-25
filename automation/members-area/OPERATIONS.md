# Members Area — Day-to-Day Operations Cheat Sheet

All commands run on the VPS (`ssh root@179.197.76.70`), against the `members`
database on the `analytics-postgres` container. None of this touches Twenty
directly -- Twenty access and the `subscriber_tokens` table are deliberately
decoupled (see `ai-infrastructure-documentation.md` §13).

## 1. New athlete — create their access token

You've already created/updated the Person in Twenty manually. Now:

**Step 1 — get their Twenty person ID.** Open their record in Twenty, copy
the UUID from the URL (`https://.../object/person/<this-part>`).

**Step 2 — generate a token:**
```bash
python3 -c "import secrets; print(''.join(secrets.choice('ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789') for _ in range(20)))"
```

**Step 3 — insert it:**
```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "INSERT INTO subscriber_tokens (twenty_person_id, email, token, preferred_language, active) VALUES ('<person-id>', '<email>', '<token-from-step-2>', 'SPANISH', TRUE);"
```
(`preferred_language` is `SPANISH`, `ENGLISH`, or `PORTUGUESE`.)

That's it — no email is sent automatically. Send them the password yourself,
however you prefer.

*Alternative for multiple new athletes at once*: use `backfill_existing_customers.py`
with a CSV instead of doing this one-by-one (see its docstring).

## 2. Query all tokens
```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "SELECT email, active, access_count, last_accessed_at, created_at FROM subscriber_tokens ORDER BY created_at DESC;"
```

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

**Check who has NOT been granted access at all** — that's a Twenty question,
not a Postgres one (compare Twenty's People list, filtered by `customerType`,
against the emails already in `subscriber_tokens`). No single command for
this yet; worth building if the athlete list grows large enough to make
manual comparison unreliable.
