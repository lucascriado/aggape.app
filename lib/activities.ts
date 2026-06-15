import type { Transaction } from "sequelize";
import { Activity } from "@/lib/models";

export async function addActivity(transaction: Transaction, category: "members" | "visitors" | "calendar" | "system", action: string, subject?: string, details?: string) {
  await Activity.create({
    category,
    actor: "Secretaria Geral",
    action,
    subject: subject ?? null,
    details: details ?? null,
  }, { transaction });
}
