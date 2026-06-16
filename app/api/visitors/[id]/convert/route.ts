import { db } from "@/lib/db";
import { addActivity } from "@/lib/activities";
import { Member, Person, Visitor } from "@/lib/models";
import { apiError } from "@/lib/records";

export const runtime = "nodejs";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    await db.transaction(async (transaction) => {
      const person = await Person.findByPk(id, { transaction });
      if (!person) {
        throw new Error("Pessoa não encontrada.");
      }

      const existingMember = await Member.findByPk(id, { transaction });
      if (!existingMember) {
        await Member.create({
          personId: id,
          ministryId: null,
          role: "Membro Comum",
          status: "active",
          baptismStatus: "waiting",
          baptismDate: null,
          isNew: true,
        }, { transaction });
      }

      await Visitor.destroy({ where: { personId: id }, transaction });
      await addActivity(transaction, "members", "converteu visitante em membro", person.fullName);
    });

    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
