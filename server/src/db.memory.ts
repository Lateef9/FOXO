import { randomUUID } from "node:crypto";
import type {
  AnalysisRow,
  AuditRow,
  Db,
  MarkerRow,
  MemberRow,
  NewPlaybookItem,
  PlaybookItemRow,
  PlaybookRow,
} from "./db.js";

export function createMemoryDb(): Db {
  const members = new Map<string, MemberRow>();
  const markers = new Map<string, MarkerRow[]>();
  const analyses: AnalysisRow[] = [];
  const playbooks = new Map<string, PlaybookRow>();
  const items = new Map<string, PlaybookItemRow[]>();
  const audit: AuditRow[] = [];
  let auditId = 1;

  return {
    async listMembers() {
      return [...members.values()].sort((a, b) => a.id.localeCompare(b.id));
    },
    async getMember(id) {
      return members.get(id) ?? null;
    },
    async getMemberMarkers(id) {
      return markers.get(id) ?? [];
    },
    async updateMemberStatus(id, status) {
      const m = members.get(id);
      if (!m) throw new Error("member not found");
      members.set(id, { ...m, status });
    },
    async insertAnalysis(memberId, result) {
      const row: AnalysisRow = {
        id: randomUUID(),
        member_id: memberId,
        result,
        created_at: new Date().toISOString(),
      };
      analyses.push(row);
      return row;
    },
    async getLatestAnalysis(memberId) {
      return (
        [...analyses]
          .filter((a) => a.member_id === memberId)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
      );
    },
    async insertPlaybook(memberId, analysisId, unscheduled, newItems) {
      const playbook: PlaybookRow = {
        id: randomUUID(),
        member_id: memberId,
        analysis_id: analysisId,
        status: "draft",
        approved_by: null,
        approved_at: null,
        unscheduled,
        created_at: new Date().toISOString(),
      };
      playbooks.set(playbook.id, playbook);
      const rows: PlaybookItemRow[] = newItems.map((item: NewPlaybookItem) => ({
        id: randomUUID(),
        playbook_id: playbook.id,
        item_key: item.item_key,
        week_from: item.week_from,
        week_to: item.week_to,
        category: item.category,
        title: item.title,
        why_this: item.why_this,
        wording_source: item.wording_source,
        cluster: item.cluster,
        rule_ids: item.rule_ids,
        source: item.source,
        evidence_strength: item.evidence_strength,
        warning: item.warning,
        requires_doctor_dose: item.requires_doctor_dose,
        state: item.state,
        edited_text: null,
      }));
      items.set(playbook.id, rows);
      return { playbook, items: rows };
    },
    async getPlaybook(id) {
      const playbook = playbooks.get(id);
      if (!playbook) return null;
      return { playbook, items: items.get(id) ?? [] };
    },
    async updatePlaybookItem(playbookId, itemId, patch) {
      const list = items.get(playbookId) ?? [];
      const idx = list.findIndex((i) => i.id === itemId);
      if (idx < 0) throw new Error("item not found");
      const updated = { ...list[idx]!, ...patch };
      list[idx] = updated;
      items.set(playbookId, list);
      return updated;
    },
    async approvePlaybook(playbookId, approvedBy) {
      const playbook = playbooks.get(playbookId);
      if (!playbook) throw new Error("playbook not found");
      const updated: PlaybookRow = {
        ...playbook,
        status: "approved",
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      };
      playbooks.set(playbookId, updated);
      return updated;
    },
    async writeAudit(actor, memberId, action) {
      audit.push({
        id: auditId++,
        actor,
        member_id: memberId,
        action,
        at: new Date().toISOString(),
      });
    },
    async listAudit(limit = 200) {
      return [...audit].reverse().slice(0, limit);
    },
    async upsertMember(member, markerRows) {
      members.set(member.id, member);
      markers.set(member.id, markerRows);
    },
    async clearMembers() {
      members.clear();
      markers.clear();
      analyses.length = 0;
      playbooks.clear();
      items.clear();
      audit.length = 0;
    },
  };
}
