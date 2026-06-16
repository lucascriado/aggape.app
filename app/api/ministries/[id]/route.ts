import { db } from "@/lib/db";
import { addActivity } from "@/lib/activities";
import { apiError } from "@/lib/records";
import { QueryTypes } from "sequelize";

export const runtime = "nodejs";

type MinistryPayload = {
  name: string;
  description?: string;
  color?: string;
  leaderId?: string;
  memberIds?: string[];
};

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await request.json() as MinistryPayload;
    const name = payload.name?.trim();
    if (!name) return Response.json({ error: "Nome do ministério é obrigatório." }, { status: 400 });

    await db.transaction(async (transaction) => {
      await db.query(`
        UPDATE ministries
        SET name = $1, color = $2, description = $3, leader_id = $4
        WHERE id = $5
      `, {
        bind: [name, payload.color || "purple", payload.description?.trim() || null, payload.leaderId || null, id],
        transaction,
      });

      await db.query(`UPDATE members SET ministry_id = NULL WHERE ministry_id = $1`, { bind: [id], transaction });
      const memberIds = Array.isArray(payload.memberIds) ? payload.memberIds : [];
      for (const memberId of memberIds) {
        await db.query(`UPDATE members SET ministry_id = $1 WHERE person_id = $2`, { bind: [id, memberId], transaction });
      }

      await addActivity(transaction, "members", "atualizou o ministério", name);
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
      const rows = await db.query<{ name: string }>(`SELECT name FROM ministries WHERE id = $1`, { bind: [id], transaction, type: QueryTypes.SELECT });
      const ministry = rows[0];
      if (!ministry) return;
      await db.query(`UPDATE members SET ministry_id = NULL WHERE ministry_id = $1`, { bind: [id], transaction });
      await db.query(`DELETE FROM ministries WHERE id = $1`, { bind: [id], transaction });
      await addActivity(transaction, "members", "excluiu o ministério", ministry.name);
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
