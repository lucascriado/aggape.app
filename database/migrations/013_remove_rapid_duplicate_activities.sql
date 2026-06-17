BEGIN;

WITH repeated AS (
  SELECT
    id,
    occurred_at,
    lag(occurred_at) OVER (
      PARTITION BY category, actor, action, subject, coalesce(details, '')
      ORDER BY occurred_at DESC
    ) AS newer_occurred_at
  FROM activities
)
DELETE FROM activities
USING repeated
WHERE activities.id = repeated.id
  AND repeated.newer_occurred_at IS NOT NULL
  AND repeated.newer_occurred_at - repeated.occurred_at <= INTERVAL '5 minutes';

COMMIT;
