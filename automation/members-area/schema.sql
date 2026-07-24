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
