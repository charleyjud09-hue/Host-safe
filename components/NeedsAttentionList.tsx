import Link from "next/link";

export type AttentionRow = {
  itemId: string;
  propertyId: string;
  propertyName?: string;
  title: string;
  message: string;
  date: string;
  level: "urgent" | "due_soon" | "review";
};

const levelClass: Record<AttentionRow["level"], string> = {
  urgent: "bg-amber-50 text-amber-950 ring-1 ring-amber-200",
  due_soon: "bg-teal-50 text-slate-800 ring-1 ring-teal-200",
  review: "bg-amber-50 text-amber-950 ring-1 ring-amber-200",
};

export default function NeedsAttentionList({ rows }: { rows: AttentionRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-600">Nothing currently needs attention.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li
          key={row.itemId}
          className={`rounded-xl p-4 ${levelClass[row.level]}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {row.propertyName && (
                <p className="text-sm font-medium">{row.propertyName}</p>
              )}
              <p className="font-medium">{row.title}</p>
              <p className="mt-1 text-sm">{row.message}</p>
              <p className="mt-1 text-sm">
                {new Date(row.date).toLocaleDateString("en-GB")}
              </p>
            </div>
            <Link
              href={`/properties/${row.propertyId}/items/${row.itemId}/edit`}
              className="shrink-0 rounded-lg border border-current px-3 py-1.5 text-sm font-medium hover:opacity-80"
            >
              Open
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
