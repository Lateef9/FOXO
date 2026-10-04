import { beforeAll, describe, expect, it, vi } from "vitest";
import { analyze } from "../src/engine/analyze.js";
import { generatePlaybook } from "../src/playbook/generate.js";
import { loadData } from "../src/loader.js";
import { memoryCache } from "../src/llm/cache.js";
import { validateLlmWording } from "../src/llm/guard.js";
import {
  buildWordingPayload,
  generateWording,
  type LlmClient,
} from "../src/llm/wording.js";

beforeAll(() => {
  process.env.PSEUDO_SALT = process.env.PSEUDO_SALT || "test-salt";
});

const data = loadData();

function contextFor(memberId: string) {
  const member = data.members.find((m) => m.id === memberId)!;
  const analysis = analyze(member, data);
  const playbook = generatePlaybook(analysis.clusters, member, data);
  return { member, analysis, playbook };
}

function validResponseFor(payload: ReturnType<typeof buildWordingPayload>) {
  return {
    clusters: payload.clusters.map((c) => ({
      cluster_id: c.cluster_id,
      doctor_summary: c.title,
      member_friendly: c.title,
    })),
    items: payload.items.map((i) => ({
      item_key: i.item_key,
      why_this: i.title,
    })),
  };
}

describe("wording payload privacy", () => {
  for (const member of data.members) {
    it(`payload for ${member.id} contains no name/city/phone/email`, () => {
      const { analysis, playbook } = contextFor(member.id);
      const payload = buildWordingPayload(
        member,
        analysis.clusters,
        analysis.findings,
        analysis.classified,
        playbook.items,
      );
      const blob = JSON.stringify(payload).toLowerCase();
      for (const part of member.name.split(/\s+/).filter((p) => p.length >= 3)) {
        expect(blob).not.toContain(part.toLowerCase());
      }
      expect(blob).not.toContain(member.city.toLowerCase());
      expect(blob).not.toContain(member.email.toLowerCase());
      expect(blob).not.toContain(member.phone.replace(/\s/g, "").toLowerCase());
      expect(blob).not.toContain("98765");
      expect(payload.history).toContain("[NAME]");
      expect(payload.pseudo_id).toMatch(/^P-[0-9a-f]{6}$/);
    });
  }
});

describe("guards + generateWording", () => {
  it("rejects invented numbers and falls back to template", async () => {
    const { member, analysis, playbook } = contextFor("m1");
    const payload = buildWordingPayload(
      member,
      analysis.clusters,
      analysis.findings,
      analysis.classified,
      playbook.items,
    );
    const bad = validResponseFor(payload);
    bad.clusters[0]!.doctor_summary = "This involves a score of 99999 somehow.";

    const checked = validateLlmWording(payload, bad);
    expect(checked.ok).toBe(false);

    const llm: LlmClient = {
      complete: vi.fn(async () => bad),
    };
    const result = await generateWording({
      member,
      clusters: analysis.clusters,
      findings: analysis.findings,
      classified: analysis.classified,
      items: playbook.items,
      llm,
      cache: memoryCache(),
    });
    expect(result.used).toBe("template");
    expect(result.clusters.every((c) => c.wording_source === "template")).toBe(
      true,
    );
  });

  it("falls back on malformed LLM response", async () => {
    const { member, analysis, playbook } = contextFor("m1");
    const llm: LlmClient = {
      complete: vi.fn(async () => ({ nope: true })),
    };
    const result = await generateWording({
      member,
      clusters: analysis.clusters,
      findings: analysis.findings,
      classified: analysis.classified,
      items: playbook.items,
      llm,
      cache: memoryCache(),
    });
    expect(result.used).toBe("template");
  });

  it("accepts a valid LLM response and marks wording as llm", async () => {
    const { member, analysis, playbook } = contextFor("m1");
    const payload = buildWordingPayload(
      member,
      analysis.clusters,
      analysis.findings,
      analysis.classified,
      playbook.items,
    );
    const good = validResponseFor(payload);
    const llm: LlmClient = {
      complete: vi.fn(async () => good),
    };
    const result = await generateWording({
      member,
      clusters: analysis.clusters,
      findings: analysis.findings,
      classified: analysis.classified,
      items: playbook.items,
      llm,
      cache: memoryCache(),
    });
    expect(result.used).toBe("llm");
    expect(result.cache_hit).toBe(false);
    expect(result.clusters[0]?.doctor_summary).toBe(good.clusters[0]?.doctor_summary);
  });

  it("serves the second identical call from cache", async () => {
    const { member, analysis, playbook } = contextFor("m1");
    const payload = buildWordingPayload(
      member,
      analysis.clusters,
      analysis.findings,
      analysis.classified,
      playbook.items,
    );
    const good = validResponseFor(payload);
    const complete = vi.fn(async () => good);
    const llm: LlmClient = { complete };
    const cache = memoryCache();
    const args = {
      member,
      clusters: analysis.clusters,
      findings: analysis.findings,
      classified: analysis.classified,
      items: playbook.items,
      llm,
      cache,
    };
    const first = await generateWording(args);
    const second = await generateWording(args);
    expect(first.cache_hit).toBe(false);
    expect(second.cache_hit).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("falls back to template when the LLM client throws (invalid key path)", async () => {
    const { member, analysis, playbook } = contextFor("m1");
    const llm: LlmClient = {
      complete: vi.fn(async () => {
        throw new Error("LLM HTTP 401");
      }),
    };
    const result = await generateWording({
      member,
      clusters: analysis.clusters,
      findings: analysis.findings,
      classified: analysis.classified,
      items: playbook.items,
      llm,
      cache: memoryCache(),
    });
    expect(result.used).toBe("template");
    expect(result.items.every((i) => i.wording_source === "template")).toBe(
      true,
    );
  });
});
