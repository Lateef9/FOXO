import { useState } from "react";
import type { PlaybookItem, PlaybookItemState } from "../types";

type Props = {
  item: PlaybookItem;
  findingLabel: string;
  locked: boolean;
  busy: boolean;
  onDecide: (
    state: PlaybookItemState,
    edited_text?: string,
  ) => Promise<void>;
};

function UnverifiedBadge() {
  return (
    <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      Unverified source
    </span>
  );
}

export function PlaybookItemCard({
  item,
  findingLabel,
  locked,
  busy,
  onDecide,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.edited_text ?? item.why_this ?? "");

  const displayWhy =
    item.state === "edited" && item.edited_text
      ? item.edited_text
      : (item.why_this ?? "");

  async function saveEdit() {
    const text = draft.trim();
    if (!text) return;
    await onDecide("edited", text);
    setEditing(false);
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
          <p className="text-xs text-slate-500">
            Weeks {item.week_from}–{item.week_to}
            {item.category ? ` · ${item.category}` : ""}
          </p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-700">
          {item.state}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-600">
        Finding: <span className="font-medium">{findingLabel}</span>
      </p>
      <p className="mt-1 text-sm text-slate-700">{displayWhy}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>Evidence: {item.evidence_strength ?? "—"}</span>
        <span>·</span>
        <span>Source: {item.source ?? "—"}</span>
        {item.source === "TODO" && <UnverifiedBadge />}
        {item.wording_source === "template" && (
          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-700">
            template
          </span>
        )}
      </div>

      {item.requires_doctor_dose && (
        <p className="mt-2 text-xs font-medium text-amber-800">
          Dose set by doctor
        </p>
      )}

      {item.warning && (
        <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-950">
          {item.warning}
        </p>
      )}

      {!locked && (
        <div className="mt-3 flex flex-wrap gap-2">
          {editing ? (
            <>
              <textarea
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveEdit()}
                className="rounded bg-sky-700 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
              >
                Save edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(false)}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDecide("accepted")}
                className="rounded bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
              >
                Accept
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setDraft(item.edited_text ?? item.why_this ?? "");
                  setEditing(true);
                }}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium disabled:opacity-50"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDecide("rejected")}
                className="rounded border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}
