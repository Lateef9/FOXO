import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { loadData, metaFromData } from "./loader.js";
import type { AppData } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

let data: AppData;
try {
  data = loadData();
} catch (err) {
  console.error("Failed to load server/data:", err instanceof Error ? err.message : err);
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/meta", (_req, res) => {
  res.json(metaFromData(data));
});

app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});
