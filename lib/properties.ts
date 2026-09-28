export type Property = {
  id: string;
  name: string;
  address: string;
  property_type: string | null;
  floors: number | null;
  max_guests: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PropertyInput = {
  name: string;
  address: string;
  property_type: string;
  floors: string;
  max_guests: string;
  notes: string;
};

export type PropertyFormState = {
  error?: string;
  values?: PropertyInput;
};

/** Turns raw form fields into a clean row, or returns an error message. */
export function parsePropertyInput(
  formData: FormData,
): { data: Record<string, unknown> } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const property_type = String(formData.get("property_type") ?? "").trim();
  const floorsRaw = String(formData.get("floors") ?? "").trim();
  const maxGuestsRaw = String(formData.get("max_guests") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) return { error: "Please enter a name for the property." };
  if (!address) return { error: "Please enter an address." };

  const floors = floorsRaw ? Number(floorsRaw) : null;
  if (floorsRaw && (!Number.isInteger(floors) || floors! < 0)) {
    return { error: "Floors must be a whole number of 0 or more." };
  }

  const max_guests = maxGuestsRaw ? Number(maxGuestsRaw) : null;
  if (maxGuestsRaw && (!Number.isInteger(max_guests) || max_guests! < 0)) {
    return { error: "Guest capacity must be a whole number of 0 or more." };
  }

  return {
    data: {
      name,
      address,
      property_type: property_type || null,
      floors,
      max_guests,
      notes: notes || null,
    },
  };
}
