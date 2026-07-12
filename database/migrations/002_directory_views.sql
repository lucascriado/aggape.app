-- Views que alimentam as listagens de membros e visitantes.

CREATE OR REPLACE VIEW member_directory AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.birth_date,
  p.gender,
  p.marital_status,
  p.cpf,
  p.zip_code,
  p.address,
  p.neighborhood,
  p.city,
  p.state,
  p.avatar_url,
  p.notes,
  COALESCE(mi.name, 'Nenhum') AS ministry,
  COALESCE(mi.color, 'gray') AS ministry_color,
  m.role,
  m.status,
  m.baptism_status,
  m.baptism_date,
  m.admission_date,
  m.is_new,
  m.created_at,
  m.updated_at,
  m.cell_name
FROM members m
JOIN people p ON p.id = m.person_id
LEFT JOIN ministries mi ON mi.id = m.ministry_id;

CREATE OR REPLACE VIEW visitor_directory AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.birth_date,
  p.gender,
  p.marital_status,
  p.cpf,
  p.zip_code,
  p.address,
  p.neighborhood,
  p.city,
  p.state,
  p.avatar_url,
  p.notes,
  v.visit_date,
  v.invited_by,
  v.follow_up_status,
  v.is_recent,
  v.created_at,
  v.updated_at,
  v.membership_stage
FROM visitors v
JOIN people p ON p.id = v.person_id;
