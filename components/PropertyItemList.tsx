import Link from "next/link";
import {
  attentionLevelLabel,
  formatDisplayDate,
  itemAttention,
  ukToday,
  type AttentionLevel,
} from "@/lib/attention";
import {
  itemTypeLabel,
  priorityLabel,
  statusLabel,
  type PropertyItem,
} from "@/lib/property-items";

// Same badge colours as the "Needs attention" list; always paired with text.
const badgeClass: Record<AttentionLevel, string> = {
  urgent: "bg-red-700 text-white",
  due_soon: "bg-amber-200 text-amber-950",
  upcoming: "bg-slate-100 text-navy ring-1 ring-slate-200",
  open: "bg-white text-slate-800 ring-1 ring-slate-300",
};

export default function PropertyItemList({
  propertyId,
  items,
}: {
  propertyId: string;
  items: PropertyItem[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-600">No items added yet.</p>;
  }

  const today = ukToday();

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => {
        const attention = itemAttention(item, today);
        return (
          <li key={item.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-navy">{item.title}</p>
                <p className="text-sm text-slate-600">
                  {itemTypeLabel(item.item_type)} · {priorityLabel(item.priority)}{" "}
                  priority · {statusLabel(item.status)}
                  {item.due_date && ` · Due ${formatDisplayDate(item.due_date)}`}
                  {item.review_date && ` · Review ${formatDisplayDate(item.review_date)}`}
                </p>
              </div>
              <Link
                href={`/properties/${propertyId}/items/${item.id}/edit`}
                className="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50"
              >
                Edit
              </Link>
            </div>
            {attention && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass[attention.level]}`}
                >
                  {attentionLevelLabel[attention.level]}
                </span>
                <span>
                  {attention.reason ??
                    (attention.date && attention.dateLabel
                      ? `${attention.dateLabel} ${formatDisplayDate(attention.date)}`
                      : null)}
                </span>
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
