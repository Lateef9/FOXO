import type { MarkerStatus, Rule, RuleCondition } from "../types.js";
import type { ClassifiedMarker } from "./classify.js";

export type Finding = {
  rule_id: string;
  title: string;
  system: Rule["system"];
  cluster: string;
  inference: string;
  markers_involved: string[];
  evidence_strength: string;
  source: string;
};

function statusMap(classified: ClassifiedMarker[]): Map<string, MarkerStatus> {
  return new Map(classified.map((c) => [c.code, c.status]));
}

function conditionTrue(
  cond: RuleCondition,
  statuses: Map<string, MarkerStatus>,
  symptoms: string[],
): boolean {
  if ("marker" in cond) {
    const status = statuses.get(cond.marker);
    if (!status) return false;
    return cond.status_in.includes(status);
  }

  if ("count_of" in cond) {
    let count = 0;
    for (const code of cond.count_of) {
      const status = statuses.get(code);
      if (status && cond.status_in.includes(status)) count += 1;
    }
    return count >= cond.min;
  }

  if ("symptom_any" in cond) {
    return cond.symptom_any.some((s) => symptoms.includes(s));
  }

  return false;
}

function markersInvolved(rule: Rule): string[] {
  const codes = new Set<string>();
  for (const cond of rule.all) {
    if ("marker" in cond) codes.add(cond.marker);
    if ("count_of" in cond) for (const c of cond.count_of) codes.add(c);
  }
  for (const code of rule.supporting_markers) codes.add(code);
  return [...codes];
}

export function evaluateRules(
  classified: ClassifiedMarker[],
  symptoms: string[],
  rules: Rule[],
): Finding[] {
  const statuses = statusMap(classified);
  const findings: Finding[] = [];

  for (const rule of rules) {
    const fires = rule.all.every((cond) =>
      conditionTrue(cond, statuses, symptoms),
    );
    if (!fires) continue;

    findings.push({
      rule_id: rule.id,
      title: rule.title,
      system: rule.system,
      cluster: rule.cluster,
      inference: rule.inference,
      markers_involved: markersInvolved(rule),
      evidence_strength: rule.evidence_strength,
      source: rule.source,
    });
  }

  return findings;
}
