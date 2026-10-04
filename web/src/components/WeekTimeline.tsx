import type { PlaybookItem } from "../types";

export function WeekTimeline({ items }: { items: PlaybookItem[] }) {
  const byWeek = Array.from({ length: 12 }, (_, i) => {
    const week = i + 1;
    return {
      week,
      items: items.filter((item) => item.week_from === week),
    };
  });

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-12 gap-1">
        {byWeek.map(({ week, items: weekItems }) => (
          <div
            key={week}
            className="min-h-24 rounded border border-slate-200 bg-white p-1.5"
          >
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              W{week}
            </p>
            <ul className="space-y-1">
              {weekItems.map((item) => (
                <li
                  key={item.id}
                  className="rounded bg-sky-50 px-1 py-0.5 text-[10px] leading-snug text-sky-900"
                  title={item.title ?? undefined}
                >
                  {item.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
