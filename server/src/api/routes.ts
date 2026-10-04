import { Router } from "express";
import type { AppData, Member } from "../types.js";
import type { Db } from "../db.js";
import { analyze } from "../engine/analyze.js";
import { classifyAll } from "../engine/classify.js";
import { generatePlaybook } from "../playbook/generate.js";
import { anonymise, pseudoId } from "../privacy/anonymise.js";
import { generateWording } from "../llm/wording.js";
import { metaFromData } from "../loader.js";
import { demoDoctor, writeAudit } from "./audit.js";

export type RouteDeps = {
  data: AppData;
  db: Db;
  /** Injected for tests; defaults to generateWording */
  wording?: typeof generateWording;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

function asyncHandler(
  fn: (req: import("express").Request, res: import("express").Response) => Promise<unknown>,
) {
  return (req: import("express").Request, res: import("express").Response) => {
    fn(req, res).catch((err: unknown) => {
      console.error(err);
      res.status(500).json({ error: errorMessage(err) });
    });
  };
}

async function memberFromDb(db: Db, id: string): Promise<Member | null> {
  const row = await db.getMember(id);
  if (!row) return null;
  const markers = await db.getMemberMarkers(id);
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    sex: row.sex,
    city: row.city,
    phone: row.phone,
    email: row.email,
    goals: row.goals ?? "",
    symptoms: row.symptoms ?? [],
    history_text: row.history_text ?? "",
    markers: Object.fromEntries(markers.map((m) => [m.code, Number(m.value)])),
  };
}

export function createApiRouter(deps: RouteDeps): Router {
  const router = Router();
  const wordingFn = deps.wording ?? generateWording;

  router.get("/meta", (_req, res) => {
    res.json(metaFromData(deps.data));
  });

  router.get(
    "/members",
    asyncHandler(async (_req, res) => {
      const members = await deps.db.listMembers();
      res.json(
        members.map((m) => ({
          id: m.id,
          name: m.name,
          age: m.age,
          goals: m.goals,
          status: m.status,
          pseudo_id: m.pseudo_id,
        })),
      );
    }),
  );

  router.get(
    "/members/:id",
    asyncHandler(async (req, res) => {
      const member = await memberFromDb(deps.db, req.params.id!);
      if (!member) return res.status(404).json({ error: "member not found" });
      const classified = classifyAll(member.markers, deps.data.markers);
      await writeAudit(deps.db, "view_member", member.id);
      res.json({ member, classified });
    }),
  );

  router.get(
    "/members/:id/anonymisation",
    asyncHandler(async (req, res) => {
      const row = await deps.db.getMember(req.params.id!);
      if (!row) return res.status(404).json({ error: "member not found" });
      const { clean, removed } = anonymise(row.history_text ?? "", row);
      await writeAudit(deps.db, "view_anonymisation", row.id);
      res.json({
        original: row.history_text,
        clean,
        removed,
        pseudo_id: row.pseudo_id || pseudoId(row),
      });
    }),
  );

  router.post(
    "/members/:id/analyze",
    asyncHandler(async (req, res) => {
      if (req.body?.confirmed !== true) {
        return res.status(400).json({ error: "confirmed:true required" });
      }
      const member = await memberFromDb(deps.db, req.params.id!);
      if (!member) return res.status(404).json({ error: "member not found" });

      const analysis = analyze(member, deps.data);
      const wording = await wordingFn({
        member,
        clusters: analysis.clusters,
        findings: analysis.findings,
        classified: analysis.classified,
        items: [],
      });

      const result = { ...analysis, wording };
      const saved = await deps.db.insertAnalysis(member.id, result);
      await deps.db.updateMemberStatus(member.id, "analysed");
      await writeAudit(deps.db, "analyze", member.id);
      res.json({ id: saved.id, result });
    }),
  );

  router.get(
    "/members/:id/analysis",
    asyncHandler(async (req, res) => {
      const latest = await deps.db.getLatestAnalysis(req.params.id!);
      if (!latest) return res.status(404).json({ error: "no analysis" });
      res.json(latest);
    }),
  );

  router.post(
    "/members/:id/playbook",
    asyncHandler(async (req, res) => {
      const member = await memberFromDb(deps.db, req.params.id!);
      if (!member) return res.status(404).json({ error: "member not found" });
      const latest = await deps.db.getLatestAnalysis(member.id);
      if (!latest) return res.status(400).json({ error: "analyze first" });

      const analysisResult = latest.result as ReturnType<typeof analyze> & {
        wording?: unknown;
      };
      const playbook = generatePlaybook(
        analysisResult.clusters,
        member,
        deps.data,
      );
      const wording = await wordingFn({
        member,
        clusters: analysisResult.clusters,
        findings: analysisResult.findings,
        classified: analysisResult.classified,
        items: playbook.items,
      });
      const whyByKey = new Map(
        wording.items.map((i) => [i.item_key, i] as const),
      );

      const saved = await deps.db.insertPlaybook(
        member.id,
        latest.id,
        playbook.unscheduled,
        playbook.items.map((item) => {
          const w = whyByKey.get(item.item_key);
          return {
            item_key: item.item_key,
            week_from: item.week_from,
            week_to: item.week_to,
            category: item.category,
            title: item.title,
            why_this: w?.why_this ?? item.title,
            wording_source: w?.wording_source ?? "template",
            cluster: item.cluster,
            rule_ids: item.rule_ids,
            source: item.source,
            evidence_strength: item.evidence_strength,
            warning: item.warning,
            requires_doctor_dose: item.requires_doctor_dose,
            state: "pending",
          };
        }),
      );
      await deps.db.updateMemberStatus(member.id, "in_review");
      await writeAudit(deps.db, "draft_playbook", member.id);
      res.json(saved);
    }),
  );

  router.get(
    "/playbooks/:id",
    asyncHandler(async (req, res) => {
      const found = await deps.db.getPlaybook(req.params.id!);
      if (!found) return res.status(404).json({ error: "playbook not found" });
      res.json(found);
    }),
  );

  router.patch(
    "/playbooks/:id/items/:itemId",
    asyncHandler(async (req, res) => {
      const found = await deps.db.getPlaybook(req.params.id!);
      if (!found) return res.status(404).json({ error: "playbook not found" });
      if (found.playbook.status === "approved") {
        return res.status(400).json({ error: "playbook already approved" });
      }
      const state = req.body?.state as string | undefined;
      if (!state || !["accepted", "rejected", "edited"].includes(state)) {
        return res.status(400).json({ error: "invalid state" });
      }
      const updated = await deps.db.updatePlaybookItem(
        req.params.id!,
        req.params.itemId!,
        { state, edited_text: req.body?.edited_text ?? null },
      );
      await writeAudit(deps.db, "edit_item", found.playbook.member_id);
      res.json(updated);
    }),
  );

  router.post(
    "/playbooks/:id/approve",
    asyncHandler(async (req, res) => {
      const found = await deps.db.getPlaybook(req.params.id!);
      if (!found) return res.status(404).json({ error: "playbook not found" });
      if (found.items.some((i) => i.state === "pending")) {
        return res.status(409).json({ error: "pending items remain" });
      }
      const approved = await deps.db.approvePlaybook(
        req.params.id!,
        demoDoctor(),
      );
      await deps.db.updateMemberStatus(found.playbook.member_id, "approved");
      await writeAudit(deps.db, "approve", found.playbook.member_id);
      res.json(approved);
    }),
  );

  router.get(
    "/audit",
    asyncHandler(async (_req, res) => {
      const entries = await deps.db.listAudit(200);
      await writeAudit(deps.db, "view_audit", null);
      res.json(entries);
    }),
  );

  return router;
}
