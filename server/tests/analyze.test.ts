import { describe, expect, it } from "vitest";
import { analyze } from "../src/engine/analyze.js";
import { loadData } from "../src/loader.js";
import type { SpectrumStage } from "../src/engine/spectrum.js";

const data = loadData();

function stageMap(memberId: string): Record<string, SpectrumStage> {
  const member = data.members.find((m) => m.id === memberId)!;
  const result = analyze(member, data);
  return Object.fromEntries(result.spectrum.map((s) => [s.system, s.stage]));
}

describe("analyze — PROJECT.md §8 acceptance", () => {
  it("Meera (m1): rules, top cluster, stages", () => {
    const meera = data.members.find((m) => m.id === "m1")!;
    const result = analyze(meera, data);
    const ruleIds = result.findings.map((f) => f.rule_id).sort();

    expect(ruleIds).toEqual(
      ["early_insulin_resistance", "functional_b12"].sort(),
    );
    expect(result.clusters[0]?.id).toBe("methylation");
    expect(result.clusters[0]?.symptom_multiplier).toBe(3);

    const stages = stageMap("m1");
    expect(stages.cognition).toBe("compensating");
    expect(stages.metabolic).toBe("compensating");
    for (const system of [
      "gut_nutrient",
      "cardiovascular",
      "detox",
      "immunity",
      "hormonal",
    ] as const) {
      expect(stages[system]).toBe("healthy");
    }
    expect(stages.endurance).toBe("not_assessed");
    expect(stages.musculoskeletal).toBe("not_assessed");
  });

  it("Arjun (m2): rules, top cluster inflammation then insulin_resistance, stages", () => {
    const arjun = data.members.find((m) => m.id === "m2")!;
    const result = analyze(arjun, data);
    const ruleIds = result.findings.map((f) => f.rule_id).sort();

    expect(ruleIds).toEqual(
      [
        "chronic_low_grade_inflammation",
        "early_insulin_resistance",
        "ferritin_inflammation",
        "tg_hdl_pattern",
      ].sort(),
    );
    expect(result.clusters.map((c) => c.id)).toEqual([
      "inflammation",
      "insulin_resistance",
    ]);

    const stages = stageMap("m2");
    expect(stages.metabolic).toBe("strained");
    expect(stages.cardiovascular).toBe("strained");
    expect(stages.immunity).toBe("strained");
    expect(stages.gut_nutrient).toBe("compensating");
    expect(stages.detox).toBe("compensating");
    expect(stages.cognition).toBe("healthy");
    expect(stages.hormonal).toBe("healthy");
    expect(stages.endurance).toBe("not_assessed");
    expect(stages.musculoskeletal).toBe("not_assessed");
  });

  it("Rohan (m3): rules, top cluster, stages", () => {
    const rohan = data.members.find((m) => m.id === "m3")!;
    const result = analyze(rohan, data);

    expect(result.findings.map((f) => f.rule_id)).toEqual([
      "micronutrient_pattern",
    ]);
    expect(result.clusters[0]?.id).toBe("gut_absorption");

    const stages = stageMap("m3");
    expect(stages.gut_nutrient).toBe("strained");
    expect(stages.cognition).toBe("compensating");
    for (const system of [
      "cardiovascular",
      "metabolic",
      "detox",
      "immunity",
      "hormonal",
    ] as const) {
      expect(stages[system]).toBe("healthy");
    }
    expect(stages.endurance).toBe("not_assessed");
    expect(stages.musculoskeletal).toBe("not_assessed");
  });

  it("every member has non-empty reason for every system", () => {
    for (const member of data.members) {
      const result = analyze(member, data);
      expect(result.spectrum).toHaveLength(9);
      for (const entry of result.spectrum) {
        expect(entry.reason.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
