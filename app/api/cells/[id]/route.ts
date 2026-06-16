import { db } from "@/lib/db";
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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await request.json() as CellPayload;
    const name = payload.name?.trim();
    if (!name) return Response.json({ error: "Nome da célula é obrigatório." }, { status: 400 });

    await db.transaction(async (transaction) => {
      const previousRows = await db.query<{ name: string }>(`SELECT name FROM cells WHERE id = $1`, { bind: [id], transaction, type: QueryTypes.SELECT });
      const previous = previousRows[0];
      if (!previous) throw new Error("Célula não encontrada.");

      await db.query(`
        UPDATE cells
        SET name = $1, leader_id = $2, address = $3, meeting_day = $4, meeting_time = $5::time, color = $6, notes = $7
        WHERE id = $8
      `, {
        bind: [
          name,
          payload.leaderId || null,
          payload.address?.trim() || null,
          payload.meetingDay || "Domingo",
          payload.meetingTime || "19:30",
          payload.color || "purple",
          payload.notes?.trim() || null,
          id,
        ],
        transaction,
      });

      await db.query(`UPDATE members SET cell_name = 'Sem célula' WHERE cell_name = $1`, { bind: [previous.name], transaction });
      await db.query(`DELETE FROM cell_members WHERE cell_id = $1`, { bind: [id], transaction });

      const memberIds = Array.isArray(payload.memberIds) ? payload.memberIds : [];
      for (const memberId of memberIds) {
        await db.query(`DELETE FROM cell_members WHERE member_id = $1`, { bind: [memberId], transaction });
        await db.query(`
          INSERT INTO cell_members (cell_id, member_id) VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, { bind: [id, memberId], transaction });
        await db.query(`UPDATE members SET cell_name = $1 WHERE person_id = $2`, { bind: [name, memberId], transaction });
      }

      await addActivity(transaction, "members", "atualizou a célula", name);
    });

    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.transaction(async (transaction) => {
      const rows = await db.query<{ name: string }>(`SELECT name FROM cells WHERE id = $1`, { bind: [id], transaction, type: QueryTypes.SELECT });
      const cell = rows[0];
      if (!cell) return;
      await db.query(`UPDATE members SET cell_name = 'Sem célula' WHERE cell_name = $1`, { bind: [cell.name], transaction });
      await db.query(`DELETE FROM cells WHERE id = $1`, { bind: [id], transaction });
      await addActivity(transaction, "members", "excluiu a célula", cell.name);
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
