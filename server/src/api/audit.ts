import type { Db } from "../db.js";

export function demoDoctor(): string {
  return process.env.DEMO_DOCTOR || "Dr. Demo";
}

export async function writeAudit(
  db: Db,
  action: string,
  memberId: string | null = null,
): Promise<void> {
  await db.writeAudit(demoDoctor(), memberId, action);
}
