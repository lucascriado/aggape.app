import { Sequelize } from "sequelize";
import pg from "pg";

type QueryResult<T> = { rows: T[] };

const globalForDb = globalThis as unknown as { sequelize?: Sequelize };

function createSequelize() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não está definida.");

  return new Sequelize(connectionString, {
    dialect: "postgres",
    dialectModule: pg,
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 10_000,
      idle: 30_000,
    },
  });
}

export const db = globalForDb.sequelize ?? createSequelize();

if (process.env.NODE_ENV !== "production") globalForDb.sequelize = db;

export async function query<T>(sql: string, values: unknown[] = []): Promise<QueryResult<T>> {
  const [rows] = await db.query(sql, { bind: values });
  return { rows: rows as T[] };
}
