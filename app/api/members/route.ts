import { db, query } from "@/lib/db";
import { addActivity } from "@/lib/activities";
import { Member, Ministry, Person } from "@/lib/models";
import { apiError, nullable, personAttributes, RecordPayload, validateRecordPayload } from "@/lib/records";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { rows } = await query(`
      SELECT id, full_name AS name, email, phone, birth_date AS "birthDate",
        gender, marital_status AS "civilStatus", cpf, zip_code AS "zipCode",
        address, neighborhood, city, state, notes, ministry, ministry_color AS "ministryColor",
        role, status, baptism_status AS baptism, baptism_date AS "baptismDate",
        admission_date AS date, is_new AS "isNew", cell_name AS cell
      FROM member_directory ORDER BY admission_date DESC, full_name
    `);
    return Response.json(rows);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as RecordPayload;
    const validationError = validateRecordPayload(payload);
    if (validationError) return Response.json({ error: validationError }, { status: 400 });

    const id = await db.transaction(async (transaction) => {
      const person = await Person.create(personAttributes(payload), { transaction });
      const ministry = payload.ministry && payload.ministry !== "Nenhum"
        ? await Ministry.findOne({ where: { name: payload.ministry }, transaction })
        : null;

      await Member.create({
        personId: person.id,
        ministryId: ministry?.id ?? null,
        role: payload.role || "Membro Comum",
        status: payload.status === "Inativo" ? "inactive" : "active",
        baptismStatus: payload.baptismDate ? "baptized" : "waiting",
        baptismDate: nullable(payload.baptismDate),
        isNew: true,
      }, { transaction });
      await addActivity(transaction, "members", "cadastrou um novo membro", payload.name);
      return person.id;
    });

    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
