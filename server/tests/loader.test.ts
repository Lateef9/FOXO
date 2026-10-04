import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertRulesValid,
  loadData,
  metaFromData,
  validateCrossRefs,
} from "../src/loader.js";
import type { AppData, Rule } from "../src/types.js";

describe("loader", () => {
  it("loads and validates the real server/data files", () => {
    const data = loadData();
    const meta = metaFromData(data);

    expect(meta.markers).toBe(20);
    expect(meta.rules).toBe(6);
    expect(meta.clusters).toBe(4);
    expect(meta.interventions).toBe(19);
    expect(meta.unverified_rules).toBeGreaterThan(0);
    expect(meta.unverified_interventions).toBeGreaterThan(0);
  });

  it("rejects a rule that references an unknown marker code", () => {
    const badRule: Rule = {
      id: "bad_rule",
      title: "Bad",
      system: "metabolic",
      cluster: "insulin_resistance",
      reversibility: 1,
      all: [{ marker: "fake_marker", status_in: ["above_lab"] }],
      supporting_markers: [],
      inference: "test",
      evidence_strength: "TODO",
      source: "TODO",
    };

    expect(() =>
      assertRulesValid(
        [badRule],
        ["glucose_fasting"],
        ["insulin_resistance"],
      ),
    ).toThrow(/unknown marker code "fake_marker"/);
  });

  it("rejects a rule that references an unknown cluster", () => {
    const data = loadData();
    const bad: AppData = {
      ...data,
      rules: [
        {
          ...data.rules[0],
          id: "orphan_cluster_rule",
          cluster: "not_a_real_cluster",
        },
      ],
    };
    expect(() => validateCrossRefs(bad)).toThrow(/unknown cluster/);
  });

  it("rejects a member marker code missing from markers.yaml", () => {
    const data = loadData();
    const bad: AppData = {
      ...data,
      members: [
        {
          ...data.members[0],
          markers: { ...data.members[0].markers, not_a_marker: 1 },
        },
      ],
    };
    expect(() => validateCrossRefs(bad)).toThrow(/not in markers.yaml/);
  });

  it("refuses to load a temp data dir when a rule uses fake_marker", () => {
    const src = path.resolve(import.meta.dirname, "../data");
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "primer-data-"));
    for (const name of fs.readdirSync(src)) {
      fs.copyFileSync(path.join(src, name), path.join(tmp, name));
    }
    const rulesPath = path.join(tmp, "rules.yaml");
    const text = fs.readFileSync(rulesPath, "utf8");
    fs.writeFileSync(
      rulesPath,
      text.replace("marker: b12", "marker: fake_marker"),
      "utf8",
    );

    expect(() => loadData(tmp)).toThrow(/unknown marker code "fake_marker"/);
  });
});
