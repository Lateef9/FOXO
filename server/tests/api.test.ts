import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { loadData } from "../src/loader.js";
import { createMemoryDb } from "../src/db.memory.js";
import { createApp } from "../src/app.js";
import { pseudoId } from "../src/privacy/anonymise.js";
import {
  buildWordingPayload,
  templateWording,
  type GenerateWordingOpts,
} from "../src/llm/wording.js";
import type { Db } from "../src/db.js";

process.env.PSEUDO_SALT = process.env.PSEUDO_SALT || "test-salt";
process.env.DEMO_DOCTOR = "Dr. Demo";

const data = loadData();
let db: Db;
let server: Server;
let base: string;

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

async function seedMembers() {
  for (const member of data.members) {
    const unitByCode = new Map(data.markers.map((m) => [m.code, m.unit]));
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

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  return { status: res.status, body };
}

beforeAll(async () => {
  db = createMemoryDb();
  const app = createApp({ data, db, wording: templateOnly });
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("no port");
  base = `http://127.0.0.1:${addr.port}/api`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

beforeEach(async () => {
  await db.clearMembers();
  await seedMembers();
});

describe("API routes", () => {
  it("analyze without confirmed returns 400", async () => {
    const res = await api("/members/m1/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("analyze with confirmed stores analysis and audits", async () => {
    const res = await api("/members/m1/analyze", {
      method: "POST",
      body: JSON.stringify({ confirmed: true }),
    });
    expect(res.status).toBe(200);
    expect(res.body.result.findings.length).toBeGreaterThan(0);
    const member = await db.getMember("m1");
    expect(member?.status).toBe("analysed");
    const audit = await db.listAudit();
    expect(audit.some((a) => a.action === "analyze")).toBe(true);
  });

  it("anonymisation does not require LLM and audits view_anonymisation", async () => {
    const res = await api("/members/m1/anonymisation");
    expect(res.status).toBe(200);
    expect(res.body.clean).toContain("[NAME]");
    expect(res.body.original).toContain("Meera");
    const audit = await db.listAudit();
    expect(audit.some((a) => a.action === "view_anonymisation")).toBe(true);
  });

  it("approve with pending items returns 409", async () => {
    await api("/members/m1/analyze", {
      method: "POST",
      body: JSON.stringify({ confirmed: true }),
    });
    const drafted = await api("/members/m1/playbook", { method: "POST" });
    expect(drafted.status).toBe(200);
    const playbookId = drafted.body.playbook.id as string;
    const approve = await api(`/playbooks/${playbookId}/approve`, {
      method: "POST",
    });
    expect(approve.status).toBe(409);
  });

  it("edit after approval returns 400; approve after decisions returns 200", async () => {
    await api("/members/m1/analyze", {
      method: "POST",
      body: JSON.stringify({ confirmed: true }),
    });
    const drafted = await api("/members/m1/playbook", { method: "POST" });
    const playbookId = drafted.body.playbook.id as string;
    const items = drafted.body.items as Array<{ id: string }>;

    for (const item of items) {
      const patch = await api(`/playbooks/${playbookId}/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ state: "accepted" }),
      });
      expect(patch.status).toBe(200);
    }

    const approve = await api(`/playbooks/${playbookId}/approve`, {
      method: "POST",
    });
    expect(approve.status).toBe(200);
    expect(approve.body.status).toBe("approved");

    const after = await api(`/playbooks/${playbookId}/items/${items[0]!.id}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "edited", edited_text: "nope" }),
    });
    expect(after.status).toBe(400);

    const audit = await db.listAudit();
    expect(audit.some((a) => a.action === "edit_item")).toBe(true);
    expect(audit.some((a) => a.action === "approve")).toBe(true);
    expect(audit.some((a) => a.action === "draft_playbook")).toBe(true);
  });
});
