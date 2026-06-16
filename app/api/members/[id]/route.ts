import { db } from "@/lib/db";
import { addActivity } from "@/lib/activities";
import { Member, Ministry, Person, Visitor } from "@/lib/models";
import { apiError, nullable, personAttributes, RecordPayload, validateRecordPayload } from "@/lib/records";
import { QueryTypes, type Transaction } from "sequelize";

export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = await request.json() as RecordPayload;
    const validationError = validateRecordPayload(payload);
    if (validationError) return Response.json({ error: validationError }, { status: 400 });

    await db.transaction(async (transaction) => {
      const ministry = payload.ministry && payload.ministry !== "Nenhum"
        ? await Ministry.findOne({ where: { name: payload.ministry }, transaction })
        : null;
      await Person.update(personAttributes(payload), { where: { id }, transaction });
      await Member.update({
        ministryId: ministry?.id ?? null,
        role: payload.role || "Membro Comum",
        status: payload.status === "Inativo" ? "inactive" : "active",
        baptismStatus: payload.baptismDate ? "baptized" : "waiting",
        baptismDate: nullable(payload.baptismDate),
        cellName: payload.cell || "Sem célula",
      }, { where: { personId: id }, transaction });
      await syncCellMembership(id, payload.cell, transaction);
      await addActivity(transaction, "members", "atualizou o cadastro de", payload.name);
    });

    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

async function syncCellMembership(memberId: string, cellName: string | undefined, transaction: Transaction) {
  await db.query(`DELETE FROM cell_members WHERE member_id = $1`, { bind: [memberId], transaction });
  if (!cellName || cellName === "Sem célula") return;
  const rows = await db.query<{ id: string }>(`SELECT id FROM cells WHERE name = $1`, { bind: [cellName], transaction, type: QueryTypes.SELECT });
  const cell = rows[0];
  if (!cell) return;
  await db.query(`INSERT INTO cell_members (cell_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, { bind: [cell.id, memberId], transaction });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await db.transaction(async (transaction) => {
      const person = await Person.findByPk(id, { transaction });
      await Member.destroy({ where: { personId: id }, transaction });
      if (await Visitor.count({ where: { personId: id }, transaction }) === 0) {
        await Person.destroy({ where: { id }, transaction });
      }
      await addActivity(transaction, "members", "excluiu o cadastro de", person?.fullName);
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
