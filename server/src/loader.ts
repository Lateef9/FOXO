import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import {
  ClusterSchema,
  InterventionSchema,
  InteractionSchema,
  MarkerSchema,
  MemberSchema,
  RuleSchema,
  type AppData,
  type MetaCounts,
  type Rule,
  type RuleCondition,
} from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_DATA_DIR = path.resolve(__dirname, "../data");

function readText(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing data file: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function parseYamlArray<T>(
  filePath: string,
  itemSchema: { parse: (v: unknown) => T },
  label: string,
): T[] {
  const raw = parseYaml(readText(filePath));
  if (!Array.isArray(raw)) {
    throw new Error(`${label}: expected a YAML array in ${filePath}`);
  }
  return raw.map((item, i) => {
    try {
      return itemSchema.parse(item);
    } catch (err) {
      throw new Error(`${label}[${i}] invalid in ${filePath}: ${String(err)}`);
    }
  });
}

function markerCodesFromCondition(cond: RuleCondition): string[] {
  if ("marker" in cond) return [cond.marker];
  if ("count_of" in cond) return cond.count_of;
  return [];
}

export function validateCrossRefs(data: AppData): void {
  const markerCodes = new Set(data.markers.map((m) => m.code));
  const clusterIds = new Set(data.clusters.map((c) => c.id));

  for (const rule of data.rules) {
    if (!clusterIds.has(rule.cluster)) {
      throw new Error(
        `Rule "${rule.id}" references unknown cluster "${rule.cluster}"`,
      );
    }
    for (const cond of rule.all) {
      for (const code of markerCodesFromCondition(cond)) {
        if (!markerCodes.has(code)) {
          throw new Error(
            `Rule "${rule.id}" references unknown marker code "${code}"`,
          );
        }
      }
    }
    for (const code of rule.supporting_markers) {
      if (!markerCodes.has(code)) {
        throw new Error(
          `Rule "${rule.id}" supporting_markers references unknown marker "${code}"`,
        );
      }
    }
  }

  for (const cluster of data.clusters) {
    for (const code of cluster.retest_markers) {
      if (!markerCodes.has(code)) {
        throw new Error(
          `Cluster "${cluster.id}" retest_markers references unknown marker "${code}"`,
        );
      }
    }
  }

  for (const intervention of data.interventions) {
    for (const cluster of intervention.clusters) {
      if (cluster !== "all" && !clusterIds.has(cluster)) {
        throw new Error(
          `Intervention "${intervention.id}" references unknown cluster "${cluster}"`,
        );
      }
    }
  }

  for (const member of data.members) {
    for (const code of Object.keys(member.markers)) {
      if (!markerCodes.has(code)) {
        throw new Error(
          `Member "${member.id}" has marker code not in markers.yaml: "${code}"`,
        );
      }
    }
  }
}

export function metaFromData(data: AppData): MetaCounts {
  const unverified = (source: string) => source === "TODO";
  return {
    markers: data.markers.length,
    rules: data.rules.length,
    clusters: data.clusters.length,
    interventions: data.interventions.length,
    unverified_rules: data.rules.filter((r) => unverified(r.source)).length,
    unverified_interventions: data.interventions.filter((i) =>
      unverified(i.source),
    ).length,
  };
}

export function loadData(dataDir = DEFAULT_DATA_DIR): AppData {
  const markers = parseYamlArray(
    path.join(dataDir, "markers.yaml"),
    MarkerSchema,
    "markers",
  );
  const clusters = parseYamlArray(
    path.join(dataDir, "clusters.yaml"),
    ClusterSchema,
    "clusters",
  );
  const rules = parseYamlArray(
    path.join(dataDir, "rules.yaml"),
    RuleSchema,
    "rules",
  );
  const interventions = parseYamlArray(
    path.join(dataDir, "interventions.yaml"),
    InterventionSchema,
    "interventions",
  );
  const interactions = parseYamlArray(
    path.join(dataDir, "interactions.yaml"),
    InteractionSchema,
    "interactions",
  );

  const membersRaw = JSON.parse(
    readText(path.join(dataDir, "members.json")),
  ) as unknown;
  if (!Array.isArray(membersRaw)) {
    throw new Error("members.json: expected a JSON array");
  }
  const members = membersRaw.map((item, i) => {
    try {
      return MemberSchema.parse(item);
    } catch (err) {
      throw new Error(`members[${i}] invalid: ${String(err)}`);
    }
  });

  const data: AppData = {
    markers,
    clusters,
    rules,
    interventions,
    interactions,
    members,
  };
  validateCrossRefs(data);
  return data;
}

/** Helper for tests: validate a rule set against known marker/cluster ids. */
export function assertRulesValid(
  rules: Rule[],
  markerCodes: string[],
  clusterIds: string[],
): void {
  validateCrossRefs({
    markers: markerCodes.map((code) => ({
      code,
      name: code,
      unit: "u",
      system: "metabolic",
      lab: [0, 1],
      optimal: [0, 1],
    })),
    clusters: clusterIds.map((id) => ({
      id,
      title: id,
      matches_symptoms: [],
      retest_markers: [],
    })),
    rules,
    interventions: [],
    interactions: [],
    members: [],
  });
}
