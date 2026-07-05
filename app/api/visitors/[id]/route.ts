import { db } from "@/lib/db";
import { addActivity } from "@/lib/activities";
import { Member, Person, Visitor } from "@/lib/models";
import { apiError, personAttributes, RecordPayload, validateRecordPayload } from "@/lib/records";

export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = await request.json() as RecordPayload;
    const validationError = validateRecordPayload(payload);
    if (validationError) return Response.json({ error: validationError }, { status: 400 });

    await db.transaction(async (transaction) => {
      await Person.update(personAttributes(payload), { where: { id }, transaction });
      await Visitor.update({
        invitedBy: payload.invitedBy || "Espontâneo",
        followUpStatus: visitorStatus(payload.membershipStage),
        membershipStage: membershipStage(payload.membershipStage),
      }, { where: { personId: id }, transaction });
      await addActivity(transaction, "visitors", "atualizou o acompanhamento de", payload.name);
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
      await Visitor.destroy({ where: { personId: id }, transaction });
      if (await Member.count({ where: { personId: id }, transaction }) === 0) {
        await Person.destroy({ where: { id }, transaction });
      }
      await addActivity(transaction, "visitors", "excluiu o registro de visita de", person?.fullName);
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

function visitorStatus(stage?: string) {
  if (stage === "Membro") return "integrated";
  if (stage && stage !== "Visitou a igreja") return "following_up";
  return "waiting_contact";
}

function membershipStage(stage?: string) {
  if (stage === "Membro") return "member";
  if (stage === "Batismo") return "baptism";
  if (stage === "Visita em casa") return "home_visit";
  if (stage === "Contato realizado") return "contacted";
  return "visited";
}
