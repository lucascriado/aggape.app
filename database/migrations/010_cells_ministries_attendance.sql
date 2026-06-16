BEGIN;

ALTER TABLE ministries
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS leader_id uuid REFERENCES people(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL UNIQUE,
  leader_id uuid REFERENCES people(id) ON DELETE SET NULL,
  address varchar(200),
  meeting_day varchar(20) NOT NULL DEFAULT 'Domingo',
  meeting_time time NOT NULL DEFAULT '19:30',
  color varchar(20) NOT NULL DEFAULT 'purple',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cells_color_check CHECK (color IN ('blue', 'green', 'gray', 'purple'))
);

CREATE TABLE IF NOT EXISTS cell_members (
  cell_id uuid NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(person_id) ON DELETE CASCADE,
  joined_at date NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (cell_id, member_id)
);

CREATE TABLE IF NOT EXISTS ministry_attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id uuid NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  meeting_date date NOT NULL,
  title varchar(120) NOT NULL DEFAULT 'Escola Bíblica Dominical',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ministry_id, meeting_date)
);

CREATE TABLE IF NOT EXISTS ministry_attendance_records (
  session_id uuid NOT NULL REFERENCES ministry_attendance_sessions(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(person_id) ON DELETE CASCADE,
  present boolean NOT NULL DEFAULT false,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, member_id)
);

INSERT INTO cells (name, address, meeting_day, meeting_time, color)
SELECT DISTINCT cell_name, NULL, 'Domingo', '19:30'::time, 'purple'
FROM members
WHERE cell_name IS NOT NULL AND cell_name <> 'Sem célula'
ON CONFLICT (name) DO NOTHING;

INSERT INTO cell_members (cell_id, member_id)
SELECT c.id, m.person_id
FROM members m
JOIN cells c ON c.name = m.cell_name
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS cell_members_member_idx ON cell_members (member_id);
CREATE INDEX IF NOT EXISTS cells_leader_idx ON cells (leader_id);
CREATE INDEX IF NOT EXISTS ministries_leader_idx ON ministries (leader_id);
CREATE INDEX IF NOT EXISTS attendance_sessions_ministry_date_idx ON ministry_attendance_sessions (ministry_id, meeting_date DESC);

CREATE TRIGGER cells_set_updated_at BEFORE UPDATE ON cells
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER ministry_attendance_sessions_set_updated_at BEFORE UPDATE ON ministry_attendance_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
