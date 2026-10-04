import type { Marker, MarkerStatus } from "../types.js";

export type ClassifiedMarker = {
  code: string;
  value: number;
  unit: string;
  system: Marker["system"];
  status: MarkerStatus;
  name: string;
};

/**
 * Inclusive boundaries:
 * value < lab_low → below_lab
 * value > lab_high → above_lab
 * within lab, value < opt_low → below_optimal
 * within lab, value > opt_high → above_optimal
 * otherwise → optimal
 */
export function classifyMarker(value: number, marker: Marker): MarkerStatus {
  const [labLow, labHigh] = marker.lab;
  const [optLow, optHigh] = marker.optimal;

  if (value < labLow) return "below_lab";
  if (value > labHigh) return "above_lab";
  if (value < optLow) return "below_optimal";
  if (value > optHigh) return "above_optimal";
  return "optimal";
}

export function classifyAll(
  markers: Record<string, number>,
  dictionary: Marker[],
): ClassifiedMarker[] {
  const byCode = new Map(dictionary.map((m) => [m.code, m]));
  const result: ClassifiedMarker[] = [];

  for (const [code, value] of Object.entries(markers)) {
    const def = byCode.get(code);
    if (!def) continue;
    result.push({
      code,
      value,
      unit: def.unit,
      system: def.system,
      name: def.name,
      status: classifyMarker(value, def),
    });
  }

  return result;
}
