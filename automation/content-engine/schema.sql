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

-- ---------------------------------------------------------------------------
-- Drafts. Added July 31, 2026 — the original schema stopped at ideas, so an
-- approved idea had nowhere to go and disappeared from the UI. This is the
-- second half of the pipeline.
--
--   content_ideas.status = APPROVED  ->  writer produces a content_pieces row
--   content_pieces.status = DRAFTED  ->  Iván reviews at /admin/drafts/
--   content_pieces.status = APPROVED ->  n8n commits the .njk file to GitHub
--   content_pieces.status = PUBLISHED
-- ---------------------------------------------------------------------------
CREATE TYPE piece_status AS ENUM (
    'DRAFTED',    -- writer produced it, waiting on Iván
    'APPROVED',   -- cleared to publish
    'REJECTED',
    'PUBLISHED'
);

CREATE TABLE IF NOT EXISTS content_pieces (
    id            SERIAL PRIMARY KEY,
    idea_id       INTEGER REFERENCES content_ideas(id) ON DELETE SET NULL,
    -- Translations point at the piece they were derived from, so an approved
    -- Spanish article can spawn its EN and PT siblings without re-deciding.
    parent_id     INTEGER REFERENCES content_pieces(id) ON DELETE SET NULL,

    language      TEXT NOT NULL CHECK (language IN ('es', 'en', 'pt')),
    slug          TEXT NOT NULL,

    -- Everything the Eleventy front matter needs.
    title         TEXT NOT NULL,   -- <title>, includes the brand suffix
    headline      TEXT NOT NULL,   -- H1
    short_title   TEXT,            -- breadcrumb
    standfirst    TEXT,
    description   TEXT NOT NULL,   -- meta description
    category      TEXT,            -- free-text label shown on the article page
    -- Closed vocabulary driving the blog listing's topic filter. Added Aug 24,
    -- 2026, after `category` proved unusable for it: the writer had invented 35
    -- distinct values across the first 60 articles, in three languages, so no
    -- filter could ever be built on it. Slugs only — the per-language labels
    -- live in site/_data/i18n.json, the allowed list in writer_agent.TOPICS.
    -- A translation inherits its parent's topic; it never chooses its own,
    -- because siblings are declared to search engines as the same page.
    topic         TEXT,
    trans_key     TEXT NOT NULL,   -- shared across the language siblings
    reading_time  INTEGER,

    body          TEXT NOT NULL,   -- the article HTML, minus front matter
    -- The model's untouched output, kept even after Iván edits `body`.
    -- Diffing the two over time is the only honest signal for what the
    -- writer prompt keeps getting wrong.
    original_body TEXT,

    model_used    TEXT,
    generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    status        piece_status NOT NULL DEFAULT 'DRAFTED',
    decided_at    TIMESTAMPTZ,
    notes         TEXT,

    published_at  TIMESTAMPTZ,
    published_url TEXT,
    file_path     TEXT,            -- e.g. site/blog/mi-articulo.njk

    UNIQUE (language, slug)
);

CREATE INDEX IF NOT EXISTS content_pieces_status_idx ON content_pieces (status, generated_at DESC);

CREATE OR REPLACE VIEW pending_drafts AS
SELECT p.*, i.article_type, i.cta_type, i.cta_target, i.angle, i.target_query
FROM content_pieces p
LEFT JOIN content_ideas i ON i.id = p.idea_id
WHERE p.status = 'DRAFTED'
ORDER BY p.generated_at DESC;

-- ---------------------------------------------------------------------------
-- approved_unpublished — pieces that were approved and then went nowhere.
--
-- Added August 12, 2026. Approving a piece flips it DRAFTED -> APPROVED, which
-- removes it from `pending_drafts` and therefore from /admin/drafts/, the only
-- page that can act on it. Publishing then happens by POSTing to n8n, and that
-- call is wrapped in a try/except that PRINTS the failure and returns a 303 to
-- a page which, by then, no longer lists the piece.
--
-- So the failure mode is: you click Publicar, the screen says nothing is
-- pending, and the article does not exist. Every subsequent visit agrees that
-- there is nothing to do. This view is what makes that state visible.
--
-- `published_at IS NULL` rather than a status check, deliberately: the piece is
-- stuck precisely because nothing has written back to it, so its status is the
-- one field guaranteed not to have moved.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW approved_unpublished AS
SELECT p.*, i.article_type, i.cta_type, i.target_query
FROM content_pieces p
LEFT JOIN content_ideas i ON i.id = p.idea_id
WHERE p.status = 'APPROVED' AND p.published_at IS NULL
ORDER BY p.decided_at;

-- Ideas cleared for writing that don't have a draft yet — the writer's queue.
CREATE OR REPLACE VIEW ideas_awaiting_draft AS
SELECT i.*
FROM content_ideas i
WHERE i.status = 'APPROVED'
  AND NOT EXISTS (SELECT 1 FROM content_pieces p WHERE p.idea_id = i.id)
ORDER BY i.score DESC NULLS LAST;
