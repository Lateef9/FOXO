import type { Cluster, Rule } from "../types.js";
import type { ClassifiedMarker } from "./classify.js";
import type { Finding } from "./rules.js";
import {
  stageSeverity,
  type SpectrumEntry,
  type SpectrumStage,
} from "./spectrum.js";

export type RankedCluster = {
  id: string;
  title: string;
  rule_ids: string[];
  severity: number;
  reversibility: number;
  findings: string[];
  symptom_multiplier: number;
  score: number;
  matches_symptoms: string[];
  retest_markers: string[];
};

function markersFromRule(rule: Rule): string[] {
  const codes = new Set<string>();
  for (const cond of rule.all) {
    if ("marker" in cond) codes.add(cond.marker);
    if ("count_of" in cond) for (const c of cond.count_of) codes.add(c);
  }
  for (const code of rule.supporting_markers) codes.add(code);
  return [...codes];
}

export function rankClusters(
  findings: Finding[],
  rules: Rule[],
  clusters: Cluster[],
  classified: ClassifiedMarker[],
  spectrum: SpectrumEntry[],
  symptoms: string[],
): RankedCluster[] {
  const rulesById = new Map(rules.map((r) => [r.id, r]));
  const statusByCode = new Map(classified.map((c) => [c.code, c.status]));
  const stageBySystem = new Map(spectrum.map((s) => [s.system, s.stage]));

  const findingsByCluster = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = findingsByCluster.get(f.cluster) ?? [];
    list.push(f);
    findingsByCluster.set(f.cluster, list);
  }

  const ranked: RankedCluster[] = [];

  for (const cluster of clusters) {
    const fired = findingsByCluster.get(cluster.id) ?? [];
    if (fired.length === 0) continue;

    const firedRules = fired
      .map((f) => rulesById.get(f.rule_id))
      .filter((r): r is Rule => Boolean(r));

    let severity = 0;
    for (const rule of firedRules) {
      const stage = (stageBySystem.get(rule.system) ??
        "healthy") as SpectrumStage;
      severity = Math.max(severity, stageSeverity(stage));
    }

    const reversibility = Math.max(
      ...firedRules.map((r) => r.reversibility),
      0,
    );

    const findingMarkers = new Set<string>();
    for (const rule of firedRules) {
      for (const code of markersFromRule(rule)) {
        const status = statusByCode.get(code);
        if (status && status !== "optimal") findingMarkers.add(code);
      }
    }
    const findingList = [...findingMarkers];

    const symptom_multiplier = symptoms.some((s) =>
      cluster.matches_symptoms.includes(s),
    )
      ? 3
      : 1;

    const score =
      severity * reversibility * findingList.length * symptom_multiplier;

    ranked.push({
      id: cluster.id,
      title: cluster.title,
      rule_ids: fired.map((f) => f.rule_id),
      severity,
      reversibility,
      findings: findingList,
      symptom_multiplier,
      score,
      matches_symptoms: cluster.matches_symptoms,
      retest_markers: cluster.retest_markers,
    });
  }

  // Score desc; on ties prefer symptom match (needed for Arjun §8),
  // then reversibility, then severity.
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.symptom_multiplier !== a.symptom_multiplier) {
      return b.symptom_multiplier - a.symptom_multiplier;
    }
    if (b.reversibility !== a.reversibility) {
      return b.reversibility - a.reversibility;
    }
    if (b.severity !== a.severity) return b.severity - a.severity;
    return a.id.localeCompare(b.id);
  });

  return ranked.slice(0, 5);
}
