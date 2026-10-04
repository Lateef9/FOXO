import { describe, expect, it } from "vitest";
import { analyze } from "../src/engine/analyze.js";
import { generatePlaybook } from "../src/playbook/generate.js";
import { loadData } from "../src/loader.js";
import type { AppData, Intervention } from "../src/types.js";
import type { RankedCluster } from "../src/engine/cluster.js";

const data = loadData();

function planFor(memberId: string) {
  const member = data.members.find((m) => m.id === memberId)!;
  const { clusters } = analyze(member, data);
  return {
    member,
    clusters,
    playbook: generatePlaybook(clusters, member, data),
  };
}

function startsByWeek(items: { week_from: number }[]) {
  const map = new Map<number, number>();
  for (const item of items) {
    map.set(item.week_from, (map.get(item.week_from) ?? 0) + 1);
  }
  return map;
}

describe("generatePlaybook", () => {
  it("never starts more than 2 items in any week (Meera, Arjun, Rohan)", () => {
    for (const id of ["m1", "m2", "m3"]) {
      const { playbook } = planFor(id);
      for (const [week, count] of startsByWeek(playbook.items)) {
        expect(count, `member ${id} week ${week}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it("places foundation in weeks 1-2 and supplements in 7-12", () => {
    for (const id of ["m1", "m2", "m3"]) {
      const { playbook } = planFor(id);
      for (const item of playbook.items) {
        if (item.category === "foundation") {
          expect(item.week_from).toBeGreaterThanOrEqual(1);
          expect(item.week_from).toBeLessThanOrEqual(2);
          expect(item.week_to).toBeLessThanOrEqual(2);
        }
        if (item.category === "supplement") {
          expect(item.week_from).toBeGreaterThanOrEqual(7);
          expect(item.week_from).toBeLessThanOrEqual(12);
          expect(item.week_to).toBeLessThanOrEqual(12);
        }
      }
    }
  });

  it("Meera plan includes m_foods, m_review_meds, and shared foundation items", () => {
    const { playbook } = planFor("m1");
    const keys = new Set([
      ...playbook.items.map((i) => i.item_key),
      ...playbook.unscheduled.map((i) => i.item_key),
    ]);
    expect(keys.has("m_foods")).toBe(true);
    expect(keys.has("m_review_meds")).toBe(true);
    expect(keys.has("f_sleep")).toBe(true);
    expect(keys.has("f_steps")).toBe(true);
  });

  it("Rohan: no overlapping iron/zinc pair without a warning", () => {
    const { playbook } = planFor("m3");
    const zinc = playbook.items.find((i) => i.item_key === "g_zinc");
    const iron = playbook.items.find((i) => i.item_key === "g_iron_supp");
    if (zinc && iron) {
      const overlap =
        zinc.week_from <= iron.week_to && iron.week_from <= zinc.week_to;
      if (overlap) {
        expect(zinc.warning ?? "").toMatch(/Iron and zinc/i);
        expect(iron.warning ?? "").toMatch(/Iron and zinc/i);
      }
    }
    // Also check any iron+zinc tagged overlapping pair
    const ironTagged = playbook.items.filter((i) => i.tags.includes("iron"));
    const zincTagged = playbook.items.filter((i) => i.tags.includes("zinc"));
    for (const a of ironTagged) {
      for (const b of zincTagged) {
        const overlap = a.week_from <= b.week_to && b.week_from <= a.week_to;
        if (overlap) {
          expect(a.warning ?? "").toMatch(/Iron and zinc/i);
          expect(b.warning ?? "").toMatch(/Iron and zinc/i);
        }
      }
    }
  });

  it("every item has source and no dose strings", () => {
    for (const id of ["m1", "m2", "m3"]) {
      const { playbook } = planFor(id);
      for (const item of [...playbook.items, ...playbook.unscheduled]) {
        expect(item.source?.length).toBeGreaterThan(0);
        expect(item.title).not.toMatch(/\b\d+\s*mg\b/i);
        expect(item.title).not.toMatch(/\bdose\b/i);
        expect(JSON.stringify(item)).not.toMatch(/\b\d+\s*mg\b/i);
      }
    }
  });

  it("overflow beyond phase capacity goes to unscheduled, not dropped", () => {
    const manyFoundation: Intervention[] = Array.from({ length: 6 }, (_, i) => ({
      id: `f_extra_${i}`,
      title: `Extra foundation ${i}`,
      category: "foundation",
      clusters: ["gut_absorption"],
      order: i + 1,
      tags: [],
      requires_doctor_dose: false,
      evidence_strength: "TODO",
      source: "TODO",
    }));

    const fakeData: AppData = {
      ...data,
      interventions: manyFoundation,
    };
    const member = data.members.find((m) => m.id === "m3")!;
    const clusters: RankedCluster[] = [
      {
        id: "gut_absorption",
        title: "Gut",
        rule_ids: ["micronutrient_pattern"],
        severity: 2,
        reversibility: 2,
        findings: ["ferritin"],
        symptom_multiplier: 3,
        score: 1,
        matches_symptoms: ["bloating"],
        retest_markers: ["ferritin"],
      },
    ];

    const playbook = generatePlaybook(clusters, member, fakeData);
    const foundationScheduled = playbook.items.filter(
      (i) => i.category === "foundation",
    );
    // Weeks 1-2 × 2 starts = 4 max foundation starts
    expect(foundationScheduled.length).toBeLessThanOrEqual(4);
    expect(playbook.unscheduled.length).toBeGreaterThan(0);
    const allKeys = new Set([
      ...playbook.items.map((i) => i.item_key),
      ...playbook.unscheduled.map((i) => i.item_key),
    ]);
    for (const iv of manyFoundation) {
      expect(allKeys.has(iv.id)).toBe(true);
    }
  });

  it("includes a week-12 retest item", () => {
    const { playbook } = planFor("m1");
    const retest =
      playbook.items.find((i) => i.item_key === "retest") ??
      playbook.unscheduled.find((i) => i.item_key === "retest");
    expect(retest).toBeTruthy();
    expect(retest!.week_from).toBe(12);
    expect(retest!.title.toLowerCase()).toContain("retest");
  });
});
