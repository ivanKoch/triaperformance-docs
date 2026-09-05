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

-- ---------------------------------------------------------------------------
-- member_access_log — one row per event, replacing the single mutable counter.
-- Added September 5, 2026.
--
-- WHY: `subscriber_tokens.access_count` answers "has this person ever opened
-- the members area" and nothing else. It cannot distinguish "8 have ever logged
-- in" from "8 users in August" (monthly-close/2026-08.md §Known gaps), and it
-- cannot answer the question the members-area announcement is about to raise:
-- WHICH tool did WHICH athlete open. This table answers both, and it does it
-- server-side from data Caddy already forwards -- no GA4 User-ID, no client JS,
-- nothing an ad blocker can drop.
--
-- 🚨 THE TOKEN STRING IS DELIBERATELY NOT IN THIS TABLE. It stores
-- `token_id` (FK) only. Same reasoning as the `token_roster` view above, and
-- the same failure it was built for: the query people actually type is
-- `SELECT *`, and a log gets read far more often than a roster does. A token is
-- a working password into paid content; it belongs in exactly one table.
--
-- Grain is PAGE-level, not interaction-level: it records that an athlete opened
-- /members/rodillas/, not that they ran a routine. That is a deliberate v1
-- scope (Iván, September 5, 2026) -- against a baseline of 2 of ~35 athletes
-- ever logging in, "opened it at all" is the whole question.
-- ---------------------------------------------------------------------------

-- Excludes a person from usage metrics by WHO THEY ARE rather than by network.
-- Added with this table for the Bogotá tester and Iván's own tokens: no IP rule
-- reaches a phone on someone else's wifi, and a cookie-bound device list drifts
-- (see open-loops.md, the internal-traffic item closed September 4, 2026).
ALTER TABLE subscriber_tokens
    ADD COLUMN IF NOT EXISTS excluded_from_metrics BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS member_access_log (
    id          BIGSERIAL PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_type  TEXT        NOT NULL,          -- 'page' | 'link'
    token_id    INTEGER     REFERENCES subscriber_tokens (id),  -- NULL = anonymous /w/ click
    path        TEXT        NOT NULL,          -- the page opened, or the /w/ code path
    link_code   TEXT,                          -- 'link' events only, e.g. 'activacion-run'
    link_slot   TEXT,                          -- 'link' events only, the workout context
    destination TEXT,                          -- 'link' events only, where the 302 sent them
    CONSTRAINT member_access_log_event_type_chk
        CHECK (event_type IN ('page', 'link'))
);

CREATE INDEX IF NOT EXISTS idx_member_access_log_token_time
    ON member_access_log (token_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_access_log_time
    ON member_access_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_access_log_code
    ON member_access_log (link_code) WHERE link_code IS NOT NULL;

-- ---------------------------------------------------------------------------
-- member_activity — the readable join. Tokenless, like token_roster, and for
-- the same reason. Use this for anything person-shaped; query the base table
-- only when you need a column this view does not carry.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW member_activity AS
SELECT l.id,
       l.occurred_at,
       l.event_type,
       t.email,
       t.twenty_person_id,
       t.preferred_language,
       t.excluded_from_metrics,
       l.path,
       l.link_code,
       l.link_slot,
       l.destination
FROM member_access_log l
LEFT JOIN subscriber_tokens t ON t.id = l.token_id;

-- ---------------------------------------------------------------------------
-- member_tool_usage — "which athlete used which tool", which is the whole point.
-- One row per athlete per page, with first/last touch and a visit count.
-- Excluded tokens are dropped here rather than in every ad-hoc query.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW member_tool_usage AS
SELECT t.email,
       t.preferred_language,
       l.path,
       count(*)             AS visits,
       min(l.occurred_at)   AS first_seen,
       max(l.occurred_at)   AS last_seen
FROM member_access_log l
JOIN subscriber_tokens t ON t.id = l.token_id
WHERE l.event_type = 'page'
  AND t.excluded_from_metrics = FALSE
GROUP BY t.email, t.preferred_language, l.path;

-- ---------------------------------------------------------------------------
-- workout_link_clicks — the TrainingPeaks channel, by code.
-- `athletes` counts identified clickers; `anonymous_clicks` are clicks with no
-- members cookie, which is the population the old UTM plan could never see:
-- an athlete who clicks from a workout, meets the login wall and stops.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW workout_link_clicks AS
SELECT l.link_code,
       l.link_slot,
       count(*)                                              AS clicks,
       count(DISTINCT l.token_id)                            AS athletes,
       count(*) FILTER (WHERE l.token_id IS NULL)            AS anonymous_clicks,
       min(l.occurred_at)                                    AS first_click,
       max(l.occurred_at)                                    AS last_click
FROM member_access_log l
LEFT JOIN subscriber_tokens t ON t.id = l.token_id
WHERE l.event_type = 'link'
  AND COALESCE(t.excluded_from_metrics, FALSE) = FALSE
GROUP BY l.link_code, l.link_slot;

-- Retention: none. ~35 athletes at a handful of page views each is a few
-- thousand rows a year. Revisit if it ever reaches a scale where that is a
-- sentence anyone has to think about.
