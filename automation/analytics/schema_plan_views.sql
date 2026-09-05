-- ============================================================================
-- plan_views_clean — the reporting view over the TrainingPeaks pixel data.
--
--   docker exec -i analytics-postgres psql -U <PG_USER> -d <PG_DB> \
--     < ~/.hermes/triaperformance-docs/automation/analytics/schema_plan_views.sql
--
-- Safe to re-run: CREATE OR REPLACE only. It never touches `plan_views`, which
-- stays raw for audit — an exclusion you cannot inspect is one you cannot debug.
--
-- WHY THIS FILE EXISTS AT ALL. Until September 5, 2026 this view lived only on
-- the box and was never in the repo. That is the §18 violation this project has
-- now logged five times, and it cost more here than usual: every plan-view
-- figure in monthly close #1 was read through a filter nobody could review, and
-- all four defects below survived inside it because reviewing it required
-- shell access to a container.
--
-- THE PREVIOUS DEFINITION, kept because the corrections are only legible
-- against it:
--
--     WHERE ip_address <> '181.62.20.182'
--       AND NOT (user_agent ~~ '%GoogleOther%' OR user_agent ~~ '%bot%'
--             OR user_agent ~~ '%crawler%'     OR user_agent ~~ '%spider%'
--             OR user_agent ~~ '%headless%');
--
-- ----------------------------------------------------------------------------
-- FOUR DEFECTS, in descending order of what they cost.
--
-- (1) IT HAD NO STRUCTURAL VALIDITY TEST. Every predicate asked the request to
--     identify itself — "does this user agent admit to being a bot?" — and the
--     answer was reported as validity. On 2026-08-31 a single IP
--     (195.133.93.61) sent 1,008 requests inside a few minutes behind a spoofed
--     desktop-Chrome user agent, and all 1,008 were counted as plan views.
--     security-posture.md F8 predicted this in writing: "filters bots by
--     user-agent, which an abuser would not cooperate with."
--
--     A request carrying no plan_id cannot be a plan view. The pixel is a
--     static <img src="...?plan_id=X&price=Y"> generated from one spreadsheet
--     formula, so plan_id and price are authored together and arrive together;
--     a request with neither hit the bare Cloud Run root and was never on a
--     listing. Confirmed, not assumed: of the 1,055 such rows in August 2026,
--     ZERO carried a price and ZERO carried a trainingpeaks.com referrer,
--     against 99.0% and ~71% for rows with a real plan_id.
--
--     Cost: August 2026 read 2,930 plan views instead of ≤1,875 — 56% high —
--     in a close taken the day after the flood. Two earlier incidents did the
--     same to 2025-11 (40.7%) and 2026-03 (24.9%). Every other month in the
--     series sits between 0.2% and 2.8%, so this is three events, not drift.
--
-- (2) TWO OF THE THREE PERSONAL IPs WERE NEVER EXCLUDED. `open-loops.md` #2
--     states: "Fixed along the way: plan_views_clean on the VPS now excludes
--     all 3 personal IPs, matching BigQuery." The live view excluded one. The
--     correct list has been sitting in es-pt-listing-rewrites-2026-07.md's
--     measurement query the whole time. Iván's own traffic from
--     190.193.3.211 and 181.86.140.211 has counted as marketplace demand.
--
--     Same shape as the August 12 auth-service entry in §18 — the record said
--     "fixed" while the runtime disagreed — and the same reason: nothing could
--     diff the claim against the runtime, because the runtime was not in the
--     repo. Which is defect (0), and this file is its fix.
--
-- (3) LIKE IS CASE-SENSITIVE. `~~` is LIKE, not ILIKE. `%bot%` matches
--     `Googlebot` and `bingbot` and misses `AhrefsBot`, `SemrushBot`,
--     `PetalBot`, `YandexBot`, `DotBot` — the capitalised convention is at
--     least as common as the lowercase one. Now matched case-insensitively.
--
-- (4) NULL ROWS WERE DROPPED, AND NOT AS BOTS. `NULL <> '181.62.20.182'` is
--     NULL, and `NOT (NULL LIKE '%bot%')` is NULL, and WHERE discards both. So
--     any row with a NULL ip_address or user_agent vanished from the "clean"
--     view for a reason unrelated to whether it was a bot — silently, and in
--     the direction that makes the data look tidier. Now COALESCE'd: a missing
--     user agent is judged as an empty string and kept.
--
-- ----------------------------------------------------------------------------
-- ONE DELIBERATE NON-CHANGE: NO RATE OR BURST THRESHOLD.
--
-- The plan_id predicate closes the hole that was actually exploited. It does
-- not close the class: an abuser who sends a well-formed
-- ?plan_id=443888&price=49.99 poisons one plan's numbers, and nothing in this
-- view would see it.
--
-- The obvious guard is "drop any IP-day above N hits", and N is exactly the
-- problem. It would be picked from one observed incident and from a legitimate
-- distribution nobody has looked at — and a carrier CGNAT or an office NAT can
-- put dozens of real athletes behind one address. A wrong N deletes real demand
-- and leaves no trace that it did.
--
-- So the shape is made VISIBLE instead (plan_views_ip_days, below) and the
-- cutoff gets set when there is a distribution to set it from. This is the same
-- call `open-loops.md` already made for the Gemini token alarm — "do not build
-- it before the trigger; a threshold picked today would be picked from three
-- weeks of logs read by hand" — and the same principle as analytics_sync_log:
-- make the failure distinguishable rather than guess a boundary.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- plan_views_clean — what every report reads.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW plan_views_clean AS
SELECT
    id,
    event_timestamp,
    plan_id,
    price,
    ip_address,
    user_agent,
    referrer,
    synced_at
FROM plan_views
WHERE
    -- (1) Structural. A plan view names a plan; see the header.
    --     'not_set' is main.py's default when the param is absent entirely;
    --     '' is what a present-but-blank param yields. Both are non-views.
    plan_id IS NOT NULL
    AND plan_id NOT IN ('not_set', '')

    -- (2) Iván's own three IPs. Source of truth for this list:
    --     es-pt-listing-rewrites-2026-07.md, measurement section.
    AND COALESCE(ip_address, '') NOT IN (
        '181.62.20.182',
        '190.193.3.211',
        '181.86.140.211'
    )

    -- (3)+(4) Self-declared bots — case-insensitive, and NULL-safe so a
    --     missing user agent is kept rather than silently discarded.
    AND COALESCE(user_agent, '') !~* '(GoogleOther|bot|crawler|spider|headless)';


-- ---------------------------------------------------------------------------
-- plan_views_ip_days — a DETECTOR, not a filter. Nothing reads it
-- automatically; it exists so the next flood is visible on the day it happens
-- rather than four days after a monthly close quotes it.
--
-- Reads the RAW table on purpose. A row excluded by plan_views_clean is
-- precisely the row this view is for.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW plan_views_ip_days AS
SELECT
    date_trunc('day', event_timestamp)::date AS day,
    ip_address,
    COUNT(*)                                 AS hits,
    COUNT(*) FILTER (
        WHERE plan_id IS NULL OR plan_id IN ('not_set', '')
    )                                        AS hits_no_plan_id,
    COUNT(DISTINCT plan_id)                  AS distinct_plans,
    MIN(event_timestamp)                     AS first_hit,
    MAX(event_timestamp)                     AS last_hit,
    left(MAX(user_agent), 80)                AS sample_user_agent
FROM plan_views
GROUP BY 1, 2;

COMMENT ON VIEW plan_views_clean IS
    'Reporting view over the TP pixel. Requires a real plan_id (structural), '
    'excludes 3 personal IPs and self-declared bots. See '
    'automation/analytics/schema_plan_views.sql for why each predicate exists.';

COMMENT ON VIEW plan_views_ip_days IS
    'Detector for pixel flooding. Raw table on purpose. No threshold is applied '
    'anywhere - see the header of schema_plan_views.sql.';
