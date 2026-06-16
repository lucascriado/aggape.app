BEGIN;

DELETE FROM cell_members a
USING cell_members b
WHERE a.member_id = b.member_id
  AND a.ctid < b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS cell_members_member_unique_idx
ON cell_members (member_id);

UPDATE members m
SET cell_name = c.name
FROM cell_members cm
JOIN cells c ON c.id = cm.cell_id
WHERE m.person_id = cm.member_id;

COMMIT;
