import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { loadData } from "../src/loader.js";
import { createSupabaseDb } from "../src/db.js";
import { pseudoId } from "../src/privacy/anonymise.js";
import { seedMembers } from "../src/seedLocal.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  process.env.PSEUDO_SALT = process.env.PSEUDO_SALT || "dev-salt";
  const data = loadData();
  const db = createSupabaseDb();
  await seedMembers(db, data);
  for (const member of data.members) {
    console.log(
      `seeded ${member.id} (${member.name}) pseudo_id=${pseudoId(member)}`,
    );
  }
  console.log(`done: ${data.members.length} members`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
