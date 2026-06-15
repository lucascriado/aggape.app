BEGIN;

-- Preserva os registros originais e mantém somente:
-- 80 membros gerados + 18 originais = 98 membros
-- 24 visitantes gerados + 12 originais = 36 visitantes

DELETE FROM members m
USING people p
WHERE p.id = m.person_id
  AND p.email ~ '^pessoa[0-9]{3}@sibmirassol\.local$'
  AND substring(p.email FROM 'pessoa([0-9]{3})')::int > 80;

DELETE FROM visitors v
USING people p
WHERE p.id = v.person_id
  AND p.email ~ '^pessoa[0-9]{3}@sibmirassol\.local$'
  AND substring(p.email FROM 'pessoa([0-9]{3})')::int NOT BETWEEN 321 AND 344;

DELETE FROM people p
WHERE p.email ~ '^pessoa[0-9]{3}@sibmirassol\.local$'
  AND NOT EXISTS (SELECT 1 FROM members m WHERE m.person_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM visitors v WHERE v.person_id = p.id);

COMMIT;
