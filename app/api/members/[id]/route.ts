import { db } from "@/lib/db";
import { addActivity } from "@/lib/activities";
import { Member, Ministry, Person, Visitor } from "@/lib/models";
import { apiError, nullable, personAttributes, RecordPayload, validateRecordPayload } from "@/lib/records";

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
      }, { where: { personId: id }, transaction });
      await addActivity(transaction, "members", "atualizou o cadastro de", payload.name);
    });

    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
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
