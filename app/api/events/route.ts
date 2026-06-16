import { db, query } from "@/lib/db";
import { addActivity } from "@/lib/activities";
import { apiError, nullable } from "@/lib/records";

export const runtime = "nodejs";

type EventPayload = {
  title?: string;
  description?: string;
  location?: string;
  startsAt?: string;
  endsAt?: string;
  color?: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const values: unknown[] = [];
    const filters: string[] = [];

    if (from) {
      values.push(from);
      filters.push(`starts_at >= $${values.length}`);
    }

    if (to) {
      values.push(to);
      filters.push(`starts_at < $${values.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const { rows } = await query(`
      SELECT id, title, description, location, starts_at AS "startsAt",
        ends_at AS "endsAt", category, color
      FROM events ${where}
      ORDER BY starts_at ASC
    `, values);

    return Response.json(rows);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as EventPayload;
    const title = payload.title?.trim();
    const location = payload.location?.trim();
    const startsAt = payload.startsAt?.trim();
    const color = normalizeColor(payload.color);

    if (!title) return Response.json({ error: "Título é obrigatório." }, { status: 400 });
    if (!location) return Response.json({ error: "Local é obrigatório." }, { status: 400 });
    if (!startsAt) return Response.json({ error: "Data e horário são obrigatórios." }, { status: 400 });

    const id = await db.transaction(async (transaction) => {
      const [rows] = await db.query(`
        INSERT INTO events (title, description, location, starts_at, ends_at, color)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, {
        bind: [title, nullable(payload.description), location, startsAt, nullable(payload.endsAt), color],
        transaction,
      });
      await addActivity(transaction, "calendar", "criou o evento", title, location);
      return (rows as Array<{ id: string }>)[0].id;
    });

    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

function normalizeColor(color?: string) {
  if (color === "green" || color === "blue" || color === "purple") return color;
  return "purple";
}
