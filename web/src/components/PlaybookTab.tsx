import { Link } from "react-router-dom";
import { usePlaybook } from "../hooks/usePlaybook";
import type { AnalysisResult, UnscheduledItem } from "../types";
import { PlaybookItemCard } from "./PlaybookItemCard";
import { WeekTimeline } from "./WeekTimeline";

function asUnscheduled(raw: unknown): UnscheduledItem[] {
  return Array.isArray(raw) ? (raw as UnscheduledItem[]) : [];
}

export function PlaybookTab({
  memberId,
  result,
}: {
  memberId: string;
  result: AnalysisResult;
}) {
  const { data, loading, busy, error, onDraft, onDecide, onApprove } =
    usePlaybook(memberId);

  const clusterTitle = new Map(
    result.clusters.map((c) => [c.id, c.title] as const),
  );

  if (loading) {
    return <p className="text-sm text-slate-500">Loading playbook…</p>;
  }

  if (!data) {
    return (
      <div className="space-y-3 rounded border border-slate-200 bg-white px-3 py-4">
        <p className="text-sm text-slate-600">
          Draft a 12-week playbook from the latest analysis.
        </p>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onDraft()}
          className="rounded bg-sky-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Drafting…" : "Draft playbook"}
        </button>
      </div>
    );
  }

  const pending = data.items.filter((i) => i.state === "pending").length;
  const locked = data.playbook.status === "approved";
  const unscheduled = asUnscheduled(data.playbook.unscheduled);
  const sorted = [...data.items].sort(
    (a, b) =>
      (a.week_from ?? 0) - (b.week_from ?? 0) ||
      (a.title ?? "").localeCompare(b.title ?? ""),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-800">
            Status: {locked ? "Approved" : "In review"}
          </p>
          <p className="text-xs text-slate-500">
            Review every item before approving.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {locked && (
            <Link
              to={`/print/${data.playbook.id}`}
              className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-white"
            >
              Open print view
            </Link>
          )}
          <button
            type="button"
            disabled={busy || locked || pending > 0}
            onClick={() => void onApprove()}
            className="rounded bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {locked
              ? "Approved"
              : pending > 0
                ? `Approve (${pending} pending)`
                : "Approve"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <WeekTimeline items={data.items} />

      <div className="space-y-3">
        {sorted.map((item) => (
          <PlaybookItemCard
            key={item.id}
            item={item}
            findingLabel={
              !item.cluster
                ? "—"
                : item.cluster === "all"
                  ? "All findings"
                  : (clusterTitle.get(item.cluster) ?? item.cluster)
            }
            locked={locked}
            busy={busy}
            onDecide={(state, edited_text) =>
              onDecide(item.id, state, edited_text)
            }
          />
        ))}
      </div>

      {unscheduled.length > 0 && (
        <section className="rounded border border-slate-200 bg-slate-50 p-3">
          <h3 className="text-sm font-semibold text-slate-800">Not scheduled</h3>
          <ul className="mt-2 space-y-2">
            {unscheduled.map((item) => (
              <li key={item.item_key} className="text-sm text-slate-700">
                <span className="font-medium">{item.title}</span>
                <span className="text-xs text-slate-500">
                  {" "}
                  · {item.category} · {item.source}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
