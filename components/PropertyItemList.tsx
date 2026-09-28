import Link from "next/link";
import {
  getAttentionReason,
  itemTypeLabel,
  priorityLabel,
  statusLabel,
  type PropertyItem,
} from "@/lib/property-items";

const levelClass: Record<string, string> = {
  urgent: "bg-amber-50 text-amber-950 ring-1 ring-amber-200",
  due_soon: "bg-teal-50 text-slate-800 ring-1 ring-teal-200",
  review: "bg-amber-50 text-amber-950 ring-1 ring-amber-200",
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

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => {
        const attention = getAttentionReason(item);
        return (
          <li key={item.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-navy">{item.title}</p>
                <p className="text-sm text-slate-600">
                  {itemTypeLabel(item.item_type)} · {priorityLabel(item.priority)}{" "}
                  priority · {statusLabel(item.status)}
                  {item.due_date &&
                    ` · Due ${new Date(item.due_date).toLocaleDateString("en-GB")}`}
                  {item.review_date &&
                    ` · Review ${new Date(item.review_date).toLocaleDateString("en-GB")}`}
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
              <p
                className={`mt-2 inline-block rounded-lg px-3 py-1.5 text-sm ${levelClass[attention.level]}`}
              >
                {attention.message}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
