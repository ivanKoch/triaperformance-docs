-- WHAT PORTUGUESE ACTUALLY SEARCHES FOR, on the two hubs that get impressions.
-- The point of this query is the vocabulary, not the volume: /pt/planos/ciclismo/
-- is built, in the sitemap, and internally linked from 96 pages exactly like the
-- other two, so its zero is not a technical fault. The remaining explanations are
-- demand or wording, and the queries the OTHER two match tell you which words
-- Google is willing to show these pages for.
SELECT url,
       query,
       SUM(impressions) AS impressions,
       SUM(clicks)      AS clicks,
       ROUND((SUM(sum_position)/NULLIF(SUM(impressions),0) + 1)::numeric, 1) AS avg_position
FROM gsc_url_query
WHERE search_type = 'web'
  AND url LIKE 'https://triaperformance.com/pt/%'
GROUP BY url, query
ORDER BY impressions DESC
LIMIT 40;

-- And every Portuguese query the SITE has ever matched, hub or not — the honest
-- demand picture for the language, independent of which page answered it.
SELECT query,
       SUM(impressions) AS impressions,
       SUM(clicks)      AS clicks,
       COUNT(DISTINCT url) AS pages
FROM gsc_url_query
WHERE search_type = 'web' AND country = 'BRA'
GROUP BY query
ORDER BY impressions DESC
LIMIT 40;
