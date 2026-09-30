export type ItemType = "keep_record" | "arrange_do" | "submit_send" | "other";
export type Priority = "low" | "medium" | "high";
export type Status =
  | "not_started"
  | "in_progress"
  | "completed"
  | "submitted"
  | "needs_review"
  | "not_applicable"
  | "archived";

export const itemTypes: { value: ItemType; label: string; helper: string }[] = [
  {
    value: "keep_record",
    label: "Keep / record",
    helper: "A document or record to keep available, maintain, or review.",
  },
  {
    value: "arrange_do",
    label: "Arrange / do",
    helper: "A practical action to carry out or arrange.",
  },
  {
    value: "submit_send",
    label: "Submit / send",
    helper: "Something that needs to be sent to a named organisation.",
  },
  { value: "other", label: "Other", helper: "Anything else you want to track." },
];

export const priorities: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const statuses: { value: Status; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "submitted", label: "Submitted" },
  { value: "needs_review", label: "Needs review" },
  { value: "not_applicable", label: "Not applicable" },
  { value: "archived", label: "Archived" },
];

const itemTypeValues = new Set(itemTypes.map((t) => t.value));
const priorityValues = new Set(priorities.map((p) => p.value));
const statusValues = new Set(statuses.map((s) => s.value));

export function itemTypeLabel(v: string): string {
  return itemTypes.find((t) => t.value === v)?.label ?? v;
}
export function priorityLabel(v: string): string {
  return priorities.find((p) => p.value === v)?.label ?? v;
}
export function statusLabel(v: string): string {
  return statuses.find((s) => s.value === v)?.label ?? v;
}

export type PropertyItem = {
  id: string;
  property_id: string;
  item_type: ItemType;
  category: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  due_date: string | null;
  review_date: string | null;
  completed_date: string | null;
  submitted_date: string | null;
  destination: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PropertyItemInput = {
  item_type: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  review_date: string;
  completed_date: string;
  submitted_date: string;
  destination: string;
  notes: string;
};

export type PropertyItemFormState = {
  error?: string;
  values?: PropertyItemInput;
};

function readValues(formData: FormData): PropertyItemInput {
  return {
    item_type: String(formData.get("item_type") ?? ""),
    category: String(formData.get("category") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    priority: String(formData.get("priority") ?? "medium"),
    status: String(formData.get("status") ?? "not_started"),
    due_date: String(formData.get("due_date") ?? ""),
    review_date: String(formData.get("review_date") ?? ""),
    completed_date: String(formData.get("completed_date") ?? ""),
    submitted_date: String(formData.get("submitted_date") ?? ""),
    destination: String(formData.get("destination") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

function validDateOrEmpty(v: string) {
  return v === "" || !Number.isNaN(Date.parse(v));
}

/**
 * Mirrors the database CHECK constraints exactly, so a friendly message
 * appears before the (identical) constraint would otherwise reject it.
 */
export function parsePropertyItemInput(
  formData: FormData,
): { data: Record<string, unknown>; values: PropertyItemInput } | { error: string; values: PropertyItemInput } {
  const values = readValues(formData);
  const title = values.title.trim();
  const notes = values.notes.trim();
  const destination = values.destination.trim();

  if (!itemTypeValues.has(values.item_type as ItemType)) {
    return { error: "Please choose an item type.", values };
  }
  if (!title) {
    return { error: "Please enter a title.", values };
  }
  const priority = priorityValues.has(values.priority as Priority)
    ? values.priority
    : "medium";
  if (!statusValues.has(values.status as Status)) {
    return { error: "Please choose a status.", values };
  }

  for (const [label, v] of [
    ["due date", values.due_date],
    ["review date", values.review_date],
    ["completed date", values.completed_date],
    ["submitted date", values.submitted_date],
  ] as const) {
    if (!validDateOrEmpty(v)) {
      return { error: `Please enter a valid ${label}, or leave it blank.`, values };
    }
  }

  if (destination && values.item_type !== "submit_send") {
    return {
      error: "A destination can only be set for Submit / send items.",
      values,
    };
  }

  if (values.status === "completed" && !values.completed_date) {
    return {
      error: "Please enter a completed date, since this item is marked completed.",
      values,
    };
  }

  if (values.status === "submitted") {
    if (values.item_type !== "submit_send") {
      return {
        error: "Only Submit / send items can be marked submitted.",
        values,
      };
    }
    if (!destination) {
      return {
        error: "Please enter a destination, since this item is marked submitted.",
        values,
      };
    }
    if (!values.submitted_date) {
      return {
        error: "Please enter a submitted date, since this item is marked submitted.",
        values,
      };
    }
  }

  if (values.status === "not_applicable" && !notes) {
    return {
      error: "Please add a note explaining why this item is not applicable.",
      values,
    };
  }

  return {
    data: {
      item_type: values.item_type,
      category: values.category.trim() || null,
      title,
      description: values.description.trim() || null,
      priority,
      status: values.status,
      due_date: values.due_date || null,
      review_date: values.review_date || null,
      completed_date: values.completed_date || null,
      submitted_date: values.submitted_date || null,
      destination: destination || null,
      notes: notes || null,
    },
    values,
  };
}
