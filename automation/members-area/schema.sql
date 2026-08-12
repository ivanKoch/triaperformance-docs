-- Members-area auth schema.
-- Own database ("members"), same "analytics-postgres" container already running
-- pixel-tracking data and the storefront tables (see ai-infrastructure-documentation.md
-- sections 9-10) -- consistent with the "own lane, same container" pattern used for
-- everything else on this VPS, no new infrastructure stood up for this.
--
-- To create: `createdb -U <pg_user> members` on the VPS (or via docker exec into the
-- analytics-postgres container), then run this file against it:
--   psql -U <pg_user> -d members -f schema.sql

CREATE TABLE IF NOT EXISTS subscriber_tokens (
    id               SERIAL PRIMARY KEY,
    twenty_person_id TEXT NOT NULL,
    email            TEXT NOT NULL,
    token            TEXT NOT NULL UNIQUE,
    preferred_language TEXT NOT NULL DEFAULT 'SPANISH', -- cached from Twenty; SPANISH/ENGLISH/PORTUGUESE
    active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at       TIMESTAMPTZ,
    access_count     INTEGER NOT NULL DEFAULT 0,     -- incremented on every /members/* page load, not just login
    last_accessed_at TIMESTAMPTZ
);

-- Fast lookup path for the auth-check service (every /members/* request hits this)
CREATE INDEX IF NOT EXISTS idx_subscriber_tokens_token ON subscriber_tokens (token) WHERE active = TRUE;

-- Fast lookup path for the n8n workflow (find-by-email on churn, and to avoid
-- generating a second token if someone re-subscribes after having churned before)
CREATE INDEX IF NOT EXISTS idx_subscriber_tokens_email ON subscriber_tokens (email);

-- ---------------------------------------------------------------------------
-- token_roster — the roster WITHOUT the passwords. Added August 12, 2026.
--
-- A token is a working password into paid content. The whole table, tokens
-- included, has now been pasted into a chat transcript three times in three
-- days. OPERATIONS.md §2 has omitted the token column since day one and a
-- warning was added on August 10; neither helped, for a reason worth stating
-- plainly: THE QUERY PEOPLE ACTUALLY TYPE IS `SELECT *`, and the useful
-- diagnostic and the dangerous one are the same keystrokes.
--
-- A warning asks someone to remember. A view means they cannot get it wrong.
-- Same reasoning as the link guard added to site/_data/plans.js the same day —
-- when a human error recurs, make the wrong thing impossible rather than write
-- the warning down again.
--
-- Use this for anything roster-shaped: who has access, who has never logged in,
-- who is active, language mix. Pull an actual token one person at a time
-- (OPERATIONS.md §3), which is the only case that ever legitimately needs one.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW token_roster AS
SELECT id,
       twenty_person_id,
       email,
       preferred_language,
       active,
       access_count,
       last_accessed_at,
       created_at,
       revoked_at
FROM subscriber_tokens;
