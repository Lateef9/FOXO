import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPlaybook, listMembers } from "../api";
import type { PlaybookItem, PlaybookResponse } from "../types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function PrintItem({ item }: { item: PlaybookItem }) {
  const why =
    item.state === "edited" && item.edited_text
      ? item.edited_text
      : (item.why_this ?? "");
  return (
    <li className="break-inside-avoid border-b border-slate-200 py-3">
      <p className="font-semibold text-slate-900">{item.title}</p>
      <p className="text-sm text-slate-600">
        Weeks {item.week_from}–{item.week_to}
        {item.category ? ` · ${item.category}` : ""}
        {item.state ? ` · ${item.state}` : ""}
      </p>
      {why && <p className="mt-1 text-sm text-slate-700">{why}</p>}
      <p className="mt-1 text-xs text-slate-500">
        Source: {item.source ?? "—"} · Evidence:{" "}
        {item.evidence_strength ?? "—"}
      </p>
      {item.requires_doctor_dose && (
        <p className="mt-1 text-xs font-medium text-slate-800">
          Dose set by doctor
        </p>
      )}
      {item.warning && (
        <p className="mt-1 text-xs text-amber-900">Warning: {item.warning}</p>
      )}
    </li>
  );
}

export function PrintPage() {
  const { playbookId = "" } = useParams();
  const [data, setData] = useState<PlaybookResponse | null>(null);
  const [pseudoId, setPseudoId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPlaybook(playbookId)
      .then(async (pb) => {
        const members = await listMembers();
        if (cancelled) return;
        const member = members.find((m) => m.id === pb.playbook.member_id);
        setData(pb);
        setPseudoId(member?.pseudo_id ?? pb.playbook.member_id);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [playbookId]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-red-700">{error}</p>
        <Link to="/" className="mt-2 inline-block text-sm text-sky-700">
          ← Members
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-500">
        Loading print view…
      </div>
    );
  }

  const items = [...data.items]
    .filter((i) => i.state !== "rejected")
    .sort(
      (a, b) =>
        (a.week_from ?? 0) - (b.week_from ?? 0) ||
        (a.title ?? "").localeCompare(b.title ?? ""),
    );

  const doctor = data.playbook.approved_by ?? "—";
  const when = formatDate(data.playbook.approved_at);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-slate-900">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to={`/members/${data.playbook.member_id}?tab=playbook`} className="text-sm text-sky-700">
          ← Back to playbook
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          Print
        </button>
      </div>

      <header className="mb-6 border-b border-slate-300 pb-4">
        <h1 className="text-xl font-semibold">12-week playbook</h1>
        <p className="mt-1 text-sm text-slate-600">Member: {pseudoId}</p>
        <p className="text-sm text-slate-600">
          Reviewed by {doctor} on {when}
        </p>
      </header>

      <ol className="list-none space-y-0 p-0">
        {items.map((item) => (
          <PrintItem key={item.id} item={item} />
        ))}
      </ol>
    </div>
  );
}
