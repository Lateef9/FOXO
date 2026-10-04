import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { analyzeMember, getAnonymisation } from "../api";
import type { AnonymisationResponse, RemovedItem } from "../types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightOriginal(text: string, removed: RemovedItem[]): ReactNode[] {
  const uniques = [...new Set(removed.map((r) => r.original).filter(Boolean))];
  if (uniques.length === 0) return [text];

  const pattern = uniques
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");
  const re = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(re);

  return parts.map((part, i) => {
    const hit = uniques.some((u) => u.toLowerCase() === part.toLowerCase());
    if (hit) {
      return (
        <mark
          key={`${part}-${i}`}
          className="rounded bg-amber-200 px-0.5 text-amber-950"
        >
          {part}
        </mark>
      );
    }
    return <span key={`${part}-${i}`}>{part}</span>;
  });
}

function highlightClean(text: string): ReactNode[] {
  const parts = text.split(/(\[(?:NAME|CITY|EMAIL|PHONE|DATE)\])/g);
  return parts.map((part, i) => {
    if (/^\[(?:NAME|CITY|EMAIL|PHONE|DATE)\]$/.test(part)) {
      return (
        <mark
          key={`${part}-${i}`}
          className="rounded bg-emerald-100 px-0.5 font-medium text-emerald-900"
        >
          {part}
        </mark>
      );
    }
    return <span key={`${part}-${i}`}>{part}</span>;
  });
}

export function AnonymisePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AnonymisationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAnonymisation(id)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load anonymisation",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const originalNodes = useMemo(
    () => (data ? highlightOriginal(data.original, data.removed) : null),
    [data],
  );
  const cleanNodes = useMemo(
    () => (data ? highlightClean(data.clean) : null),
    [data],
  );

  async function onConfirm() {
    setConfirming(true);
    setError(null);
    try {
      await analyzeMember(id);
      navigate(`/members/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analyse failed");
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-xs text-sky-700 hover:underline">
            ← Members
          </Link>
          <h1 className="mt-1 text-xl font-semibold">Anonymisation check</h1>
          <p className="text-sm text-slate-600">
            Confirm the cleaned history before analysis. Only the cleaned version
            may reach the LLM.
          </p>
        </div>
        {data && (
          <p className="rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            pseudo_id{" "}
            <span className="font-mono font-medium text-slate-900">
              {data.pseudo_id}
            </span>
          </p>
        )}
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold">Original</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {originalNodes}
              </p>
            </section>
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold">Clean (to LLM)</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {cleanNodes}
              </p>
            </section>
          </div>

          {data.removed.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold">Removed</h2>
              <ul className="flex flex-wrap gap-2 text-xs">
                {data.removed.map((r, i) => (
                  <li
                    key={`${r.type}-${r.original}-${i}`}
                    className="rounded bg-slate-100 px-2 py-1 text-slate-700"
                  >
                    <span className="font-medium uppercase">{r.type}</span>:{" "}
                    {r.original}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={confirming}
              onClick={onConfirm}
              className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirming ? "Analysing…" : "Confirm and analyse"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
