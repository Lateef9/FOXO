import type { AppData } from "./types.js";
import type { Db } from "./db.js";
import { pseudoId } from "./privacy/anonymise.js";

/** Seed members.json into any Db implementation (memory or Supabase). */
export async function seedMembers(db: Db, data: AppData): Promise<void> {
  const unitByCode = new Map(data.markers.map((m) => [m.code, m.unit]));
  for (const member of data.members) {
    await db.upsertMember(
      {
        id: member.id,
        pseudo_id: pseudoId(member),
        name: member.name,
        age: member.age,
        sex: member.sex,
        city: member.city,
        phone: member.phone,
        email: member.email,
        goals: member.goals,
        symptoms: member.symptoms,
        history_text: member.history_text,
        status: "report_received",
      },
      Object.entries(member.markers).map(([code, value]) => ({
        member_id: member.id,
        code,
        value,
        unit: unitByCode.get(code) ?? null,
      })),
    );
  }
}
