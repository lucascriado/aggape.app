BEGIN;

ALTER TABLE visitors
  ADD COLUMN membership_stage varchar(30) NOT NULL DEFAULT 'visited';

ALTER TABLE visitors
  ADD CONSTRAINT visitors_membership_stage_check CHECK (
    membership_stage IN ('visited', 'contacted', 'home_visit', 'baptism', 'member')
  );

UPDATE visitors
SET membership_stage = CASE
  WHEN follow_up_status = 'integrated' THEN 'member'
  WHEN follow_up_status = 'following_up' THEN 'contacted'
  ELSE 'visited'
END;

CREATE INDEX visitors_membership_stage_idx ON visitors (membership_stage);

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

COMMIT;
