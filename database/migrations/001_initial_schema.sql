-- Schema inicial consolidado do Nonia.
-- Requer PostgreSQL 13+ (usa gen_random_uuid nativo).

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(160) NOT NULL,
  email varchar(254) NOT NULL,
  phone varchar(30),
  birth_date date,
  gender varchar(30),
  marital_status varchar(30),
  cpf varchar(14),
  zip_code varchar(9),
  address varchar(200),
  neighborhood varchar(100),
  city varchar(100),
  state varchar(80),
  avatar_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT people_avatar_url_base64_check CHECK (
    avatar_url IS NULL OR (
      length(avatar_url) <= 122880
      AND avatar_url ~ '^data:image/(png|jpeg);base64,[A-Za-z0-9+/=]+$'
    )
  )
);

CREATE UNIQUE INDEX people_email_unique_idx ON people (lower(email));
CREATE UNIQUE INDEX people_cpf_unique_idx ON people (cpf) WHERE cpf IS NOT NULL;
CREATE INDEX people_name_search_idx ON people (lower(full_name));

CREATE TABLE ministries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL UNIQUE,
  color varchar(20) NOT NULL DEFAULT 'gray',
  description text,
  leader_id uuid REFERENCES people(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ministries_color_check CHECK (color IN ('blue', 'green', 'gray', 'purple'))
);

CREATE INDEX ministries_leader_idx ON ministries (leader_id);

CREATE TABLE members (
  person_id uuid PRIMARY KEY REFERENCES people(id) ON DELETE CASCADE,
  ministry_id uuid REFERENCES ministries(id) ON DELETE SET NULL,
  role varchar(80) NOT NULL DEFAULT 'Membro Comum',
  status varchar(20) NOT NULL DEFAULT 'active',
  baptism_status varchar(20) NOT NULL DEFAULT 'waiting',
  baptism_date date,
  admission_date date NOT NULL DEFAULT CURRENT_DATE,
  is_new boolean NOT NULL DEFAULT false,
  cell_name varchar(120) NOT NULL DEFAULT 'Sem célula',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT members_status_check CHECK (status IN ('active', 'inactive')),
  CONSTRAINT members_baptism_status_check CHECK (baptism_status IN ('baptized', 'waiting'))
);

CREATE INDEX members_ministry_idx ON members (ministry_id);
CREATE INDEX members_status_idx ON members (status);
CREATE INDEX members_baptism_status_idx ON members (baptism_status);
CREATE INDEX members_cell_name_idx ON members (lower(cell_name));

CREATE TABLE visitors (
  person_id uuid PRIMARY KEY REFERENCES people(id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  invited_by varchar(160) NOT NULL DEFAULT 'Espontâneo',
  follow_up_status varchar(30) NOT NULL DEFAULT 'waiting_contact',
  membership_stage varchar(30) NOT NULL DEFAULT 'visited',
  is_recent boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT visitors_follow_up_status_check CHECK (
    follow_up_status IN ('waiting_contact', 'following_up', 'integrated')
  ),
  CONSTRAINT visitors_membership_stage_check CHECK (
    membership_stage IN ('visited', 'contacted', 'home_visit', 'baptism', 'member')
  )
);

CREATE INDEX visitors_visit_date_idx ON visitors (visit_date DESC);
CREATE INDEX visitors_follow_up_status_idx ON visitors (follow_up_status);
CREATE INDEX visitors_membership_stage_idx ON visitors (membership_stage);
CREATE INDEX visitors_invited_by_idx ON visitors (lower(invited_by));

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

CREATE TABLE cells (
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

CREATE INDEX cells_leader_idx ON cells (leader_id);

CREATE TABLE cell_members (
  cell_id uuid NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(person_id) ON DELETE CASCADE,
  joined_at date NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (cell_id, member_id)
);

CREATE UNIQUE INDEX cell_members_member_unique_idx ON cell_members (member_id);

CREATE TABLE ministry_attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id uuid NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  meeting_date date NOT NULL,
  title varchar(120) NOT NULL DEFAULT 'Escola Bíblica Dominical',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ministry_id, meeting_date)
);

CREATE INDEX attendance_sessions_ministry_date_idx ON ministry_attendance_sessions (ministry_id, meeting_date DESC);

CREATE TABLE ministry_attendance_records (
  session_id uuid NOT NULL REFERENCES ministry_attendance_sessions(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(person_id) ON DELETE CASCADE,
  present boolean NOT NULL DEFAULT false,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, member_id)
);

CREATE TRIGGER people_set_updated_at BEFORE UPDATE ON people
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER ministries_set_updated_at BEFORE UPDATE ON ministries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER members_set_updated_at BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER visitors_set_updated_at BEFORE UPDATE ON visitors
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER events_set_updated_at BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER cells_set_updated_at BEFORE UPDATE ON cells
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER ministry_attendance_sessions_set_updated_at BEFORE UPDATE ON ministry_attendance_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
