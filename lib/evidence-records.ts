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
 * Deliberately neutral. Only the fire-risk assessment is described as a
 * legal requirement — everything else is "can be useful evidence where
 * relevant", never a claim that it's mandatory or that having it proves
 * compliance.
 */
export const evidenceCategories: {
  value: EvidenceCategory;
  label: string;
  helper: string;
}[] = [
  {
    value: "fire_risk_assessment",
    label: "Fire risk assessment",
    helper:
      "A written fire risk assessment is a legal requirement for the responsible person.",
  },
  {
    value: "alarm_checks",
    label: "Alarm and detector checks",
    helper:
      "Records of alarm and detector checks can be useful evidence where relevant to your property.",
  },
  {
    value: "escape_route",
    label: "Escape route checks",
    helper:
      "Records of escape-route checks can be useful evidence where relevant to your property.",
  },
  {
    value: "emergency_lighting",
    label: "Emergency lighting checks",
    helper:
      "Records of emergency lighting checks can be useful evidence where relevant to your property.",
  },
  {
    value: "extinguishers",
    label: "Extinguishers and fire blankets",
    helper:
      "Records of extinguisher or fire blanket servicing can be useful evidence where relevant to your property.",
  },
  {
    value: "guest_information",
    label: "Guest fire safety information",
    helper:
      "Keeping a record of the fire safety information given to guests can be useful evidence.",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    helper:
      "Records of relevant maintenance can be useful evidence where relevant to your property.",
  },
  {
    value: "certificate",
    label: "Certificate",
    helper:
      "Certificates (for example electrical or gas) can be useful evidence where relevant to your property.",
  },
  {
    value: "training",
    label: "Training",
    helper:
      "Records of relevant training can be useful evidence where relevant to your property.",
  },
  {
    value: "other",
    label: "Other",
    helper: "Anything else you want to keep organised alongside your property.",
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
