const STYLES: Record<string, string> = {
  report_received: "bg-slate-100 text-slate-700",
  analysed: "bg-sky-100 text-sky-800",
  in_review: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-800",
};

const LABELS: Record<string, string> = {
  report_received: "Report received",
  analysed: "Analysed",
  in_review: "In review",
  approved: "Approved",
};

export function StatusChip({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-slate-100 text-slate-700";
  const label = LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
