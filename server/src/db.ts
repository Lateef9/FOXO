import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type MemberRow = {
  id: string;
  pseudo_id: string;
  name: string;
  age: number;
  sex: string;
  city: string;
  phone: string;
  email: string;
  goals: string;
  symptoms: string[];
  history_text: string;
  status: string;
};

export type MarkerRow = {
  member_id: string;
  code: string;
  value: number;
  unit: string | null;
};

export type AnalysisRow = {
  id: string;
  member_id: string;
  result: unknown;
  created_at: string;
};

export type PlaybookRow = {
  id: string;
  member_id: string;
  analysis_id: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  unscheduled: unknown;
  created_at: string;
};

export type PlaybookItemRow = {
  id: string;
  playbook_id: string;
  item_key: string | null;
  week_from: number | null;
  week_to: number | null;
  category: string | null;
  title: string | null;
  why_this: string | null;
  wording_source: string | null;
  cluster: string | null;
  rule_ids: string[] | null;
  source: string | null;
  evidence_strength: string | null;
  warning: string | null;
  requires_doctor_dose: boolean | null;
  state: string;
  edited_text: string | null;
};

export type AuditRow = {
  id: number;
  actor: string;
  member_id: string | null;
  action: string;
  at: string;
};

export type NewPlaybookItem = {
  item_key: string;
  week_from: number;
  week_to: number;
  category: string;
  title: string;
  why_this: string;
  wording_source: string;
  cluster: string;
  rule_ids: string[];
  source: string;
  evidence_strength: string;
  warning: string | null;
  requires_doctor_dose: boolean;
  state: string;
};

export type Db = {
  listMembers(): Promise<MemberRow[]>;
  getMember(id: string): Promise<MemberRow | null>;
  getMemberMarkers(id: string): Promise<MarkerRow[]>;
  updateMemberStatus(id: string, status: string): Promise<void>;
  insertAnalysis(memberId: string, result: unknown): Promise<AnalysisRow>;
  getLatestAnalysis(memberId: string): Promise<AnalysisRow | null>;
  insertPlaybook(
    memberId: string,
    analysisId: string,
    unscheduled: unknown,
    items: NewPlaybookItem[],
  ): Promise<{ playbook: PlaybookRow; items: PlaybookItemRow[] }>;
  getPlaybook(
    id: string,
  ): Promise<{ playbook: PlaybookRow; items: PlaybookItemRow[] } | null>;
  updatePlaybookItem(
    playbookId: string,
    itemId: string,
    patch: { state: string; edited_text?: string | null },
  ): Promise<PlaybookItemRow>;
  approvePlaybook(
    playbookId: string,
    approvedBy: string,
  ): Promise<PlaybookRow>;
  writeAudit(
    actor: string,
    memberId: string | null,
    action: string,
  ): Promise<void>;
  listAudit(limit?: number): Promise<AuditRow[]>;
  upsertMember(member: MemberRow, markers: MarkerRow[]): Promise<void>;
  clearMembers(): Promise<void>;
};

function client(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY are required");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createSupabaseDb(): Db {
  const sb = client();

  return {
    async listMembers() {
      const { data, error } = await sb
        .from("members")
        .select("*")
        .order("id");
      if (error) throw error;
      return (data ?? []) as MemberRow[];
    },

    async getMember(id) {
      const { data, error } = await sb
        .from("members")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as MemberRow) ?? null;
    },

    async getMemberMarkers(id) {
      const { data, error } = await sb
        .from("member_markers")
        .select("*")
        .eq("member_id", id);
      if (error) throw error;
      return (data ?? []) as MarkerRow[];
    },

    async updateMemberStatus(id, status) {
      const { error } = await sb.from("members").update({ status }).eq("id", id);
      if (error) throw error;
    },

    async insertAnalysis(memberId, result) {
      const { data, error } = await sb
        .from("analyses")
        .insert({ member_id: memberId, result })
        .select("*")
        .single();
      if (error) throw error;
      return data as AnalysisRow;
    },

    async getLatestAnalysis(memberId) {
      const { data, error } = await sb
        .from("analyses")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as AnalysisRow) ?? null;
    },

    async insertPlaybook(memberId, analysisId, unscheduled, items) {
      const { data: playbook, error } = await sb
        .from("playbooks")
        .insert({
          member_id: memberId,
          analysis_id: analysisId,
          status: "draft",
          unscheduled,
        })
        .select("*")
        .single();
      if (error) throw error;

      const rows = items.map((item) => ({
        playbook_id: (playbook as PlaybookRow).id,
        ...item,
      }));
      const { data: inserted, error: itemErr } = await sb
        .from("playbook_items")
        .insert(rows)
        .select("*");
      if (itemErr) throw itemErr;

      return {
        playbook: playbook as PlaybookRow,
        items: (inserted ?? []) as PlaybookItemRow[],
      };
    },

    async getPlaybook(id) {
      const { data: playbook, error } = await sb
        .from("playbooks")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!playbook) return null;
      const { data: items, error: itemErr } = await sb
        .from("playbook_items")
        .select("*")
        .eq("playbook_id", id)
        .order("week_from");
      if (itemErr) throw itemErr;
      return {
        playbook: playbook as PlaybookRow,
        items: (items ?? []) as PlaybookItemRow[],
      };
    },

    async updatePlaybookItem(playbookId, itemId, patch) {
      const { data, error } = await sb
        .from("playbook_items")
        .update(patch)
        .eq("playbook_id", playbookId)
        .eq("id", itemId)
        .select("*")
        .single();
      if (error) throw error;
      return data as PlaybookItemRow;
    },

    async approvePlaybook(playbookId, approvedBy) {
      const { data, error } = await sb
        .from("playbooks")
        .update({
          status: "approved",
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq("id", playbookId)
        .select("*")
        .single();
      if (error) throw error;
      return data as PlaybookRow;
    },

    async writeAudit(actor, memberId, action) {
      const { error } = await sb.from("audit_log").insert({
        actor,
        member_id: memberId,
        action,
      });
      if (error) throw error;
    },

    async listAudit(limit = 200) {
      const { data, error } = await sb
        .from("audit_log")
        .select("*")
        .order("at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },

    async upsertMember(member, markers) {
      const { error } = await sb.from("members").upsert(member);
      if (error) throw error;
      await sb.from("member_markers").delete().eq("member_id", member.id);
      if (markers.length) {
        const { error: mErr } = await sb.from("member_markers").insert(markers);
        if (mErr) throw mErr;
      }
    },

    async clearMembers() {
      await sb.from("playbook_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await sb.from("playbooks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await sb.from("analyses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await sb.from("audit_log").delete().neq("id", 0);
      await sb.from("member_markers").delete().neq("member_id", "");
      await sb.from("members").delete().neq("id", "");
    },
  };
}
