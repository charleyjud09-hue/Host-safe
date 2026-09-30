import Link from "next/link";
import type { ReactNode } from "react";
import { formatDisplayDate } from "@/lib/attention";
import {
  calendarEntryTypeLabel,
  formatGap,
  isZeroGap,
  shortTime,
  stayNights,
  ZERO_GAP_WARNING,
  type CalendarEntryType,
  type CalendarListEntry,
  type Turnover,
} from "@/lib/calendar";

const svgProps = {
  "aria-hidden": true,
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * Each type has a text label, an icon and its own left-border style
 * (solid, dashed, dotted, double), so colour is never the only signal.
 */
const typeStyle: Record<CalendarEntryType, { border: string; icon: ReactNode }> = {
  guest_stay: {
    border: "border-solid border-action",
    icon: (
      <svg {...svgProps}>
        <path d="M3 18v-6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6" />
        <path d="M3 15h18" />
        <path d="M3 18v2" />
        <path d="M21 18v2" />
      </svg>
    ),
  },
  planned_work: {
    border: "border-dashed border-amber-700",
    icon: (
      <svg {...svgProps}>
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.4 2.4-2.1-.4-.4-2.1z" />
      </svg>
    ),
  },
  planned_cleanup: {
    border: "border-dotted border-sky-700",
    icon: (
      <svg {...svgProps}>
        <path d="M12 3v4" />
        <path d="M12 17v4" />
        <path d="M3 12h4" />
        <path d="M17 12h4" />
        <path d="m6 6 2 2" />
        <path d="m16 16 2 2" />
      </svg>
    ),
  },
  custom_block: {
    border: "border-double border-slate-600",
    icon: (
      <svg {...svgProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="m6.5 6.5 11 11" />
      </svg>
    ),
  },
};

function withTime(date: string, time: string | null): string {
  const t = shortTime(time);
  return t ? `${formatDisplayDate(date)}, ${t}` : formatDisplayDate(date);
}

function dateText(entry: CalendarListEntry): string {
  if (entry.entry_type === "guest_stay") {
    return `${withTime(entry.start_date, entry.arrival_time)} – ${withTime(
      entry.end_date,
      entry.departure_time,
    )}`;
  }
  if (entry.start_date === entry.end_date) return formatDisplayDate(entry.start_date);
  return `${formatDisplayDate(entry.start_date)} – ${formatDisplayDate(entry.end_date)}`;
}

export function turnoverText(t: Turnover): string {
  const base = `Turnover ${withTime(t.date, t.departureTime)}`;
  if (t.gapDays === null || t.nextArrival === null) return base;
  if (t.gapDays === 0) {
    if (t.gapMinutes === null) return `${base} · Same-day turnover`;
    return `${base} · Same-day turnover · ${formatGap(t.gapMinutes)} between check-out and check-in (${t.nextArrivalTime})`;
  }
  const gap =
    t.gapMinutes !== null
      ? formatGap(t.gapMinutes)
      : `${t.gapDays} ${t.gapDays === 1 ? "day" : "days"}`;
  return `${base} · Next arrival ${withTime(t.nextArrival, t.nextArrivalTime)} (${gap} later)`;
}

export function ZeroGapWarning() {
  return (
    <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200">
      <svg {...svgProps} className="mt-0.5 shrink-0">
        <path d="M12 3 2 20h20z" />
        <path d="M12 10v4" />
        <path d="M12 17h.01" />
      </svg>
      <span>
        <span className="font-semibold">Warning:</span> {ZERO_GAP_WARNING}
      </span>
    </p>
  );
}

/**
 * Date-ordered calendar rows: dates first, then a text type label. Never
 * shows a guest name, booking reference or description — those only appear
 * on the entry's own page.
 */
export default function CalendarEntryList({
  propertyId,
  entries,
  turnovers = {},
}: {
  propertyId: string;
  entries: CalendarListEntry[];
  turnovers?: Record<string, Turnover>;
}) {
  return (
    <ul className="space-y-3">
      {entries.map((entry) => {
        const style = typeStyle[entry.entry_type];
        const label = calendarEntryTypeLabel(entry.entry_type);
        const isStay = entry.entry_type === "guest_stay";
        const nights = isStay ? stayNights(entry) : 0;
        const turnover = isStay && entry.status === "planned" ? turnovers[entry.id] : undefined;

        return (
          <li
            key={entry.id}
            className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border-l-4 bg-white py-3 pl-4 pr-3 ring-1 ring-slate-200 ${style.border}`}
          >
            <div className="min-w-0">
              <p className="font-medium text-navy">{dateText(entry)}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-600">
                {style.icon}
                <span className="font-medium text-slate-700">{label}</span>
                {isStay && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      {nights} {nights === 1 ? "night" : "nights"}
                    </span>
                  </>
                )}
                {entry.entry_type === "custom_block" && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      {entry.blocks_guest_stays
                        ? "Blocks guest stays"
                        : "Doesn’t block guest stays"}
                    </span>
                  </>
                )}
                {entry.status === "cancelled" && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="font-medium text-slate-700">Cancelled</span>
                  </>
                )}
              </p>
              {entry.title && (
                <p className="mt-1 break-words text-sm text-slate-800">{entry.title}</p>
              )}
              {turnover && (
                <p className="mt-1 text-sm text-slate-600">{turnoverText(turnover)}</p>
              )}
              {isZeroGap(turnover) && <ZeroGapWarning />}
            </div>
            <Link
              href={`/properties/${propertyId}/calendar/${entry.id}`}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-navy hover:bg-slate-50"
            >
              Open
              <span className="sr-only">
                {" "}
                {label.toLowerCase()} starting {formatDisplayDate(entry.start_date)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
