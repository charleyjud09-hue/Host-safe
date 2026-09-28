"use client";

import { useActionState } from "react";
import type { Property, PropertyFormState, PropertyInput } from "@/lib/properties";

const emptyValues: PropertyInput = {
  name: "",
  address: "",
  property_type: "",
  floors: "",
  max_guests: "",
  notes: "",
};

export default function PropertyForm({
  action,
  property,
  submitLabel,
}: {
  action: (
    prev: PropertyFormState,
    formData: FormData,
  ) => Promise<PropertyFormState>;
  property?: Property;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<PropertyFormState, FormData>(
    action,
    { values: emptyValues },
  );

  const values: PropertyInput =
    state.values ??
    (property
      ? {
          name: property.name,
          address: property.address,
          property_type: property.property_type ?? "",
          floors: property.floors?.toString() ?? "",
          max_guests: property.max_guests?.toString() ?? "",
          notes: property.notes ?? "",
        }
      : emptyValues);

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-teal-600";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="name" className="font-medium text-navy">
          Property name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={values.name}
          placeholder="e.g. The Old Barn"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="address" className="font-medium text-navy">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          required
          rows={2}
          defaultValue={values.address}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="property_type" className="font-medium text-navy">
          Property type
        </label>
        <input
          id="property_type"
          name="property_type"
          type="text"
          defaultValue={values.property_type}
          placeholder="e.g. Cottage, cabin, annexe"
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="floors" className="font-medium text-navy">
            Number of floors
          </label>
          <input
            id="floors"
            name="floors"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={values.floors}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="max_guests" className="font-medium text-navy">
            Guest capacity
          </label>
          <input
            id="max_guests"
            name="max_guests"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={values.max_guests}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="font-medium text-navy">
          Notes <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={values.notes}
          placeholder="Anything else worth remembering about this property"
          className={inputClass}
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 p-3 text-amber-950 ring-1 ring-amber-200"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-navy px-6 py-3 font-semibold text-white hover:bg-navy-light disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
