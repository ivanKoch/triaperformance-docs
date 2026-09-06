-- Campaign click tracking + send accounting.  September 6, 2026.
--
-- Extends the pattern already proven by /w/: a redirect the operator owns,
-- logged server-side, so the number survives ad blockers, image blocking and
-- a checkout on somebody else's domain.  /w/ identifies the clicker by the
-- members cookie; a cold email recipient has no cookie, so identity here comes
-- from a per-recipient id minted with the send.
--
-- Run against the `members` database on analytics-postgres.

-- ---------------------------------------------------------------------------
-- unsubscribe_tokens becomes the send roster, explicitly rather than by
-- accident.  It already held one row per recipient per send; it now records
-- WHETHER THE MAIL WENT OUT and carries the click id.
--
-- `sent_at` exists because minted != sent: the send workflow skips anyone the
-- suppression list already covers, so counting minted rows overstates every
-- future send -- and overstates it exactly when suppression starts working.
-- ---------------------------------------------------------------------------
ALTER TABLE unsubscribe_tokens ADD COLUMN IF NOT EXISTS click_id text;
ALTER TABLE unsubscribe_tokens ADD COLUMN IF NOT EXISTS sent_at  timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS unsubscribe_tokens_click_id_key
    ON unsubscribe_tokens (click_id) WHERE click_id IS NOT NULL;

COMMENT ON COLUMN unsubscribe_tokens.click_id IS
  'Per-recipient id used ONLY in /c/ links. Deliberately not the unsubscribe '
  'token: a checkout link gets forwarded, and a forwarded unsubscribe token '
  'would let the recipient of the forward unsubscribe the sender.';
COMMENT ON COLUMN unsubscribe_tokens.sent_at IS
  'Set by the send workflow after SMTP accepts. NULL = minted but not sent.';

-- ---------------------------------------------------------------------------
-- One row per click on a /c/ link.  No FK to unsubscribe_tokens: a forwarded
-- or mangled link must still log rather than error, and an unknown click_id is
-- itself a finding (the link is being shared).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaign_link_clicks (
    id           BIGSERIAL PRIMARY KEY,
    occurred_at  timestamptz NOT NULL DEFAULT now(),
    code         text NOT NULL,          -- registry key, e.g. 'aa-pt-checkout'
    click_id     text,                   -- NULL = no id on the link, or forwarded
    destination  text NOT NULL,
    user_agent   text
);

CREATE INDEX IF NOT EXISTS campaign_link_clicks_code_idx     ON campaign_link_clicks (code, occurred_at DESC);
CREATE INDEX IF NOT EXISTS campaign_link_clicks_click_id_idx ON campaign_link_clicks (click_id) WHERE click_id IS NOT NULL;

COMMENT ON TABLE campaign_link_clicks IS
  'Server-side click log for email campaigns. No IP is stored: it would be the '
  'only personal datum here that the recipient did not hand over, and it buys '
  'nothing this list is asked to answer.';

-- ---------------------------------------------------------------------------
-- sequence_stats — the one query the admin page reads.
--
-- Every count is scoped to the campaign via unsubscribe_tokens.source, which
-- is why every send MUST pass a real --source.  A send tagged 'default' is
-- invisible here forever.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW sequence_stats AS
WITH roster AS (
    SELECT source,
           count(*)                                   AS minted,
           count(*) FILTER (WHERE sent_at IS NOT NULL) AS sent,
           min(sent_at)                               AS first_sent,
           max(sent_at)                               AS last_sent
    FROM unsubscribe_tokens
    WHERE source IS NOT NULL
    GROUP BY source
),
unsubs AS (
    SELECT source, count(*) AS unsubscribed
    FROM email_suppression
    WHERE source IS NOT NULL
    GROUP BY source
),
clicks AS (
    SELECT t.source,
           count(*)                          AS clicks,
           count(DISTINCT c.click_id)        AS clickers
    FROM campaign_link_clicks c
    JOIN unsubscribe_tokens t ON t.click_id = c.click_id
    GROUP BY t.source
)
SELECT r.source                       AS campaign,
       r.minted,
       r.sent,
       COALESCE(c.clicks, 0)          AS clicks,
       COALESCE(c.clickers, 0)        AS clickers,
       COALESCE(u.unsubscribed, 0)    AS unsubscribed,
       CASE WHEN r.sent > 0
            THEN round(100.0 * COALESCE(c.clickers, 0) / r.sent, 1) END AS click_pct,
       CASE WHEN r.sent > 0
            THEN round(100.0 * COALESCE(u.unsubscribed, 0) / r.sent, 1) END AS unsub_pct,
       r.first_sent,
       r.last_sent
FROM roster r
LEFT JOIN unsubs u ON u.source = r.source
LEFT JOIN clicks c ON c.source = r.source
ORDER BY r.last_sent DESC NULLS LAST, r.source;

-- NOTE the rates divide by `sent`, never by `minted`. Dividing an unsubscribe
-- count by a roster that includes people who were never mailed understates the
-- burn rate, which is the one number here that should never look better than
-- it is.
