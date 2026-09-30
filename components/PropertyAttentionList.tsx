import Link from "next/link";
import {
  attentionLevelLabel,
  attentionLevelStyle as accent,
  formatDisplayDate,
  NOTHING_NEEDS_ATTENTION,
  type AttentionEntry,
} from "@/lib/attention";

export default function PropertyAttentionList({
  entries,
}: {
  entries: AttentionEntry[];
}) {
  if (entries.length === 0) {
    return <p className="text-slate-700">{NOTHING_NEEDS_ATTENTION}</p>;
  }

  return (
    <ul className="space-y-3">
      {entries.map((e) => (
        <li
          key={e.key}
          className={`rounded-xl p-4 ring-1 ring-slate-200/70 ${accent[e.level].row}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${accent[e.level].badge}`}
                >
                  {attentionLevelLabel[e.level]}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  {e.serviceLabel}
                </span>
              </div>
              <p className="mt-2 font-medium text-navy">{e.title}</p>
              {e.reason && (
                <p className="mt-1 text-sm text-slate-700">{e.reason}</p>
              )}
              <p className="mt-1 text-sm text-slate-600">
                {e.date && e.dateLabel
                  ? `${e.dateLabel} ${formatDisplayDate(e.date)}`
                  : "No due date set"}
              </p>
            </div>
            <Link
              href={e.href}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-navy hover:bg-slate-50"
            >
              Open
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
