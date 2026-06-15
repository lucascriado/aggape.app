BEGIN;

-- Completa os 30 registros iniciais com mais 470 pessoas únicas.
-- Resultado após todas as migrations: 500 pessoas, 338 membros e 162 visitantes.
WITH generated_people AS (
  SELECT
    sequence,
    format(
      '%s %s %s',
      (ARRAY['Ana', 'Bruno', 'Camila', 'Daniel', 'Elisa', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olivia', 'Pedro', 'Renata', 'Samuel', 'Tainá', 'Vitor'])[((sequence - 1) % 20) + 1],
      (ARRAY['Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Ferreira', 'Gomes', 'Lima', 'Martins', 'Nunes'])[((sequence - 1) % 10) + 1],
      lpad(sequence::text, 3, '0')
    ) AS full_name,
    format('pessoa%s@sibmirassol.local', lpad(sequence::text, 3, '0')) AS email
  FROM generate_series(1, 470) AS sequence
)
INSERT INTO people (
  full_name,
  email,
  phone,
  birth_date,
  city,
  state
)
SELECT
  full_name,
  email,
  format('(17) 9%s-%s', lpad((1000 + (sequence % 8000))::text, 4, '0'), lpad((1000 + ((sequence * 7) % 8000))::text, 4, '0')),
  DATE '1955-01-01' + ((sequence * 53) % 18000),
  'Mirassol',
  'São Paulo'
FROM generated_people
ON CONFLICT ((lower(email))) DO UPDATE SET full_name = EXCLUDED.full_name;

WITH generated_members AS (
  SELECT
    sequence,
    format('pessoa%s@sibmirassol.local', lpad(sequence::text, 3, '0')) AS email,
    (ARRAY['Louvor'::text, 'Missões', 'Acolhimento', 'Infantil', NULL])[(sequence % 5) + 1] AS ministry,
    (ARRAY['Célula Esperança', 'Célula Graça', 'Célula Família', 'Célula Jovens', 'Sem célula'])[(sequence % 5) + 1] AS cell_name
  FROM generate_series(1, 320) AS sequence
)
INSERT INTO members (
  person_id,
  ministry_id,
  cell_name,
  role,
  status,
  baptism_status,
  baptism_date,
  admission_date,
  is_new
)
SELECT
  p.id,
  mi.id,
  generated_members.cell_name,
  CASE WHEN sequence % 18 = 0 THEN 'Líder' ELSE 'Membro Comum' END,
  CASE WHEN sequence % 11 = 0 THEN 'inactive' ELSE 'active' END,
  CASE WHEN sequence % 4 = 0 THEN 'waiting' ELSE 'baptized' END,
  CASE WHEN sequence % 4 = 0 THEN NULL ELSE DATE '2005-01-01' + ((sequence * 29) % 6500) END,
  DATE '2010-01-01' + ((sequence * 31) % 5200),
  sequence > 290
FROM generated_members
JOIN people p ON lower(p.email) = lower(generated_members.email)
LEFT JOIN ministries mi ON mi.name = generated_members.ministry
ON CONFLICT (person_id) DO UPDATE SET
  ministry_id = EXCLUDED.ministry_id,
  cell_name = EXCLUDED.cell_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  baptism_status = EXCLUDED.baptism_status,
  baptism_date = EXCLUDED.baptism_date,
  admission_date = EXCLUDED.admission_date,
  is_new = EXCLUDED.is_new;

WITH generated_visitors AS (
  SELECT
    sequence,
    format('pessoa%s@sibmirassol.local', lpad(sequence::text, 3, '0')) AS email
  FROM generate_series(321, 470) AS sequence
)
INSERT INTO visitors (
  person_id,
  visit_date,
  invited_by,
  follow_up_status,
  is_recent
)
SELECT
  p.id,
  DATE '2024-01-01' + ((sequence * 13) % 365),
  (ARRAY['Espontâneo', 'Pr. Anderson', 'Marta Oliveira', 'Lucas Santos', 'Ana Clara'])[(sequence % 5) + 1],
  (ARRAY['waiting_contact', 'following_up', 'integrated'])[(sequence % 3) + 1],
  sequence > 450
FROM generated_visitors
JOIN people p ON lower(p.email) = lower(generated_visitors.email)
ON CONFLICT (person_id) DO UPDATE SET
  visit_date = EXCLUDED.visit_date,
  invited_by = EXCLUDED.invited_by,
  follow_up_status = EXCLUDED.follow_up_status,
  is_recent = EXCLUDED.is_recent;

COMMIT;
