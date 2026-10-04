import { SYSTEMS } from "../types.js";
import type { ClassifiedMarker } from "./classify.js";
import type { Finding } from "./rules.js";

export type SpectrumStage =
  | "not_assessed"
  | "healthy"
  | "compensating"
  | "strained";

export type SpectrumEntry = {
  system: (typeof SYSTEMS)[number];
  stage: SpectrumStage;
  reason: string;
};

export function placeSpectrum(
  classified: ClassifiedMarker[],
  findings: Finding[],
  dictionarySystems: Iterable<string>,
): SpectrumEntry[] {
  const systemsWithMarkers = new Set(dictionarySystems);
  const bySystem = new Map<string, ClassifiedMarker[]>();
  for (const m of classified) {
    const list = bySystem.get(m.system) ?? [];
    list.push(m);
    bySystem.set(m.system, list);
  }
  const rulesBySystem = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = rulesBySystem.get(f.system) ?? [];
    list.push(f);
    rulesBySystem.set(f.system, list);
  }

  return SYSTEMS.map((system) => {
    if (!systemsWithMarkers.has(system)) {
      return {
        system,
        stage: "not_assessed" as const,
        reason: "No markers in this build for this system.",
      };
    }

    const markers = bySystem.get(system) ?? [];
    const systemFindings = rulesBySystem.get(system) ?? [];

    const labOut = markers.filter(
      (m) => m.status === "below_lab" || m.status === "above_lab",
    );
    if (labOut.length > 0) {
      return {
        system,
        stage: "strained" as const,
        reason: `Outside lab range: ${labOut.map((m) => m.code).join(", ")}.`,
      };
    }

    const optOut = markers.filter(
      (m) => m.status === "below_optimal" || m.status === "above_optimal",
    );
    if (optOut.length > 0 || systemFindings.length > 0) {
      const parts: string[] = [];
      if (optOut.length > 0) {
        parts.push(`Outside optimal: ${optOut.map((m) => m.code).join(", ")}`);
      }
      if (systemFindings.length > 0) {
        parts.push(
          `Rules: ${systemFindings.map((f) => f.rule_id).join(", ")}`,
        );
      }
      return {
        system,
        stage: "compensating" as const,
        reason: `${parts.join("; ")}.`,
      };
    }

    return {
      system,
      stage: "healthy" as const,
      reason: "All assessed markers in optimal range; no rules fired.",
    };
  });
}

export function stageSeverity(stage: SpectrumStage): number {
  if (stage === "strained") return 2;
  if (stage === "compensating") return 1;
  return 0;
}

/** Systems that have at least one marker definition in the dictionary. */
export function systemsPresentInDictionary(
  markers: { system: string }[],
): Set<string> {
  return new Set(markers.map((m) => m.system));
}
