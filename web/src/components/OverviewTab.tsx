import type { SpectrumEntry } from "../types";
import {
  STAGE_LABELS,
  SYSTEM_LABELS,
  stageChipClass,
} from "../lib/systems";

export function OverviewTab({ spectrum }: { spectrum: SpectrumEntry[] }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-800">
          Suggested placement. Doctor decides.
        </p>
        <p className="text-xs text-slate-500">
          Stages are derived from markers and rules; they are not a diagnosis.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {spectrum.map((entry) => (
          <article
            key={entry.system}
            className="rounded-lg border border-slate-200 bg-white p-3"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {SYSTEM_LABELS[entry.system] ?? entry.system}
              </h3>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${stageChipClass(entry.stage)}`}
              >
                {STAGE_LABELS[entry.stage] ?? entry.stage}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              {entry.reason}
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Spectrum legend
        </h3>
        <ul className="grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
          <li>
            <span className={`mr-2 rounded px-2 py-0.5 ${stageChipClass("healthy")}`}>
              Healthy
            </span>
            Markers in optimal range
          </li>
          <li>
            <span
              className={`mr-2 rounded px-2 py-0.5 ${stageChipClass("compensating")}`}
            >
              Compensating
            </span>
            Outside optimal or rule fired
          </li>
          <li>
            <span className={`mr-2 rounded px-2 py-0.5 ${stageChipClass("strained")}`}>
              Strained
            </span>
            Outside lab range
          </li>
          <li>
            <span
              className={`mr-2 rounded px-2 py-0.5 ${stageChipClass("not_assessed")}`}
            >
              Not assessed
            </span>
            No markers in this build
          </li>
          <li className="text-slate-500">
            <span className="mr-2 rounded bg-slate-200 px-2 py-0.5 text-slate-700">
              Diseased
            </span>
            doctor-assessed
          </li>
          <li className="text-slate-500">
            <span className="mr-2 rounded bg-slate-200 px-2 py-0.5 text-slate-700">
              Comorbid
            </span>
            doctor-assessed
          </li>
        </ul>
      </div>
    </div>
  );
}
