import { db, query } from "@/lib/db";
import { addActivity } from "@/lib/activities";
import { apiError } from "@/lib/records";
import { QueryTypes } from "sequelize";

export const runtime = "nodejs";

type CellPayload = {
  name: string;
  leaderId?: string;
  address?: string;
  meetingDay?: string;
  meetingTime?: string;
  color?: string;
  notes?: string;
  memberIds?: string[];
};

export async function GET() {
  try {
    const { rows } = await query(`
      SELECT
        c.id,
        c.name,
        c.address,
        c.meeting_day AS "meetingDay",
        to_char(c.meeting_time, 'HH24:MI') AS "meetingTime",
        c.color,
        c.notes,
        c.leader_id AS "leaderId",
        leader.full_name AS "leaderName",
        COUNT(cm.member_id)::int AS "memberCount",
        COALESCE(json_agg(json_build_object('id', p.id, 'name', p.full_name, 'email', p.email) ORDER BY p.full_name) FILTER (WHERE p.id IS NOT NULL), '[]') AS members
      FROM cells c
      LEFT JOIN people leader ON leader.id = c.leader_id
      LEFT JOIN cell_members cm ON cm.cell_id = c.id
      LEFT JOIN people p ON p.id = cm.member_id
      GROUP BY c.id, leader.full_name
      ORDER BY c.created_at DESC, c.name
    `);
    return Response.json(rows);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as CellPayload;
    const name = payload.name?.trim();
    if (!name) return Response.json({ error: "Nome da célula é obrigatório." }, { status: 400 });

    const id = await db.transaction(async (transaction) => {
      const created = await db.query<{ id: string }>(`
        INSERT INTO cells (name, leader_id, address, meeting_day, meeting_time, color, notes)
        VALUES ($1, $2, $3, $4, $5::time, $6, $7)
        RETURNING id
      `, {
        bind: [
          name,
          payload.leaderId || null,
          payload.address?.trim() || null,
          payload.meetingDay || "Domingo",
          payload.meetingTime || "19:30",
          payload.color || "purple",
          payload.notes?.trim() || null,
        ],
        transaction,
        type: QueryTypes.SELECT,
      });

      const cellId = created[0].id;
      const memberIds = Array.isArray(payload.memberIds) ? payload.memberIds : [];
      for (const memberId of memberIds) {
        await db.query(`DELETE FROM cell_members WHERE member_id = $1`, { bind: [memberId], transaction });
        await db.query(`
          INSERT INTO cell_members (cell_id, member_id) VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, { bind: [cellId, memberId], transaction });
        await db.query(`UPDATE members SET cell_name = $1 WHERE person_id = $2`, { bind: [name, memberId], transaction });
      }

      await addActivity(transaction, "members", "criou a célula", name);
      return cellId;
    });

    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
