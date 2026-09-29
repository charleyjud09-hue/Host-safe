import Link from "next/link";
import { formatDisplayDate } from "@/lib/attention";
import {
  maintenancePriorityLabel,
  maintenanceStatusLabel,
  type MaintenanceIssue,
} from "@/lib/maintenance";

export default function MaintenanceIssueList({
  propertyId,
  issues,
  emptyText,
}: {
  propertyId: string;
  issues: MaintenanceIssue[];
  emptyText: string;
}) {
  if (issues.length === 0) {
    return <p className="text-slate-700">{emptyText}</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {issues.map((issue) => (
        <li
          key={issue.id}
          className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="font-medium text-navy">{issue.title}</p>
            <p className="mt-1 text-sm text-slate-600">
              {maintenanceStatusLabel(issue.status)} ·{" "}
              {maintenancePriorityLabel(issue.priority)} priority
              {issue.location && ` · ${issue.location}`}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Reported {formatDisplayDate(issue.reported_date)}
              {issue.due_date && ` · Due ${formatDisplayDate(issue.due_date)}`}
              {issue.resolved_date &&
                ` · Resolved ${formatDisplayDate(issue.resolved_date)}`}
            </p>
          </div>
          <Link
            href={`/properties/${propertyId}/maintenance/${issue.id}`}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-navy hover:bg-slate-50"
          >
            Open
          </Link>
        </li>
      ))}
    </ul>
  );
}
