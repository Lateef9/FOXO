import { describe, expect, it } from "vitest";
import { classifyAll, classifyMarker } from "../src/engine/classify.js";
import { evaluateRules, type Finding } from "../src/engine/rules.js";
import { loadData } from "../src/loader.js";
import type { Marker, MarkerStatus, Rule } from "../src/types.js";

const sampleMarker: Marker = {
  code: "demo",
  name: "Demo",
  unit: "u",
  system: "metabolic",
  lab: [10, 20],
  optimal: [12, 18],
};

function cm(code: string, status: MarkerStatus) {
  return {
    code,
    value: 0,
    unit: "u",
    system: "metabolic" as const,
    name: code,
    status,
  };
}

function ruleById(rules: Rule[], id: string): Rule {
  const rule = rules.find((r) => r.id === id);
  if (!rule) throw new Error(`missing rule ${id}`);
  return rule;
}

function firedIds(
  classified: ReturnType<typeof cm>[],
  symptoms: string[],
  rules: Rule[],
): string[] {
  return evaluateRules(classified, symptoms, rules).map((f) => f.rule_id);
}

describe("classifyMarker boundaries (inclusive)", () => {
  it("classifies exact lab and optimal edges", () => {
    expect(classifyMarker(10, sampleMarker)).toBe("below_optimal"); // lab_low inclusive → within lab, < opt_low
    expect(classifyMarker(20, sampleMarker)).toBe("above_optimal"); // lab_high inclusive → within lab, > opt_high
    expect(classifyMarker(12, sampleMarker)).toBe("optimal"); // opt_low inclusive
    expect(classifyMarker(18, sampleMarker)).toBe("optimal"); // opt_high inclusive
    expect(classifyMarker(9.999, sampleMarker)).toBe("below_lab");
    expect(classifyMarker(20.001, sampleMarker)).toBe("above_lab");
    expect(classifyMarker(11, sampleMarker)).toBe("below_optimal");
    expect(classifyMarker(19, sampleMarker)).toBe("above_optimal");
    expect(classifyMarker(15, sampleMarker)).toBe("optimal");
  });

  it("classifyAll skips unknown codes and classifies known ones", () => {
    const dict: Marker[] = [
      { ...sampleMarker, code: "a", lab: [0, 10], optimal: [2, 8] },
    ];
    const out = classifyAll({ a: 5, unknown: 99 }, dict);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ code: "a", status: "optimal", value: 5 });
  });
});

describe("evaluateRules — missing marker", () => {
  it("treats a missing marker condition as false and does not throw", () => {
    const rule: Rule = {
      id: "needs_missing",
      title: "Needs missing",
      system: "metabolic",
      cluster: "insulin_resistance",
      reversibility: 1,
      all: [{ marker: "absent_marker", status_in: ["optimal"] }],
      supporting_markers: [],
      inference: "x",
      evidence_strength: "TODO",
      source: "TODO",
    };
    expect(() => evaluateRules([cm("glucose_fasting", "optimal")], [], [rule])).not.toThrow();
    expect(evaluateRules([cm("glucose_fasting", "optimal")], [], [rule])).toEqual([]);
  });
});

describe("evaluateRules — positive and negative per rule", () => {
  const data = loadData();
  const rules = data.rules;

  it("functional_b12 positive and negative", () => {
    const rule = ruleById(rules, "functional_b12");
    const positive = [
      cm("b12", "optimal"),
      cm("homocysteine", "above_optimal"),
    ];
    const negative = [
      cm("b12", "optimal"),
      cm("homocysteine", "optimal"),
    ];
    expect(firedIds(positive, [], [rule])).toEqual(["functional_b12"]);
    expect(firedIds(negative, [], [rule])).toEqual([]);
  });

  it("early_insulin_resistance positive and negative", () => {
    const rule = ruleById(rules, "early_insulin_resistance");
    const positive = [
      cm("glucose_fasting", "optimal"),
      cm("insulin_fasting", "above_optimal"),
    ];
    const negative = [
      cm("glucose_fasting", "optimal"),
      cm("insulin_fasting", "optimal"),
    ];
    expect(firedIds(positive, [], [rule])).toEqual(["early_insulin_resistance"]);
    expect(firedIds(negative, [], [rule])).toEqual([]);
  });

  it("tg_hdl_pattern positive and negative", () => {
    const rule = ruleById(rules, "tg_hdl_pattern");
    const positive = [
      cm("triglycerides", "above_lab"),
      cm("hdl", "below_optimal"),
    ];
    const negative = [
      cm("triglycerides", "above_optimal"),
      cm("hdl", "optimal"),
    ];
    expect(firedIds(positive, [], [rule])).toEqual(["tg_hdl_pattern"]);
    expect(firedIds(negative, [], [rule])).toEqual([]);
  });

  it("ferritin_inflammation positive and negative", () => {
    const rule = ruleById(rules, "ferritin_inflammation");
    const positive = [
      cm("ferritin", "above_optimal"),
      cm("hscrp", "above_lab"),
    ];
    const negative = [
      cm("ferritin", "above_optimal"),
      cm("hscrp", "above_optimal"),
    ];
    expect(firedIds(positive, [], [rule])).toEqual(["ferritin_inflammation"]);
    expect(firedIds(negative, [], [rule])).toEqual([]);
  });

  it("chronic_low_grade_inflammation positive and negative", () => {
    const rule = ruleById(rules, "chronic_low_grade_inflammation");
    const classified = [
      cm("hscrp", "above_lab"),
      cm("wbc", "optimal"),
    ];
    expect(firedIds(classified, ["no_infection"], [rule])).toEqual([
      "chronic_low_grade_inflammation",
    ]);
    expect(firedIds(classified, [], [rule])).toEqual([]);
  });

  it("micronutrient_pattern positive and negative", () => {
    const rule = ruleById(rules, "micronutrient_pattern");
    const positive = [
      cm("ferritin", "below_lab"),
      cm("b12", "below_optimal"),
      cm("vitamin_d", "below_lab"),
      cm("zinc", "optimal"),
      cm("magnesium_rbc", "optimal"),
    ];
    const negative = [
      cm("ferritin", "below_lab"),
      cm("b12", "below_optimal"),
      cm("vitamin_d", "optimal"),
      cm("zinc", "optimal"),
      cm("magnesium_rbc", "optimal"),
    ];
    expect(firedIds(positive, ["bloating"], [rule])).toEqual([
      "micronutrient_pattern",
    ]);
    expect(firedIds(negative, ["bloating"], [rule])).toEqual([]);
    expect(firedIds(positive, [], [rule])).toEqual([]);
  });
});

describe("Meera smoke", () => {
  it("fires functional_b12 and early_insulin_resistance; not tg_hdl_pattern", () => {
    const data = loadData();
    const meera = data.members.find((m) => m.id === "m1");
    expect(meera).toBeTruthy();

    const classified = classifyAll(meera!.markers, data.markers);
    const findings: Finding[] = evaluateRules(
      classified,
      meera!.symptoms,
      data.rules,
    );
    const ids = findings.map((f) => f.rule_id);

    expect(ids).toContain("functional_b12");
    expect(ids).toContain("early_insulin_resistance");
    expect(ids).not.toContain("tg_hdl_pattern");
  });
});
