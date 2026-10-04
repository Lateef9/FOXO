import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { loadData } from "./loader.js";
import { createSupabaseDb } from "./db.js";
import { createMemoryDb } from "./db.memory.js";
import { createApp } from "./app.js";
import { seedMembers } from "./seedLocal.js";
import {
  buildWordingPayload,
  templateWording,
  type GenerateWordingOpts,
} from "./llm/wording.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

process.env.PSEUDO_SALT = process.env.PSEUDO_SALT || "dev-salt";

let data;
try {
  data = loadData();
} catch (err) {
  console.error(
    "Failed to load server/data:",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
}

const useMemory = process.env.USE_MEMORY_DB === "1";

async function templateOnly(opts: GenerateWordingOpts) {
  const payload = buildWordingPayload(
    opts.member,
    opts.clusters,
    opts.findings,
    opts.classified,
    opts.items,
  );
  return templateWording(payload, opts.findings);
}

const db = useMemory ? createMemoryDb() : createSupabaseDb();
if (useMemory) {
  await seedMembers(db, data);
  console.log("USE_MEMORY_DB=1 — seeded 3 synthetic members in memory");
}

const app = createApp({
  data,
  db,
  // Avoid live LLM during local UI checks; templates are enough for Phase 9.
  wording: useMemory ? templateOnly : undefined,
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});
