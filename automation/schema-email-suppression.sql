-- Email suppression + unsubscribe tokens.
-- Lives in the `members` database on analytics-postgres, alongside
-- subscriber_tokens, so n8n reuses the existing "Members Postgres" credential
-- and no new credential is created.
--
-- Design note: the unsubscribe link carries a RANDOM PER-RECIPIENT TOKEN, not
-- an HMAC of the address. That was deliberate -- an HMAC needs a shared secret
-- readable from inside an n8n Code node, which means either $env access or a
-- secret pasted into workflow JSON, and the second is forbidden by the repo's
-- own rule. A random token needs neither: the webhook does one SELECT.
-- It also means a link cannot be constructed for an address you do not
-- already hold a token for, so the endpoint cannot be used to enumerate or
-- mass-unsubscribe the list.

CREATE TABLE IF NOT EXISTS email_suppression (
    email        text PRIMARY KEY,
    reason       text NOT NULL DEFAULT 'user_unsubscribe',
    source       text,                       -- which send produced it
    created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE email_suppression IS
  'Never email these addresses again. Checked before EVERY send, by every '
  'workflow and script, with no exception for transactional-looking mail.';

CREATE TABLE IF NOT EXISTS unsubscribe_tokens (
    token        text PRIMARY KEY,           -- 32 hex chars, random per recipient per send
    email        text NOT NULL,
    lang         text NOT NULL DEFAULT 'SPANISH',
    source       text,                       -- the send this token was minted for
    created_at   timestamptz NOT NULL DEFAULT now(),
    used_at      timestamptz
);

CREATE INDEX IF NOT EXISTS unsubscribe_tokens_email_idx ON unsubscribe_tokens (email);

-- The only query a sender ever needs. Left join, not NOT IN: a NULL in a
-- NOT IN subquery silently returns zero rows and a send that mails nobody
-- looks identical to a send with nobody due.
--
--   SELECT c.email FROM candidates c
--   LEFT JOIN email_suppression s ON lower(s.email) = lower(c.email)
--   WHERE s.email IS NULL;
