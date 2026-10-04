import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getAnalysis, getMember } from "../api";
import { FindingsTab } from "../components/FindingsTab";
import { OverviewTab } from "../components/OverviewTab";
import { PlaybookTab } from "../components/PlaybookTab";
import type { AnalysisResult } from "../types";

type Tab = "overview" | "findings" | "playbook";

export function MemberPage() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) || "overview";

  const [name, setName] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getMember(id), getAnalysis(id)])
      .then(([memberRes, analysisRes]) => {
        if (cancelled) return;
        setName(memberRes.member.name);
        setResult(analysisRes.result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load member";
        setError(message);
        setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function setTab(next: Tab) {
    setSearchParams(next === "overview" ? {} : { tab: next });
  }

  return (
    <div className="space-y-4">
      <div>
        <Link to="/" className="text-xs text-sky-700 hover:underline">
          ← Members
        </Link>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{name || id}</h1>
            <p className="text-sm text-slate-600">
              Review spectrum placement and ranked findings.
            </p>
          </div>
          <Link
            to={`/members/${id}/anonymise`}
            className="text-xs text-slate-500 hover:text-sky-700 hover:underline"
          >
            Anonymisation
          </Link>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {(
          [
            ["overview", "Overview"],
            ["findings", "Findings"],
            ["playbook", "Playbook"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === key
                ? "border-b-2 border-sky-700 text-sky-800"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-500">Loading analysis…</p>}

      {error && (
        <div className="space-y-2 rounded border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          <p>{error}</p>
          <p>
            If this member has not been analysed yet,{" "}
            <Link
              className="font-medium text-sky-800 underline"
              to={`/members/${id}/anonymise`}
            >
              confirm anonymisation
            </Link>{" "}
            first.
          </p>
        </div>
      )}

      {!loading && result && tab === "overview" && (
        <OverviewTab spectrum={result.spectrum} />
      )}
      {!loading && result && tab === "findings" && (
        <FindingsTab result={result} />
      )}
      {!loading && result && tab === "playbook" && (
        <PlaybookTab memberId={id} result={result} />
      )}
    </div>
  );
}
