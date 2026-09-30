export type EvidenceCategory =
  | "fire_risk_assessment"
  | "alarm_checks"
  | "escape_route"
  | "emergency_lighting"
  | "extinguishers"
  | "guest_information"
  | "maintenance"
  | "certificate"
  | "training"
  | "other";

export type EvidenceStatus = "active" | "needs_review" | "archived";

/**
 * Deliberately neutral: helpers say what to keep here, never what the law
 * requires or that a record proves anything (disclaimer audit B2).
 */
export const evidenceCategories: {
  value: EvidenceCategory;
  label: string;
  helper: string;
}[] = [
  {
    value: "fire_risk_assessment",
    label: "Fire risk assessment",
    helper: "Keep your fire risk assessment here.",
  },
  {
    value: "alarm_checks",
    label: "Alarm and detector checks",
    helper: "Keep records of alarm and detector checks here.",
  },
  {
    value: "escape_route",
    label: "Escape route checks",
    helper: "Keep records of escape-route checks here.",
  },
  {
    value: "emergency_lighting",
    label: "Emergency lighting checks",
    helper: "Keep records of emergency lighting checks here.",
  },
  {
    value: "extinguishers",
    label: "Extinguishers and fire blankets",
    helper: "Keep records of extinguisher and fire blanket servicing here.",
  },
  {
    value: "guest_information",
    label: "Guest fire safety information",
    helper: "Keep a copy of the fire safety information you give guests here.",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    helper: "Keep maintenance records here.",
  },
  {
    value: "certificate",
    label: "Certificate",
    helper: "Keep certificates here, for example electrical or gas.",
  },
  {
    value: "training",
    label: "Training",
    helper: "Keep training records here.",
  },
  {
    value: "other",
    label: "Other",
    helper: "Anything else you want to keep with this property.",
  },
];

export const evidenceStatuses: { value: EvidenceStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "needs_review", label: "Needs review" },
  { value: "archived", label: "Archived" },
];

export function evidenceCategoryLabel(category: string): string {
  return (
    evidenceCategories.find((c) => c.value === category)?.label ?? category
  );
}

export function evidenceStatusLabel(status: string): string {
  return evidenceStatuses.find((s) => s.value === status)?.label ?? status;
}

export type EvidenceRecord = {
  id: string;
  property_id: string;
  category: EvidenceCategory;
  title: string;
  notes: string | null;
  record_date: string;
  review_date: string | null;
  status: EvidenceStatus;
  created_at: string;
  updated_at: string;
};

export type EvidenceInput = {
  category: string;
  title: string;
  notes: string;
  record_date: string;
  review_date: string;
  status: string;
};

export type EvidenceFormState = {
  error?: string;
  values?: EvidenceInput;
};

const categoryValues = new Set(evidenceCategories.map((c) => c.value));
const statusValues = new Set(evidenceStatuses.map((s) => s.value));

function readValues(formData: FormData): EvidenceInput {
  return {
    category: String(formData.get("category") ?? ""),
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    record_date: String(formData.get("record_date") ?? ""),
    review_date: String(formData.get("review_date") ?? ""),
    status: String(formData.get("status") ?? "active"),
  };
}

/** Turns raw form fields into a clean row, or returns an error message. */
export function parseEvidenceInput(
  formData: FormData,
): { data: Record<string, unknown>; values: EvidenceInput } | { error: string; values: EvidenceInput } {
  const values = readValues(formData);
  const title = values.title.trim();
  const notes = values.notes.trim();

  if (!categoryValues.has(values.category as EvidenceCategory)) {
    return { error: "Please choose a category.", values };
  }
  if (!title) {
    return { error: "Please enter a short title for this record.", values };
  }
  if (!values.record_date) {
    return { error: "Please enter the record date.", values };
  }
  if (Number.isNaN(Date.parse(values.record_date))) {
    return { error: "Please enter a valid record date.", values };
  }
  if (values.review_date && Number.isNaN(Date.parse(values.review_date))) {
    return { error: "Please enter a valid review date, or leave it blank.", values };
  }
  const status = statusValues.has(values.status as EvidenceStatus)
    ? values.status
    : "active";

  return {
    data: {
      category: values.category,
      title,
      notes: notes || null,
      record_date: values.record_date,
      review_date: values.review_date || null,
      status,
    },
    values,
  };
}
