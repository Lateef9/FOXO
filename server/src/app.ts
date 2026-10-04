import cors from "cors";
import express from "express";
import type { AppData } from "./types.js";
import type { Db } from "./db.js";
import { createApiRouter, type RouteDeps } from "./api/routes.js";

export function createApp(deps: RouteDeps) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api", createApiRouter(deps));
  return app;
}

export type { AppData, Db };
