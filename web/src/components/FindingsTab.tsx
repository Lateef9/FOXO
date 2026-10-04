import { useState } from "react";
import type {
  AnalysisResult,
  ClassifiedMarker,
  Finding,
} from "../types";

function UnverifiedBadge() {
  return (
    <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      Unverified source
    </span>
  );
}

function TemplateTag() {
  return (
    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-700">
      template
    </span>
  );
}

function markerLookup(classified: ClassifiedMarker[]) {
  return new Map(classified.map((m) => [m.code, m]));
}

function ReasoningChain({
  findings,
  classified,
}: {
  findings: Finding[];
  classified: ClassifiedMarker[];
}) {
  const byCode = markerLookup(classified);
  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      {findings.map((finding) => (
        <div key={finding.rule_id} className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900">{finding.title}</p>
            {finding.source === "TODO" && <UnverifiedBadge />}
          </div>
          <p className="text-slate-600">{finding.inference}</p>
          <p className="text-xs text-slate-500">
            Evidence: {finding.evidence_strength} · Source: {finding.source}
          </p>
          <ul className="space-y-1 rounded bg-slate-50 p-2 text-xs text-slate-700">
            {finding.markers_involved.map((code) => {
              const m = byCode.get(code);
              if (!m) {
                return (
                  <li key={code} className="font-mono">
                    {code}
                  </li>
                );
              }
              return (
                <li key={code}>
                  <span className="font-medium">{m.name}</span>: {m.value}{" "}
                  {m.unit}{" "}
                  <span className="text-slate-500">({m.status})</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function FindingsTab({ result }: { result: AnalysisResult }) {
  const [openId, setOpenId] = useState<string | null>(
    result.clusters[0]?.id ?? null,
  );
  const wordingById = new Map(
    (result.wording?.clusters ?? []).map((c) => [c.cluster_id, c]),
  );

  if (result.clusters.length === 0) {
    return (
      <p className="text-sm text-slate-500">No ranked findings for this member.</p>
    );
  }

  return (
    <div className="space-y-3">
      {result.clusters.map((cluster, index) => {
        const wording = wordingById.get(cluster.id);
        const clusterFindings = result.findings.filter(
          (f) => f.cluster === cluster.id,
        );
        const unverified = clusterFindings.some((f) => f.source === "TODO");
        const open = openId === cluster.id;

        return (
          <article
            key={cluster.id}
            className="rounded-lg border border-slate-200 bg-white"
          >
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
              onClick={() => setOpenId(open ? null : cluster.id)}
              aria-expanded={open}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    #{index + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {cluster.title}
                  </h3>
                  {unverified && <UnverifiedBadge />}
                  {wording?.wording_source === "template" && <TemplateTag />}
                </div>
                <p className="text-sm text-slate-600">
                  {wording?.doctor_summary ??
                    clusterFindings[0]?.inference ??
                    cluster.title}
                </p>
              </div>
              <span className="text-xs text-slate-400">{open ? "Hide" : "Show"}</span>
            </button>
            {open && (
              <div className="px-4 pb-4">
                <ReasoningChain
                  findings={clusterFindings}
                  classified={result.classified}
                />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
