import type { AppData, Member } from "../types.js";
import { classifyAll, type ClassifiedMarker } from "./classify.js";
import { rankClusters, type RankedCluster } from "./cluster.js";
import { evaluateRules, type Finding } from "./rules.js";
import {
  placeSpectrum,
  systemsPresentInDictionary,
  type SpectrumEntry,
} from "./spectrum.js";

export type AnalysisResult = {
  classified: ClassifiedMarker[];
  findings: Finding[];
  spectrum: SpectrumEntry[];
  clusters: RankedCluster[];
};

export function analyze(member: Member, data: AppData): AnalysisResult {
  const classified = classifyAll(member.markers, data.markers);
  const findings = evaluateRules(classified, member.symptoms, data.rules);
  const spectrum = placeSpectrum(
    classified,
    findings,
    systemsPresentInDictionary(data.markers),
  );
  const clusters = rankClusters(
    findings,
    data.rules,
    data.clusters,
    classified,
    spectrum,
    member.symptoms,
  );

  return { classified, findings, spectrum, clusters };
}
