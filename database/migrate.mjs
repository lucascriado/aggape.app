#!/usr/bin/env node
// Executor de migrations do Nonia.
//
//   node database/migrate.mjs             aplica as migrations pendentes
//   node database/migrate.mjs --seed-dev  também aplica o seed de demonstração
//
// Mantém a tabela schema_migrations e ignora arquivos já aplicados.
// Cada migration roda dentro de uma transação própria.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, "migrations");
const devSeedFile = path.join(here, "seeds", "dev_seed.sql");
const applyDevSeed = process.argv.includes("--seed-dev");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não está definida.");
  process.exit(1);
}

const connectAttempts = Number(process.env.MIGRATE_CONNECT_ATTEMPTS ?? 15);
const connectDelayMs = 2000;

async function connectWithRetry() {
  for (let attempt = 1; ; attempt += 1) {
    const client = new Client({ connectionString });
    try {
      await client.connect();
      return client;
    } catch (error) {
      await client.end().catch(() => {});
      if (attempt >= connectAttempts) throw error;
      console.log(`Banco indisponível (tentativa ${attempt}/${connectAttempts}), aguardando...`);
      await new Promise((resolve) => setTimeout(resolve, connectDelayMs));
    }
  }
}

async function applyFile(client, label, sql, registerAs) {
  try {
    await client.query("BEGIN");
    await client.query(sql);
    if (registerAs) {
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [registerAs]);
    }
    await client.query("COMMIT");
    console.log(`✔ ${label}`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(`✖ Falha em ${label}: ${error.message}`);
    throw error;
  }
}

let client;
try {
  client = await connectWithRetry();
} catch (error) {
  console.error(`Não foi possível conectar ao banco: ${error.message}`);
  process.exit(1);
}

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await client.query("SELECT filename FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.filename));

  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
  const pending = files.filter((file) => !applied.has(file));

  if (!pending.length) {
    console.log("Nenhuma migration pendente.");
  }

  for (const file of pending) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    await applyFile(client, file, sql, file);
  }

  if (applyDevSeed) {
    const sql = await readFile(devSeedFile, "utf8");
    await applyFile(client, "seeds/dev_seed.sql", sql, null);
  }

  console.log("Banco de dados pronto.");
} catch {
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
