import { db, query } from "@/lib/db";
import { addActivity } from "@/lib/activities";
import { Person, Visitor } from "@/lib/models";
import { apiError, personAttributes, RecordPayload, validateRecordPayload } from "@/lib/records";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { rows } = await query(`
      SELECT id, full_name AS name, email, phone, birth_date AS "birthDate",
        gender, marital_status AS "civilStatus", cpf, zip_code AS "zipCode",
        address, neighborhood, city, state, avatar_url AS "photoDataUrl", notes, visit_date AS date,
        invited_by AS "invitedBy", membership_stage AS "membershipStage", is_recent AS recent
      FROM visitor_directory ORDER BY visit_date DESC, full_name
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
      await Visitor.create({
        personId: person.id,
        invitedBy: payload.invitedBy || "Espontâneo",
        followUpStatus: visitorStatus(payload.membershipStage),
        membershipStage: membershipStage(payload.membershipStage),
        isRecent: true,
      }, { transaction });
      await addActivity(transaction, "visitors", "registrou uma nova visita de", payload.name);
      return person.id;
    });

    return Response.json({ id }, { status: 201 });
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
