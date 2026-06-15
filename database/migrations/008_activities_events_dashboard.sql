BEGIN;

CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category varchar(30) NOT NULL,
  actor varchar(120) NOT NULL DEFAULT 'Secretaria Geral',
  action varchar(200) NOT NULL,
  subject varchar(160),
  details text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activities_category_check CHECK (category IN ('members', 'visitors', 'calendar', 'system'))
);

CREATE INDEX activities_occurred_at_idx ON activities (occurred_at DESC);
CREATE INDEX activities_category_idx ON activities (category);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(160) NOT NULL,
  description text,
  location varchar(160) NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  category varchar(30) NOT NULL DEFAULT 'calendar',
  color varchar(20) NOT NULL DEFAULT 'purple',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_color_check CHECK (color IN ('purple', 'green', 'blue'))
);

CREATE INDEX events_starts_at_idx ON events (starts_at);

CREATE TRIGGER events_set_updated_at BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

UPDATE visitors
SET visit_date = DATE '2026-06-01' + (((row_number_value * 2) % 14)::int)
FROM (
  SELECT person_id, row_number() OVER (ORDER BY person_id) AS row_number_value
  FROM visitors
  LIMIT 18
) recent
WHERE visitors.person_id = recent.person_id;

INSERT INTO events (title, description, location, starts_at, ends_at, color) VALUES
  ('Culto de Celebração', 'Encontro semanal da congregação.', 'Templo Principal', '2026-06-14 19:00:00-03', '2026-06-14 21:00:00-03', 'purple'),
  ('Reunião de Liderança', 'Alinhamento mensal com líderes de ministérios.', 'Sala 04', '2026-06-17 19:30:00-03', '2026-06-17 21:00:00-03', 'green'),
  ('Encontro de Jovens', 'Noite de comunhão e palavra.', 'Auditório', '2026-06-20 19:00:00-03', '2026-06-20 22:00:00-03', 'blue'),
  ('Classe de Batismo', 'Preparação dos candidatos ao batismo.', 'Sala 02', '2026-06-21 09:00:00-03', '2026-06-21 11:00:00-03', 'green'),
  ('Conferência Missionária', 'Programação especial do ministério de missões.', 'Templo Principal', '2026-06-27 18:00:00-03', '2026-06-27 22:00:00-03', 'purple');

INSERT INTO activities (category, actor, action, subject, details, occurred_at) VALUES
  ('members', 'Ana Silva', 'cadastrou um novo membro', 'Lucas Oliveira', 'Cadastro concluído com ministério e célula definidos.', '2026-06-14 14:45:00-03'),
  ('calendar', 'Secretaria Geral', 'agendou uma classe de batismo', '12 candidatos', 'Atividade adicionada ao calendário ministerial.', '2026-06-14 13:20:00-03'),
  ('system', 'Sistema', 'concluiu o backup automático', 'Banco de dados', 'Rotina diária executada sem falhas.', '2026-06-14 11:00:00-03'),
  ('visitors', 'Pr. Renato', 'registrou o primeiro contato com', 'Mariana Souza', 'Visitante encaminhada para acompanhamento.', '2026-06-14 09:12:00-03'),
  ('members', 'Marcos Paulo', 'atualizou as informações de contato de', 'Fernando Dias', 'Telefone e endereço atualizados.', '2026-06-14 08:30:00-03'),
  ('calendar', 'Secretaria Geral', 'confirmou o evento', 'Culto de Celebração', 'Equipe e local confirmados.', '2026-06-13 17:10:00-03'),
  ('visitors', 'Equipe de Acolhimento', 'integrou uma visitante', 'Clara Pereira', 'Integração concluída com sucesso.', '2026-06-13 15:40:00-03'),
  ('system', 'Sistema', 'aplicou uma atualização de segurança', 'Painel administrativo', 'Atualização aplicada sem interrupções.', '2026-06-13 04:00:00-03'),
  ('members', 'Secretaria Geral', 'alterou o ministério principal de', 'Ricardo Mendes', 'Novo ministério: Acolhimento.', '2026-06-12 16:25:00-03'),
  ('calendar', 'Pr. Renato', 'criou o evento', 'Conferência Missionária', 'Evento publicado no calendário.', '2026-06-12 10:15:00-03'),
  ('visitors', 'Lucas Santos', 'registrou uma nova visitante', 'Bianca Santos', 'Primeira visita registrada.', '2026-06-11 19:30:00-03'),
  ('members', 'Secretaria Geral', 'registrou o batismo de', 'Gabriel Souza', 'Situação de batismo atualizada.', '2026-06-11 12:05:00-03');

COMMIT;
