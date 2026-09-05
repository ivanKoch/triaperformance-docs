-- pixel-no-planid-diagnosis.sql
--
-- Diagnoses the open item: "36% of marketplace plan views (1,055 of 2,930)
-- carry no plan_id" (open-loops.md, opened by close #1, Sept 1 2026).
--
-- WHY THIS EXISTS: that item is currently classified as a *collection* gap —
-- "the plan_id is genuinely absent from the pixel payload" — and therefore as
-- not-free-to-fix. That classification was inferred, not measured. It has
-- never been segmented. The GA4 half of the same pairing was classified the
-- same way and turned out to be a reading bug with a two-NULLIF fix.
--
-- THE DISCRIMINATOR IS `price`. The pixel is a static
--     <img src="...run.app?plan_id=X&price=Y">
-- built in bulk from one spreadsheet formula, so plan_id and price are always
-- authored together and travel in the same query string. main.py reads them
-- independently: plan_id defaults to the literal 'not_set' when the param is
-- ABSENT (an empty param yields ''), and price is NULL unless it parses.
-- Therefore:
--
--   plan_id absent + price present  -> the query string arrived and only
--                                      plan_id went missing. Something rewrote
--                                      the URL. A real collection gap.
--   plan_id absent + price absent   -> the whole query string was absent. The
--                                      request hit the bare Cloud Run root.
--                                      Nothing that renders a TP plan page can
--                                      produce this. Not a plan view at all.
--
-- The second case is not a gap in the numerator, it is contamination of the
-- denominator, and the fix is a WHERE clause.
--
-- SECOND WITNESS: `referrer`. Per ai-infrastructure-documentation.md §9, a
-- genuine pixel hit's Referer is structurally ALWAYS the page containing the
-- pixel — a trainingpeaks.com URL. That is stated there as a hard limitation.
-- It is also, read the other way, a validity test: a hit with no Referer, or
-- a Referer that is not TrainingPeaks, was never on a plan page.
--
-- Run: bash, ON THE VPS. `analytics-postgres` is a container on the box;
-- there is nothing to run against on the laptop.
--
-- THE CLONE ON THE VPS IS AT ~/.hermes/triaperformance-docs — NOT
-- ~/triaperformance-docs, which does not exist there. See ai-infrastructure-
-- documentation.md §9, which records this same wrong path being caught on
-- Aug 29, 2026 and calls it the third instance. This header is the fourth.
--
--   cd ~/.hermes/triaperformance-docs && git pull
--   set -a; . ~/.analytics/.env; set +a
--   docker exec -i analytics-postgres psql -U "$PG_USER" -d "$PG_DB" \
--     -f - < automation/analytics/queries/pixel-no-planid-diagnosis.sql
--
-- The `git pull` is not optional: this file reaches the box only via that
-- clone's own 6am cron pull, so it does not exist there until it is pushed.
--
-- Read-only. No writes, no DDL.

\pset footer off
\timing off

\echo '=============================================================='
\echo 'A. Shape of the missing plan_id, and whether price survived it'
\echo '   (August 2026 — the month close #1 measured)'
\echo '=============================================================='
SELECT
  CASE
    WHEN plan_id IS NULL     THEN '1. NULL         (no value written at all)'
    WHEN plan_id = ''        THEN '2. empty string (param present, blank value)'
    WHEN plan_id = 'not_set' THEN '3. not_set      (param absent from the URL)'
    ELSE                          '4. real plan_id'
  END                                       AS plan_id_shape,
  COUNT(*)                                  AS rows,
  COUNT(price)                              AS with_price,
  ROUND(100.0 * COUNT(price) / COUNT(*), 1) AS pct_with_price,
  COUNT(DISTINCT ip_address)                AS distinct_ips,
  MIN(event_timestamp)::date                AS first_seen,
  MAX(event_timestamp)::date                AS last_seen
FROM plan_views_clean
WHERE event_timestamp >= DATE '2026-08-01'
  AND event_timestamp <  DATE '2026-09-01'
GROUP BY 1
ORDER BY 1;

\echo ''
\echo '=============================================================='
\echo 'B. Same shape over the whole history — is it background, or'
\echo '   did it start on a date? A step change points at a cause.'
\echo '=============================================================='
SELECT
  date_trunc('month', event_timestamp)::date AS month,
  COUNT(*) FILTER (WHERE plan_id IS NOT NULL
                     AND plan_id NOT IN ('not_set',''))  AS with_id,
  COUNT(*) FILTER (WHERE plan_id IS NULL
                      OR plan_id IN ('not_set',''))      AS no_id,
  ROUND(100.0 * COUNT(*) FILTER (WHERE plan_id IS NULL
                                    OR plan_id IN ('not_set',''))
              / NULLIF(COUNT(*), 0), 1)                  AS pct_no_id
FROM plan_views_clean
GROUP BY 1
ORDER BY 1;

\echo ''
\echo '=============================================================='
\echo 'C. Referrer, split by bucket. The validity test.'
\echo '   Expect has_id to be ~100% trainingpeaks.com. If no_id is'
\echo '   not, those requests were never on a plan page.'
\echo '=============================================================='
SELECT
  CASE WHEN plan_id IS NULL OR plan_id IN ('not_set','')
       THEN 'no_id' ELSE 'has_id' END              AS bucket,
  COALESCE(NULLIF(referrer, ''), '<empty>')        AS referrer,
  COUNT(*)                                         AS rows
FROM plan_views_clean
WHERE event_timestamp >= DATE '2026-08-01'
  AND event_timestamp <  DATE '2026-09-01'
GROUP BY 1, 2
ORDER BY 1, 3 DESC
LIMIT 40;

\echo ''
\echo '=============================================================='
\echo 'D. User agents on the no_id rows only. These survived the'
\echo '   bot filter in plan_views_clean, which matches on'
\echo '   bot/crawler/spider/headless and nothing else.'
\echo '=============================================================='
SELECT
  left(COALESCE(user_agent, '<null>'), 95) AS user_agent,
  COUNT(*)                                 AS rows,
  COUNT(DISTINCT ip_address)               AS ips
FROM plan_views_clean
WHERE event_timestamp >= DATE '2026-08-01'
  AND event_timestamp <  DATE '2026-09-01'
  AND (plan_id IS NULL OR plan_id IN ('not_set',''))
GROUP BY 1
ORDER BY 2 DESC
LIMIT 25;

\echo ''
\echo '=============================================================='
\echo 'E. IP concentration, both buckets. Humans browsing a'
\echo '   marketplace spread across many IPs at 1-2 hits each.'
\echo '   Scanners concentrate, or arrive once each from a range.'
\echo '=============================================================='
WITH b AS (
  SELECT
    CASE WHEN plan_id IS NULL OR plan_id IN ('not_set','')
         THEN 'no_id' ELSE 'has_id' END AS bucket,
    ip_address,
    COUNT(*) AS n
  FROM plan_views_clean
  WHERE event_timestamp >= DATE '2026-08-01'
    AND event_timestamp <  DATE '2026-09-01'
  GROUP BY 1, 2
)
SELECT
  bucket,
  COUNT(*)                                              AS distinct_ips,
  SUM(n)                                                AS rows,
  ROUND(AVG(n), 2)                                      AS avg_hits_per_ip,
  MAX(n)                                                AS max_hits_one_ip,
  ROUND(100.0 * SUM(n) FILTER (WHERE n = 1) / SUM(n), 1) AS pct_from_one_hit_ips
FROM b
GROUP BY 1
ORDER BY 1;

\echo ''
\echo '=============================================================='
\echo 'F. Hour of day. Real views follow a LatAm/Iberia diurnal'
\echo '   curve. Machine traffic is flat across the clock.'
\echo '=============================================================='
SELECT
  EXTRACT(hour FROM event_timestamp AT TIME ZONE 'UTC')::int AS hour_utc,
  COUNT(*) FILTER (WHERE plan_id IS NULL
                      OR plan_id IN ('not_set',''))          AS no_id,
  COUNT(*) FILTER (WHERE plan_id IS NOT NULL
                     AND plan_id NOT IN ('not_set',''))      AS has_id
FROM plan_views_clean
WHERE event_timestamp >= DATE '2026-08-01'
  AND event_timestamp <  DATE '2026-09-01'
GROUP BY 1
ORDER BY 1;

\echo ''
\echo '=============================================================='
\echo 'G. The definition of plan_views_clean itself.'
\echo '   It exists only on this box — it is not in the repo, which'
\echo '   is a standing violation of the ai-infrastructure-doc §18'
\echo '   rule. Every figure in close #1 was read through it.'
\echo '=============================================================='
SELECT pg_get_viewdef('plan_views_clean'::regclass, true) AS plan_views_clean_definition;

\echo ''
\echo '=============================================================='
\echo 'H. Dedupe hole. The UNIQUE key is'
\echo '   (event_timestamp, plan_id, ip_address). In Postgres NULL'
\echo '   never equals NULL, so if any plan_id is NULL, ON CONFLICT'
\echo '   DO NOTHING silently stops deduping those rows and repeat'
\echo '   syncs inflate them. Only a problem if A row 1 is non-zero.'
\echo '=============================================================='
SELECT
  COUNT(*)                                                 AS null_plan_id_rows,
  COUNT(*) - COUNT(DISTINCT (event_timestamp, ip_address)) AS apparent_duplicates
FROM plan_views
WHERE plan_id IS NULL;
