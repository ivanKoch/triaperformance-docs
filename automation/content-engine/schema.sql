-- Content engine — schema for the `content` database on analytics-postgres.
--
-- Same "own lane, same container" pattern as the analytics, storefront and
-- members databases (see ai-infrastructure-documentation.md §9-10, §13).
--
-- Create with:
--   docker exec -it analytics-postgres psql -U analytics -c "CREATE DATABASE content;"
--   docker exec -i analytics-postgres psql -U analytics -d content < schema.sql
--
-- The design principle from content-engine-brief.md §1: the status column IS the
-- orchestrator. Each agent owns exactly one transition, reads rows in one status
-- and writes them forward. Nothing calls anything else.

-- ---------------------------------------------------------------------------
-- Sources — the blogs we watch for signal. NOT for topics to copy: competing
-- with TrainingPeaks on a TrainingPeaks topic is a losing trade. What these are
-- for is timing (what's surfacing now) and gaps (what nobody covered well).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sources (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    site_url     TEXT NOT NULL,
    feed_url     TEXT,                    -- filled in by --check-sources once verified
    fetch_mode   TEXT DEFAULT 'auto',     -- auto | feed | html
    active       BOOLEAN DEFAULT TRUE,
    last_fetched TIMESTAMPTZ,
    last_error   TEXT,
    UNIQUE (site_url)
);

-- ---------------------------------------------------------------------------
-- Source corpus. One row per post seen. Kept so the agent can reason about
-- what's being covered over time, not just this week — a topic appearing in
-- four sources in one quarter is a signal; appearing once is noise.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS source_posts (
    id            SERIAL PRIMARY KEY,
    source_id     INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    url           TEXT NOT NULL,
    title         TEXT NOT NULL,
    summary       TEXT,
    published_at  TIMESTAMPTZ,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (url)
);

CREATE INDEX IF NOT EXISTS source_posts_published_idx ON source_posts (published_at DESC);

-- ---------------------------------------------------------------------------
-- Ideas. The research agent's only output.
--
-- article_type and cta_type are decided HERE, not after drafting. A gated
-- teaser is written differently from a plan guide from the first sentence —
-- deciding the offer afterwards produces a CTA bolted onto an article that
-- wasn't shaped for it.
-- ---------------------------------------------------------------------------
CREATE TYPE idea_status AS ENUM (
    'PROPOSED',   -- agent wrote it, waiting on Iván
    'APPROVED',   -- cleared for writing
    'REJECTED',
    'WRITTEN',    -- draft exists
    'PUBLISHED'
);

CREATE TYPE article_type AS ENUM (
    'plan_guide',    -- decision guide routing to specific plans
    'education',     -- topical authority. May sell nothing. That's allowed.
    'gated_teaser',  -- concept explained in full; the artifact is behind /members/
    'gear',          -- affiliate-oriented
    -- Athlete transformation story. Added July 27, 2026 after crawling Higher
    -- Running, the closest business analogue in the source list: roughly half
    -- their output is case studies, and they monetise through story and
    -- relationship rather than search. Iván has 45 five-star reviews and
    -- documented athlete cases in methodology.md and has never used them this
    -- way. Does not chase search volume; sells coaching.
    'case_study'
);

CREATE TYPE cta_type AS ENUM (
    'plan',        -- one or more specific plan_ids
    'all_access',  -- the subscription
    'coaching',    -- 1:1
    'affiliate',   -- gear
    'lead_magnet', -- the PDF guides, for email capture
    'none'         -- ranking and traffic is a legitimate goal on its own
);

CREATE TABLE IF NOT EXISTS content_ideas (
    id             SERIAL PRIMARY KEY,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    language       TEXT NOT NULL CHECK (language IN ('es', 'en', 'pt')),

    working_title  TEXT NOT NULL,
    angle          TEXT NOT NULL,   -- what WE can say that the sources can't
    target_query   TEXT,            -- the search intent this is aimed at
    rationale      TEXT NOT NULL,   -- why now, why us

    article_type   article_type NOT NULL,
    cta_type       cta_type NOT NULL,
    cta_target     TEXT,            -- plan_id(s), /members/ path, affiliate program

    -- What of ours backs this up: plan_ids, methodology sections, members
    -- artifacts, testimonials. An idea with an empty assets array is an idea
    -- anyone could write, which is the definition of one we shouldn't.
    our_assets     JSONB DEFAULT '[]'::jsonb,

    -- Which source posts triggered it, and how many sources touched the theme.
    evidence       JSONB DEFAULT '[]'::jsonb,
    source_count   INTEGER DEFAULT 0,

    score          INTEGER,         -- agent's own 1-100 confidence
    status         idea_status NOT NULL DEFAULT 'PROPOSED',
    decided_at     TIMESTAMPTZ,
    notes          TEXT,            -- Iván's note when approving or rejecting

    -- Set once the idea becomes a real article, so we can close the loop later.
    published_url  TEXT
);

CREATE INDEX IF NOT EXISTS content_ideas_status_idx ON content_ideas (status, created_at DESC);
CREATE INDEX IF NOT EXISTS content_ideas_lang_idx   ON content_ideas (language, status);

-- Convenience view for the review page and the notification threshold.
CREATE OR REPLACE VIEW pending_ideas AS
SELECT * FROM content_ideas
WHERE status = 'PROPOSED'
ORDER BY score DESC NULLS LAST, created_at DESC;
