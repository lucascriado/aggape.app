BEGIN;

DELETE FROM activities
WHERE id = 'aa1ddd52-1b43-4841-bc64-b0e124533b31';

INSERT INTO activities (category, actor, action, subject, details, occurred_at)
VALUES (
  'calendar',
  'Pr. Renato',
  'confirmou a equipe responsável pelo evento',
  'Encontro de Jovens',
  'Escala de voluntários e responsáveis confirmada.',
  now()
);

COMMIT;
