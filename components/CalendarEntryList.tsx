import Link from "next/link";
import { formatDisplayDate } from "@/lib/attention";
import { stayNights, type CalendarListEntry } from "@/lib/calendar";

/**
 * Date-ordered calendar rows: dates first, then a text type label. Never
 * shows a guest name, booking reference or any other entry detail — those
 * only appear on the entry's own page.
 */
export default function CalendarEntryList({
  propertyId,
  entries,
}: {
  propertyId: string;
  entries: CalendarListEntry[];
}) {
  return (
    <ul className="space-y-3">
      {entries.map((entry) => {
        const nights = stayNights(entry);
        return (
          <li
            key={entry.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border-l-4 border-action bg-white py-3 pl-4 pr-3 ring-1 ring-slate-200"
          >
            <div className="min-w-0">
              <p className="font-medium text-navy">
                {formatDisplayDate(entry.start_date)} –{" "}
                {formatDisplayDate(entry.end_date)}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-600">
                <svg
                  aria-hidden
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 18v-6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6" />
                  <path d="M3 15h18" />
                  <path d="M3 18v2" />
                  <path d="M21 18v2" />
                </svg>
                <span>Guest stay</span>
                <span aria-hidden>·</span>
                <span>
                  {nights} {nights === 1 ? "night" : "nights"}
                </span>
                {entry.status === "cancelled" && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="font-medium text-slate-700">Cancelled</span>
                  </>
                )}
              </p>
            </div>
            <Link
              href={`/properties/${propertyId}/calendar/${entry.id}`}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-navy hover:bg-slate-50"
            >
              Open
              <span className="sr-only">
                {" "}
                guest stay arriving {formatDisplayDate(entry.start_date)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
