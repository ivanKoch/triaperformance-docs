-- ============================================================================
-- Search Console + GA4 tables for the analytics Postgres on the VPS.
--
--   psql:  docker exec -i analytics-postgres psql -U <PG_USER> -d analytics \
--            < ~/.hermes/triaperformance-docs/automation/analytics/schema_analytics.sql
--
-- Safe to re-run: every statement is IF NOT EXISTS / OR REPLACE.
--
-- Two design decisions are load-bearing and are explained where they bite:
--
--   1. POSITION IS STORED ADDITIVELY, never as an average.
--      GSC's `position` is an impression-weighted average. Averaging an
--      average across rows is wrong, and it is the commonest GSC analysis bug
--      there is. The additive field (`sum_top_position` / `sum_position`) is
--      what the Search Console BigQuery bulk export stores, and it is the only
--      field that aggregates correctly. Average position is derived in the
--      views below and nowhere else.
--
--   2. COLUMN NAMES MIRROR THE GSC BIGQUERY BULK EXPORT EXACTLY.
--      The nightly feed is the Search Analytics API today (see
--      sync_gsc_data.py for why). If volume ever forces a move to the bulk
--      export, that becomes a change of source, not a migration: same column
--      names, same semantics, same `country` encoding (ISO-3166-1 alpha-3).
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. gsc_site_query — property-level, one row per date x query x country x device.
--    Mirrors `searchdata_site_impression` in the GSC bulk export.
--    This is the NEAR-MISS table: the queries the site already ranks 5-20 for.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gsc_site_query (
    data_date         DATE             NOT NULL,
    query             TEXT             NOT NULL,
    country           CHAR(3)          NOT NULL,   -- ISO-3166-1 alpha-3, as GSC returns it
    device            TEXT             NOT NULL,   -- DESKTOP | MOBILE | TABLET
    search_type       TEXT             NOT NULL DEFAULT 'web',
    impressions       INTEGER          NOT NULL,
    clicks            INTEGER          NOT NULL,
    sum_top_position  DOUBLE PRECISION NOT NULL,   -- (avg_position - 1) * impressions
    synced_at         TIMESTAMPTZ      NOT NULL DEFAULT now(),
    CONSTRAINT gsc_site_query_uk
        UNIQUE (data_date, query, country, device, search_type)
);

-- The near-miss query filters on a date window first, then aggregates.
-- data_date leading makes that window a range scan rather than a seq scan.
CREATE INDEX IF NOT EXISTS gsc_site_query_date_idx
    ON gsc_site_query (data_date);
CREATE INDEX IF NOT EXISTS gsc_site_query_country_date_idx
    ON gsc_site_query (country, data_date);
CREATE INDEX IF NOT EXISTS gsc_site_query_query_idx
    ON gsc_site_query (query);


-- ---------------------------------------------------------------------------
-- 2. gsc_url_query — page-level, one row per date x url x query x country x device.
--    Mirrors `searchdata_url_impression` in the GSC bulk export.
--    This is what attributes a near-miss to an article the engine actually wrote.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gsc_url_query (
    data_date     DATE             NOT NULL,
    url           TEXT             NOT NULL,
    query         TEXT             NOT NULL,
    country       CHAR(3)          NOT NULL,
    device        TEXT             NOT NULL,
    search_type   TEXT             NOT NULL DEFAULT 'web',
    impressions   INTEGER          NOT NULL,
    clicks        INTEGER          NOT NULL,
    sum_position  DOUBLE PRECISION NOT NULL,   -- (avg_position - 1) * impressions
    synced_at     TIMESTAMPTZ      NOT NULL DEFAULT now(),
    CONSTRAINT gsc_url_query_uk
        UNIQUE (data_date, url, query, country, device, search_type)
);

CREATE INDEX IF NOT EXISTS gsc_url_query_date_idx
    ON gsc_url_query (data_date);
CREATE INDEX IF NOT EXISTS gsc_url_query_url_date_idx
    ON gsc_url_query (url, data_date);
CREATE INDEX IF NOT EXISTS gsc_url_query_country_date_idx
    ON gsc_url_query (country, data_date);


-- ---------------------------------------------------------------------------
-- 3. ga4_page_day — one row per date x page_path x country x device_category.
--    Built from the GA4 -> BigQuery daily export (already running since
--    July 21, 2026), aggregated on the BigQuery side.
--
--    country is stored twice on purpose: GA4 emits a country NAME
--    ("Argentina"), GSC emits alpha-3 ("ARG"). Storing only one of them makes
--    every GSC/GA4 geography comparison a string-matching problem. country_iso3
--    is resolved by country_map.py and is NULL when the name is unmapped —
--    never silently guessed.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ga4_page_day (
    data_date         DATE        NOT NULL,
    page_path         TEXT        NOT NULL,
    country           TEXT        NOT NULL,   -- GA4's country name, verbatim
    country_iso3      CHAR(3),                -- resolved; NULL when unmapped
    device_category   TEXT        NOT NULL,
    sessions          INTEGER     NOT NULL,
    total_users       INTEGER     NOT NULL,
    views             INTEGER     NOT NULL,
    engaged_sessions  INTEGER     NOT NULL,
    synced_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ga4_page_day_uk
        UNIQUE (data_date, page_path, country, device_category)
);

CREATE INDEX IF NOT EXISTS ga4_page_day_date_idx
    ON ga4_page_day (data_date);
CREATE INDEX IF NOT EXISTS ga4_page_day_path_date_idx
    ON ga4_page_day (page_path, data_date);
CREATE INDEX IF NOT EXISTS ga4_page_day_iso3_date_idx
    ON ga4_page_day (country_iso3, data_date);


-- ---------------------------------------------------------------------------
-- 4. ga4_event_day — one row per date x event_name x page_path x country.
--    Carries the three conversion events the site fires from
--    site/_includes/partials/tracking.njk — select_plan, begin_checkout,
--    whatsapp_click — alongside page_view and session_start.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ga4_event_day (
    data_date     DATE        NOT NULL,
    event_name    TEXT        NOT NULL,
    page_path     TEXT        NOT NULL,
    country       TEXT        NOT NULL,
    country_iso3  CHAR(3),
    event_count   INTEGER     NOT NULL,
    users         INTEGER     NOT NULL,
    synced_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ga4_event_day_uk
        UNIQUE (data_date, event_name, page_path, country)
);

CREATE INDEX IF NOT EXISTS ga4_event_day_date_idx
    ON ga4_event_day (data_date);
CREATE INDEX IF NOT EXISTS ga4_event_day_name_date_idx
    ON ga4_event_day (event_name, data_date);


-- ---------------------------------------------------------------------------
-- 5. analytics_sync_log — did the pipeline run, and what did it find.
--
--    This exists so that "zero rows today" and "the cron did not fire" are
--    distinguishable. A feedback agent reading an empty table cannot tell those
--    apart, and would treat a dead pipeline as evidence that nothing ranks.
--    That is the single most expensive failure mode this pipeline has.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_sync_log (
    id            BIGSERIAL PRIMARY KEY,
    source        TEXT        NOT NULL,   -- 'gsc_site' | 'gsc_url' | 'ga4_page' | 'ga4_event'
    run_started   TIMESTAMPTZ NOT NULL,
    run_finished  TIMESTAMPTZ,
    window_start  DATE,
    window_end    DATE,
    rows_fetched  INTEGER,
    rows_written  INTEGER,
    -- 'ok' | 'partial' | 'error'.  'partial' added Aug 31, 2026: a run that
    -- reached the API, got a valid but EMPTY answer, and therefore declined to
    -- overwrite what it already had. It is neither a success nor a failure, and
    -- collapsing it into either one is how the gbp_keywords destructive-write
    -- bug stayed invisible -- it recorded 'ok' every night while deleting data.
    status        TEXT        NOT NULL,
    detail        TEXT
);

CREATE INDEX IF NOT EXISTS analytics_sync_log_source_started_idx
    ON analytics_sync_log (source, run_started DESC);


-- ============================================================================
-- 7. Self-traffic exclusion. Added August 30, 2026.
--
--    WHY: on the first six weeks of GA4 data, AT LEAST 25% of sessions were
--    Iván's own -- 54 from the laptop that receives Hermes's Telegram links,
--    plus 11 from machines running the Eleventy dev server. `plan_views_clean`
--    has filtered bots and his own IP out of the pixel data since July; the GA4
--    tables shipped with no equivalent, and the monthly close was about to read
--    them.
--
--    WHY NOT JUST GA4'S OWN FILTER: an Active exclude filter does reach
--    BigQuery (Google: excluded data "is never processed and will never be
--    available in Google Analytics or BigQuery") -- but filters are NEVER
--    retroactive, and July 21 -> today is currently *all* the GA4 data there
--    is. No console setting can clean the history. This can.
--
--    WHY RULES AND NOT A LIST OF DEVICE IDs: `user_pseudo_id` is a cookie. It
--    changes on clearing cookies, a new browser, a private window. A hand-kept
--    list is stale the moment it is written. The rules below re-derive the list
--    from evidence on every run.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_internal_devices (
    user_pseudo_id  TEXT        PRIMARY KEY,
    reason          TEXT        NOT NULL,   -- 'telegram' | 'localhost' | 'traffic_type' | 'manual'
    first_seen      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- is_internal joins the grain of all three GA4 tables, and therefore their
-- unique keys: two rows that differ only by is_internal are different rows.
ALTER TABLE ga4_page_day    ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ga4_event_day   ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ga4_traffic_day ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT FALSE;

-- Constraint swap, guarded so the whole file stays re-runnable.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ga4_page_day_uk') THEN
        ALTER TABLE ga4_page_day DROP CONSTRAINT ga4_page_day_uk;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ga4_page_day_uk2') THEN
        ALTER TABLE ga4_page_day ADD CONSTRAINT ga4_page_day_uk2
            UNIQUE (data_date, page_path, country, device_category, is_internal);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ga4_event_day_uk') THEN
        ALTER TABLE ga4_event_day DROP CONSTRAINT ga4_event_day_uk;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ga4_event_day_uk2') THEN
        ALTER TABLE ga4_event_day ADD CONSTRAINT ga4_event_day_uk2
            UNIQUE (data_date, event_name, page_path, country, is_internal);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ga4_traffic_day_uk') THEN
        ALTER TABLE ga4_traffic_day DROP CONSTRAINT ga4_traffic_day_uk;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ga4_traffic_day_uk2') THEN
        ALTER TABLE ga4_traffic_day ADD CONSTRAINT ga4_traffic_day_uk2
            UNIQUE (data_date, landing_page, source, medium, campaign, country, is_internal);
    END IF;
END $$;


-- ============================================================================
-- Views. Average position is computed HERE and nowhere else.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- gsc_near_miss — the highest-value signal in this whole pipeline.
--
-- Queries where the site already ranks 5-20 with real impressions: demand
-- Google has confirmed, on topics already almost competitive. Country is kept
-- in the grain, not aggregated away — "position 7 in Argentina" and "position 7
-- in Spain" are different commercial facts and only one of them is monetisable
-- through some marketplaces.
--
-- Rolling 28 days. Thresholds are deliberately low because the site is small;
-- raise `impressions >= 10` once there is enough volume for it to bite.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW gsc_near_miss AS
SELECT
    query,
    country,
    SUM(impressions)                                        AS impressions,
    SUM(clicks)                                             AS clicks,
    SUM(sum_top_position) / NULLIF(SUM(impressions), 0) + 1 AS avg_position,
    MIN(data_date)                                          AS first_seen,
    MAX(data_date)                                          AS last_seen,
    -- Not a filter, on purpose. Added Aug 30, 2026 after the first real run
    -- returned an LLM prompt as a "query": 30 words, position 6.2, South Africa.
    -- Someone typed a chatbot prompt into Google. A research agent reading this
    -- view is being told "write a better article about the thing you rank 5-20
    -- for" -- hand it a 30-word prompt and it treats that as a topic. One
    -- artifact in a five-row sample is a high enough rate to guard against.
    -- The consumer filters (a topic is ~1-6 words); the view stays complete,
    -- because a threshold that silently drops rows is how a signal becomes a
    -- guess about what the data used to contain.
    ARRAY_LENGTH(STRING_TO_ARRAY(TRIM(query), ' '), 1)       AS word_count
FROM gsc_site_query
WHERE data_date >= CURRENT_DATE - INTERVAL '28 days'
  AND search_type = 'web'
GROUP BY query, country
HAVING SUM(impressions) >= 10
   AND SUM(sum_top_position) / NULLIF(SUM(impressions), 0) + 1 BETWEEN 5 AND 20;


-- ---------------------------------------------------------------------------
-- gsc_near_miss_pages — the same signal, attributed to the page that earns it.
-- This is the one the research agent should read: it says "this article is on
-- page two for this query", which is an instruction, not a statistic.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW gsc_near_miss_pages AS
SELECT
    url,
    query,
    country,
    SUM(impressions)                                    AS impressions,
    SUM(clicks)                                         AS clicks,
    SUM(sum_position) / NULLIF(SUM(impressions), 0) + 1 AS avg_position,
    ARRAY_LENGTH(STRING_TO_ARRAY(TRIM(query), ' '), 1)   AS word_count
FROM gsc_url_query
WHERE data_date >= CURRENT_DATE - INTERVAL '28 days'
  AND search_type = 'web'
GROUP BY url, query, country
HAVING SUM(impressions) >= 5
   AND SUM(sum_position) / NULLIF(SUM(impressions), 0) + 1 BETWEEN 5 AND 20;


-- ---------------------------------------------------------------------------
-- gsc_page_performance — per-URL rollup, 28 days. Article-level scoreboard.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW gsc_page_performance AS
SELECT
    url,
    SUM(impressions)                                    AS impressions,
    SUM(clicks)                                         AS clicks,
    SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)  AS ctr,
    SUM(sum_position) / NULLIF(SUM(impressions), 0) + 1 AS avg_position,
    COUNT(DISTINCT query)                               AS distinct_queries
FROM gsc_url_query
WHERE data_date >= CURRENT_DATE - INTERVAL '28 days'
  AND search_type = 'web'
GROUP BY url;


-- ---------------------------------------------------------------------------
-- analytics_geo_28d — where the readers actually are, both sources side by side.
--
-- Built for the affiliate question: which marketplace can be monetised at all
-- depends on whether readers are in AR, CO, BR, MX, ES or US. GSC impressions
-- say where the demand is; GA4 sessions say who arrived. FULL OUTER JOIN
-- because a country can appear in one and not the other, and dropping it would
-- quietly answer the affiliate question wrong.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW analytics_geo_28d AS
WITH gsc AS (
    SELECT country AS iso3,
           SUM(impressions) AS gsc_impressions,
           SUM(clicks)      AS gsc_clicks
    FROM gsc_site_query
    WHERE data_date >= CURRENT_DATE - INTERVAL '28 days'
    GROUP BY country
), ga4 AS (
    SELECT country_iso3 AS iso3,
           MIN(country)     AS ga4_country_name,
           SUM(sessions)    AS ga4_sessions,
           SUM(total_users) AS ga4_users
    FROM ga4_page_day
    WHERE data_date >= CURRENT_DATE - INTERVAL '28 days'
      AND country_iso3 IS NOT NULL
      AND NOT is_internal          -- added Aug 30, 2026; see section 7
    GROUP BY country_iso3
)
SELECT
    COALESCE(gsc.iso3, ga4.iso3)     AS iso3,
    ga4.ga4_country_name,
    COALESCE(gsc.gsc_impressions, 0) AS gsc_impressions,
    COALESCE(gsc.gsc_clicks, 0)      AS gsc_clicks,
    COALESCE(ga4.ga4_sessions, 0)    AS ga4_sessions,
    COALESCE(ga4.ga4_users, 0)       AS ga4_users
FROM gsc
FULL OUTER JOIN ga4 ON gsc.iso3 = ga4.iso3;


-- ---------------------------------------------------------------------------
-- analytics_pipeline_health — one row per source, last run and its outcome.
-- Read this before believing a zero.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW analytics_pipeline_health AS
SELECT DISTINCT ON (source)
    source, run_started, run_finished, window_start, window_end,
    rows_fetched, rows_written, status, detail
FROM analytics_sync_log
ORDER BY source, run_started DESC;


-- ============================================================================
-- 6. ga4_traffic_day — attribution. Added August 30, 2026.
--
--    SESSION grain, in its own table on purpose. Channel is a property of a
--    SESSION; page views are a property of a PAGE. Putting them in one table
--    multiplies a session across every page in the visit and silently inflates
--    session counts -- the classic GA4 double-count. Two grains, two tables.
--
--    Source is `session_traffic_source_last_click.manual_campaign`, verified by
--    probe (Aug 30, 2026) to be populated on 100% of events. The two obvious
--    alternatives are both wrong here and the probe is what showed it:
--      * `traffic_source`          -- USER-level FIRST-touch. A user who once
--        arrived direct reads as (direct) forever, in every later session.
--      * `collected_traffic_source` -- populated only on session_start and
--        first_visit (63 of 526 page_views), NULL on the rest.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ga4_traffic_day (
    data_date         DATE        NOT NULL,
    landing_page      TEXT        NOT NULL,   -- first page_view of the session
    source            TEXT        NOT NULL,   -- lowercased; otherwise verbatim
    medium            TEXT        NOT NULL,
    campaign          TEXT        NOT NULL,
    country           TEXT        NOT NULL,
    country_iso3      CHAR(3),
    sessions          INTEGER     NOT NULL,
    total_users       INTEGER     NOT NULL,
    engaged_sessions  INTEGER     NOT NULL,
    synced_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ga4_traffic_day_uk
        UNIQUE (data_date, landing_page, source, medium, campaign, country)
);

CREATE INDEX IF NOT EXISTS ga4_traffic_day_date_idx
    ON ga4_traffic_day (data_date);
CREATE INDEX IF NOT EXISTS ga4_traffic_day_medium_date_idx
    ON ga4_traffic_day (medium, data_date);
CREATE INDEX IF NOT EXISTS ga4_traffic_day_landing_date_idx
    ON ga4_traffic_day (landing_page, data_date);


-- ---------------------------------------------------------------------------
-- ga4_channel_day — channel grouping, derived HERE and not in the sync.
--
-- WHY NOT GA4'S DEFAULT CHANNEL GROUPING: it keys off recognised mediums
-- (organic, cpc, referral, email). This site's UTM convention -- set July 31,
-- 2026, see the UTM note in this section -- uses utm_medium for PLACEMENT:
-- gbp_profile, gbp_post, bio, lnk_bio, plan_listing, signature, directory.
-- Google's grouping would dump nearly every deliberately-tagged link into
-- "Unassigned". So the rule below encodes THIS site's convention.
--
-- It lives in a view, not in the sync, so changing the rule is a re-CREATE and
-- never a re-sync -- the same reason average position is derived in a view.
--
-- Unrecognised mediums resolve to 'Other: <medium>' and NEVER to a silent
-- catch-all: an unmapped value has to name itself, or the bucket grows and
-- nobody sees what is in it. Same principle as country_map.py.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW ga4_channel_day AS
SELECT
    data_date,
    landing_page,
    country_iso3,
    source,
    medium,
    campaign,
    CASE
        WHEN source = '(direct)' AND medium IN ('(none)', '(not set)') THEN 'Direct'
        WHEN medium = 'organic'                       THEN 'Organic Search'
        WHEN medium IN ('cpc', 'ppc', 'paid')         THEN 'Paid Search'
        WHEN medium IN ('gbp_profile', 'gbp_post')    THEN 'Google Business Profile'
        WHEN medium IN ('bio', 'lnk_bio')             THEN 'Profile / Bio Link'
        WHEN medium = 'plan_listing'                  THEN 'TrainingPeaks Listing'
        WHEN medium = 'signature'                     THEN 'Email Signature'
        WHEN medium = 'directory'                     THEN 'Directory'
        WHEN medium IN ('email', 'newsletter')        THEN 'Email'
        WHEN medium = 'referral' AND (
                 source LIKE '%facebook%' OR source LIKE '%instagram%'
              OR source LIKE '%linkedin%' OR source LIKE '%t.co%'
              OR source LIKE '%x.com%'    OR source LIKE '%telegram%'
              OR source LIKE '%reddit%'   OR source LIKE '%youtube%'
              OR source LIKE '%strava%')                THEN 'Social'
        WHEN medium = 'referral'                      THEN 'Referral'
        ELSE 'Other: ' || medium
    END AS channel_group,
    -- Platform, for the aliasing problem the first probe surfaced: the same
    -- traffic arrives as `trainingpeaks` (a tagged link) and `trainingpeaks.com`
    -- (an untagged referral), and `Instagram` was capitalised where everything
    -- else was lowercase. Case is normalised in the sync; the alias collapse is
    -- HERE, so `source` in the table stays exactly what GA4 reported -- a tagged
    -- link and a raw referral are genuinely different events and the raw value
    -- is the only place that distinction survives.
    CASE
        WHEN source LIKE '%trainingpeaks%' THEN 'trainingpeaks'
        WHEN source LIKE '%instagram%'     THEN 'instagram'
        WHEN source LIKE '%facebook%'      THEN 'facebook'
        WHEN source LIKE '%linkedin%'      THEN 'linkedin'
        WHEN source IN ('x.com', 't.co', 'twitter.com', 'twitter') THEN 'x'
        WHEN source LIKE '%google%'        THEN 'google'
        WHEN source LIKE '%telegram%'      THEN 'telegram'
        WHEN source LIKE '%whatsapp%' OR source LIKE '%wa.me%' THEN 'whatsapp'
        ELSE source
    END AS platform,
    sessions,
    total_users,
    engaged_sessions
FROM ga4_traffic_day
WHERE NOT is_internal;   -- reporting view: self-traffic excluded (see section 7)


-- ---------------------------------------------------------------------------
-- The _clean views. Same pattern as plan_views / plan_views_clean: the raw
-- tables keep everything for audit, and the views are what anything reporting
-- should read. Nothing is deleted -- an exclusion you cannot inspect is an
-- exclusion you cannot debug.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW ga4_page_clean    AS SELECT * FROM ga4_page_day    WHERE NOT is_internal;
CREATE OR REPLACE VIEW ga4_event_clean   AS SELECT * FROM ga4_event_day   WHERE NOT is_internal;
CREATE OR REPLACE VIEW ga4_traffic_clean AS SELECT * FROM ga4_traffic_day WHERE NOT is_internal;


-- ---------------------------------------------------------------------------
-- ga4_selftraffic_month — how much of each month was us. Added Aug 31, 2026.
--
-- The _clean views above remove self-traffic; this one MEASURES it, which is a
-- different job and the one the monthly close needs. Two reasons it exists:
--
--   1. The exclusion is only as good as the detection, and the detection is
--      four narrow rules over a cookie. A month where the excluded share
--      suddenly drops is far more likely to mean the rules stopped catching
--      Iván than that he stopped browsing his own site.
--   2. `monthly-close-runbook.md` section 2.4 requires a "what we still can't
--      see" section. This is that section's evidence for every GA4 row: the
--      close states the excluded share alongside the clean number, rather than
--      quoting a clean number as if it were exact.
--
-- Sessions come from ga4_traffic_day, never ga4_page_day: one session has one
-- landing page, so summing there is a session count, while summing page rows
-- counts the same session once per page it touched.
--
-- Read `external_sessions` as the reportable figure and `internal_pct` as the
-- confidence attached to it. On the first six weeks of data internal_pct was
-- 25% before Iván confirmed two more devices by hand, and 46% after.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW ga4_selftraffic_month AS
SELECT
    date_trunc('month', data_date)::date               AS month,
    SUM(sessions) FILTER (WHERE NOT is_internal)       AS external_sessions,
    SUM(sessions) FILTER (WHERE is_internal)           AS internal_sessions,
    SUM(sessions)                                      AS total_sessions,
    ROUND(100.0 * COALESCE(SUM(sessions) FILTER (WHERE is_internal), 0)
                / NULLIF(SUM(sessions), 0), 1)         AS internal_pct
FROM ga4_traffic_day
GROUP BY 1
ORDER BY 1;

-- ============================================================================
-- 8. Google Business Profile. Added August 30, 2026.
--
--    Credential is an OAuth refresh token for coach@triaperformance.com, NOT a
--    service account: the Business Profile API supports OAuth 2.0 only. Lives
--    in the same ~/.analytics/.env as everything else (GBP_CLIENT_ID,
--    GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN).
-- ---------------------------------------------------------------------------

-- Long format -- one row per date per metric -- because that is the shape the
-- API returns, and because the metric list grows: BUSINESS_BOOKINGS and the
-- food-ordering metrics exist and are irrelevant today. A wide table would need
-- a migration every time Google adds one.
CREATE TABLE IF NOT EXISTS gbp_daily_metrics (
    location_id  TEXT        NOT NULL,
    data_date    DATE        NOT NULL,
    metric       TEXT        NOT NULL,
    value        INTEGER     NOT NULL,
    synced_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT gbp_daily_metrics_uk UNIQUE (location_id, data_date, metric)
);
CREATE INDEX IF NOT EXISTS gbp_daily_metrics_date_idx ON gbp_daily_metrics (data_date);
CREATE INDEX IF NOT EXISTS gbp_daily_metrics_metric_date_idx ON gbp_daily_metrics (metric, data_date);

-- Reviews. Keyed on Google's own review_id: a review can be EDITED by its
-- author, so this upserts on that key rather than treating reviews as immutable.
-- reviewer_display_name is public on the Google Maps listing; it is stored here
-- and must not be copied into the repo, same rule as the sales CSVs.
CREATE TABLE IF NOT EXISTS gbp_reviews (
    review_id             TEXT        PRIMARY KEY,
    location_id           TEXT        NOT NULL,
    create_time           TIMESTAMPTZ NOT NULL,
    update_time           TIMESTAMPTZ,
    star_rating           INTEGER,
    comment               TEXT,
    reviewer_display_name TEXT,
    has_reply             BOOLEAN     NOT NULL DEFAULT FALSE,
    reply_time            TIMESTAMPTZ,
    synced_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gbp_reviews_create_idx ON gbp_reviews (create_time DESC);

-- Search keywords. `value` and `below_threshold` are mutually exclusive and
-- BOTH are nullable ON PURPOSE.
--
-- Google returns either an exact `value` or a `threshold`, the latter meaning
-- "fewer than this". On the first real pull (Aug 30, 2026) the only keyword
-- returned was the brand name, with threshold 15 and no value at all. Coercing
-- a threshold into a value would invent a number that Google explicitly
-- declined to give -- and it would then be averaged, summed and reported as if
-- it were measured. A NULL is visible; a fabricated 15 is not.
CREATE TABLE IF NOT EXISTS gbp_search_keywords (
    location_id      TEXT        NOT NULL,
    month            DATE        NOT NULL,   -- first day of the month
    keyword          TEXT        NOT NULL,
    value            INTEGER,                -- exact count, when Google gives one
    below_threshold  INTEGER,                -- "fewer than N", when it does not
    synced_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT gbp_search_keywords_uk UNIQUE (location_id, month, keyword),
    CONSTRAINT gbp_search_keywords_one_of CHECK (
        (value IS NOT NULL AND below_threshold IS NULL)
        OR (value IS NULL AND below_threshold IS NOT NULL)
    )
);
CREATE INDEX IF NOT EXISTS gbp_search_keywords_month_idx ON gbp_search_keywords (month);


-- ---------------------------------------------------------------------------
-- gbp_monthly — the shape the monthly close actually wants: views, searches,
-- actions, new reviews, one row per month.
--
-- "Views" is the sum of the four impression metrics; "actions" the sum of the
-- four intent metrics. Those groupings are a JUDGEMENT and they live here, in a
-- view, so the close can be re-read against a different grouping without a
-- re-sync.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW gbp_monthly AS
WITH m AS (
    SELECT DATE_TRUNC('month', data_date)::date AS month,
           SUM(value) FILTER (WHERE metric LIKE 'BUSINESS_IMPRESSIONS%')      AS views,
           SUM(value) FILTER (WHERE metric LIKE '%_SEARCH')                   AS views_search,
           SUM(value) FILTER (WHERE metric LIKE '%_MAPS')                     AS views_maps,
           SUM(value) FILTER (WHERE metric IN ('WEBSITE_CLICKS','CALL_CLICKS',
                              'BUSINESS_DIRECTION_REQUESTS','BUSINESS_CONVERSATIONS')) AS actions,
           SUM(value) FILTER (WHERE metric = 'WEBSITE_CLICKS')                AS website_clicks,
           SUM(value) FILTER (WHERE metric = 'CALL_CLICKS')                   AS call_clicks,
           SUM(value) FILTER (WHERE metric = 'BUSINESS_DIRECTION_REQUESTS')   AS direction_requests,
           SUM(value) FILTER (WHERE metric = 'BUSINESS_CONVERSATIONS')        AS conversations
    FROM gbp_daily_metrics GROUP BY 1
), r AS (
    SELECT DATE_TRUNC('month', create_time)::date AS month,
           COUNT(*) AS new_reviews,
           ROUND(AVG(star_rating)::numeric, 2) AS avg_new_rating
    FROM gbp_reviews GROUP BY 1
)
SELECT COALESCE(m.month, r.month) AS month,
       m.views, m.views_search, m.views_maps, m.actions,
       m.website_clicks, m.call_clicks, m.direction_requests, m.conversations,
       COALESCE(r.new_reviews, 0) AS new_reviews, r.avg_new_rating
FROM m FULL OUTER JOIN r ON m.month = r.month
ORDER BY 1 DESC;

-- ---------------------------------------------------------------------------
-- gbp_posts_sent — what has been published to Google Business Profile.
-- Added August 30, 2026.
--
-- THIS IS A LEDGER, NOT A QUEUE, and that distinction is the design.
--
-- `content_pieces` in the `content` database already knows what articles exist
-- and which are published. A second table listing "what to post next" would be
-- a competing list, and this repo's standing rule is one home per list —
-- competing lists drift, and the drift shows up as a post that goes out twice
-- or an article that never goes out at all.
--
-- So the queue is DERIVED: published ES pieces, minus the piece_ids in here,
-- oldest first. Nothing to maintain, nothing to fall out of sync.
--
-- A row is written only AFTER Google returns a localPost name. A failed post
-- leaves no row and is simply retried on the next run.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gbp_posts_sent (
    piece_id        INTEGER     PRIMARY KEY,   -- content.content_pieces.id
    language        TEXT        NOT NULL,
    local_post_name TEXT        NOT NULL,      -- Google's own id for the post
    published_url   TEXT        NOT NULL,
    posted_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gbp_posts_sent ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS gbp_posts_sent_posted_idx ON gbp_posts_sent (posted_at DESC);
