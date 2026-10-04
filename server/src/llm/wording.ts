import { createHash } from "node:crypto";
import type { Member } from "../types.js";
import type { ClassifiedMarker } from "../engine/classify.js";
import type { RankedCluster } from "../engine/cluster.js";
import type { Finding } from "../engine/rules.js";
import type { PlaybookItem } from "../playbook/generate.js";
import { anonymise, pseudoId } from "../privacy/anonymise.js";
import { supabaseLlmCache, type LlmCacheStore } from "./cache.js";
import {
  validateLlmWording,
  type WordingResponse,
} from "./guard.js";

export type WordingSource = "llm" | "template";

export type ClusterWording = {
  cluster_id: string;
  doctor_summary: string;
  member_friendly: string;
  wording_source: WordingSource;
};

export type ItemWording = {
  item_key: string;
  why_this: string;
  wording_source: WordingSource;
};

export type WordingResult = {
  clusters: ClusterWording[];
  items: ItemWording[];
  cache_hit: boolean;
  used: WordingSource;
};

export type WordingPayload = {
  pseudo_id: string;
  history: string;
  clusters: Array<{
    cluster_id: string;
    title: string;
    inferences: string[];
    markers: Array<{
      name: string;
      code: string;
      value: number;
      unit: string;
      status: string;
    }>;
  }>;
  items: Array<{ item_key: string; title: string; category: string }>;
};

export type LlmClient = {
  complete(system: string, user: string): Promise<unknown>;
};

const SYSTEM_PROMPT = `You write plain wording for a doctor-facing demo tool.
Rules:
- Use ONLY facts present in the JSON input.
- Do not invent numbers, doses, brand names, or new recommendations.
- Do not use diagnosis wording (no disease labels or "you have X").
- Keep doctor_summary and member_friendly <= 60 words each.
- Keep why_this <= 25 words.
- Return JSON matching: { clusters: [{cluster_id, doctor_summary, member_friendly}], items: [{item_key, why_this}] }.`;

export function buildWordingPayload(
  member: Member,
  clusters: RankedCluster[],
  findings: Finding[],
  classified: ClassifiedMarker[],
  items: PlaybookItem[],
): WordingPayload {
  const { clean } = anonymise(member.history_text, member);
  const byCode = new Map(classified.map((c) => [c.code, c]));

  return {
    pseudo_id: pseudoId(member),
    history: clean,
    clusters: clusters.map((cluster) => {
      const clusterFindings = findings.filter((f) => f.cluster === cluster.id);
      const markerCodes = new Set(cluster.findings);
      for (const f of clusterFindings) {
        for (const code of f.markers_involved) markerCodes.add(code);
      }
      const markers = [...markerCodes]
        .map((code) => byCode.get(code))
        .filter((m): m is ClassifiedMarker => Boolean(m))
        .map((m) => ({
          name: m.name,
          code: m.code,
          value: m.value,
          unit: m.unit,
          status: m.status,
        }));
      return {
        cluster_id: cluster.id,
        title: cluster.title,
        inferences: clusterFindings.map((f) => f.inference),
        markers,
      };
    }),
    items: items.map((item) => ({
      item_key: item.item_key,
      title: item.title,
      category: item.category,
    })),
  };
}

export function templateWording(
  payload: WordingPayload,
  findings: Finding[],
): WordingResult {
  const clusters: ClusterWording[] = payload.clusters.map((c) => {
    const inference =
      c.inferences[0] ??
      findings.find((f) => f.cluster === c.cluster_id)?.inference ??
      c.title;
    return {
      cluster_id: c.cluster_id,
      doctor_summary: inference,
      member_friendly: inference,
      wording_source: "template",
    };
  });
  const items: ItemWording[] = payload.items.map((item) => ({
    item_key: item.item_key,
    why_this: item.title,
    wording_source: "template",
  }));
  return { clusters, items, cache_hit: false, used: "template" };
}

function withSource(
  data: WordingResponse,
  source: WordingSource,
  cache_hit: boolean,
): WordingResult {
  return {
    cache_hit,
    used: source,
    clusters: data.clusters.map((c) => ({ ...c, wording_source: source })),
    items: data.items.map((i) => ({ ...i, wording_source: source })),
  };
}

export function payloadHash(payload: WordingPayload): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function defaultOpenAiClient(): Promise<LlmClient> {
  return {
    async complete(system, user) {
      const key = process.env.LLM_API_KEY;
      const model = process.env.LLM_MODEL || "gpt-6-luna";
      if (!key) throw new Error("LLM_API_KEY missing");

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`LLM HTTP ${res.status}: ${body.slice(0, 200)}`);
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content;
      if (!content) throw new Error("LLM returned empty content");
      return JSON.parse(content) as unknown;
    },
  };
}

export type GenerateWordingOpts = {
  member: Member;
  clusters: RankedCluster[];
  findings: Finding[];
  classified: ClassifiedMarker[];
  items: PlaybookItem[];
  llm?: LlmClient;
  cache?: LlmCacheStore;
};

export async function generateWording(
  opts: GenerateWordingOpts,
): Promise<WordingResult> {
  const payload = buildWordingPayload(
    opts.member,
    opts.clusters,
    opts.findings,
    opts.classified,
    opts.items,
  );
  const cache = opts.cache ?? supabaseLlmCache();
  const hash = payloadHash(payload);

  const cached = await cache.get(hash);
  if (cached) {
    const checked = validateLlmWording(payload, cached);
    if (checked.ok) return withSource(checked.data, "llm", true);
  }

  const fallback = () => templateWording(payload, opts.findings);

  try {
    const llm = opts.llm ?? (await defaultOpenAiClient());
    const raw = await llm.complete(
      SYSTEM_PROMPT,
      JSON.stringify(payload, null, 2),
    );
    const checked = validateLlmWording(payload, raw);
    if (!checked.ok) return fallback();
    await cache.set(hash, checked.data);
    return withSource(checked.data, "llm", false);
  } catch {
    return fallback();
  }
}

export { SYSTEM_PROMPT };
