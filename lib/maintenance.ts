export type MaintenanceStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "archived";

export type MaintenancePriority = "low" | "medium" | "high";

export const maintenanceStatuses: { value: MaintenanceStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting", label: "Waiting" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
];

export const maintenancePriorities: { value: MaintenancePriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

/** Statuses shown under "Open issues" (and eligible for attention if dated). */
export const OPEN_MAINTENANCE_STATUSES = new Set<string>(["open", "in_progress", "waiting"]);

export const RESOLVED_NOTICE =
  "Marking an issue resolved records what you entered in HostSafe. It does not confirm that a repair is complete, safe or compliant.";

export function maintenanceStatusLabel(v: string): string {
  return maintenanceStatuses.find((s) => s.value === v)?.label ?? v;
}

export function maintenancePriorityLabel(v: string): string {
  return maintenancePriorities.find((p) => p.value === v)?.label ?? v;
}

export type MaintenanceIssue = {
  id: string;
  property_id: string;
  title: string;
  location: string | null;
  description: string | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reported_date: string;
  due_date: string | null;
  resolved_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MaintenanceInput = {
  title: string;
  location: string;
  description: string;
  priority: string;
  status: string;
  reported_date: string;
  due_date: string;
  resolved_date: string;
  notes: string;
};

export type MaintenanceFormState = { error?: string; values?: MaintenanceInput };

const statusValues = new Set(maintenanceStatuses.map((s) => s.value));
const priorityValues = new Set(maintenancePriorities.map((p) => p.value));
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function validDate(v: string) {
  return isoDate.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
}

function readValues(formData: FormData): MaintenanceInput {
  const get = (k: string) => String(formData.get(k) ?? "");
  return {
    title: get("title"),
    location: get("location"),
    description: get("description"),
    priority: get("priority") || "medium",
    status: get("status") || "open",
    reported_date: get("reported_date"),
    due_date: get("due_date"),
    resolved_date: get("resolved_date"),
    notes: get("notes"),
  };
}

/**
 * Mirrors the database CHECK constraints, so a friendly message appears
 * before the database would reject the row.
 */
export function parseMaintenanceInput(
  formData: FormData,
):
  | { data: Record<string, unknown>; values: MaintenanceInput }
  | { error: string; values: MaintenanceInput } {
  const values = readValues(formData);
  const title = values.title.trim();

  if (!title) return { error: "Please enter a short title for the issue.", values };
  if (!priorityValues.has(values.priority as MaintenancePriority)) {
    return { error: "Please choose a priority.", values };
  }
  if (!statusValues.has(values.status as MaintenanceStatus)) {
    return { error: "Please choose a status.", values };
  }
  if (!values.reported_date || !validDate(values.reported_date)) {
    return { error: "Please enter a valid reported date.", values };
  }
  if (values.due_date && !validDate(values.due_date)) {
    return { error: "Please enter a valid due date, or leave it blank.", values };
  }
  if (values.status === "resolved") {
    if (!values.resolved_date || !validDate(values.resolved_date)) {
      return {
        error: "Please enter a resolved date, since this issue is marked resolved.",
        values,
      };
    }
  } else if (values.resolved_date && !validDate(values.resolved_date)) {
    return { error: "Please enter a valid resolved date, or leave it blank.", values };
  }

  return {
    data: {
      title,
      location: values.location.trim() || null,
      description: values.description.trim() || null,
      priority: values.priority,
      status: values.status,
      reported_date: values.reported_date,
      due_date: values.due_date || null,
      // Only kept while the issue is resolved; cleared if it's reopened.
      resolved_date: values.status === "resolved" ? values.resolved_date : null,
      notes: values.notes.trim() || null,
    },
    values,
  };
}
