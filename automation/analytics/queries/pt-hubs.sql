-- THE THREE THIN PT HUBS. Shipped deliberately thin (few plans behind them) to
-- see whether a hub earns impressions on structure alone. This is the read.
-- Run it against the `analytics` database on analytics-postgres.
WITH hubs(url) AS (VALUES
  ('https://triaperformance.com/pt/planos/maratona/'),
  ('https://triaperformance.com/pt/planos/ciclismo/'),
  ('https://triaperformance.com/pt/planos/ironman/')
)
SELECT h.url,
       COALESCE(SUM(g.impressions),0)                        AS impressions,
       COALESCE(SUM(g.clicks),0)                             AS clicks,
       ROUND((SUM(g.sum_position)/NULLIF(SUM(g.impressions),0) + 1)::numeric, 1)
                                                             AS avg_position,
       COUNT(DISTINCT g.query)                               AS distinct_queries,
       MIN(g.data_date)                                      AS first_seen
FROM hubs h
LEFT JOIN gsc_url_query g ON g.url = h.url AND g.search_type='web'
GROUP BY h.url
ORDER BY impressions DESC;

-- And the same three against their Spanish equivalents, which is the only
-- comparison that makes the number mean anything:
SELECT url, SUM(impressions) AS impressions, SUM(clicks) AS clicks
FROM gsc_url_query
WHERE search_type='web'
  AND (url LIKE 'https://triaperformance.com/planes/%'
    OR url LIKE 'https://triaperformance.com/pt/planos/%')
GROUP BY url
ORDER BY impressions DESC
LIMIT 30;
