"use client";

import { useActionState, useState } from "react";
import {
  evidenceCategories,
  evidenceStatuses,
  type EvidenceFormState,
  type EvidenceInput,
  type EvidenceRecord,
} from "@/lib/evidence-records";

const emptyValues: EvidenceInput = {
  category: "",
  title: "",
  notes: "",
  record_date: new Date().toISOString().slice(0, 10),
  review_date: "",
  status: "active",
};

export default function EvidenceRecordForm({
  action,
  record,
  submitLabel,
  showStatus = false,
}: {
  action: (
    prev: EvidenceFormState,
    formData: FormData,
  ) => Promise<EvidenceFormState>;
  record?: EvidenceRecord;
  submitLabel: string;
  showStatus?: boolean;
}) {
  const [state, formAction, pending] = useActionState<EvidenceFormState, FormData>(
    action,
    { values: emptyValues },
  );

  const values: EvidenceInput =
    state.values ??
    (record
      ? {
          category: record.category,
          title: record.title,
          notes: record.notes ?? "",
          record_date: record.record_date,
          review_date: record.review_date ?? "",
          status: record.status,
        }
      : emptyValues);

  const [category, setCategory] = useState(values.category);
  const helper = evidenceCategories.find((c) => c.value === category)?.helper;

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-teal-600";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="category" className="font-medium text-navy">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue={values.category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Choose a category
          </option>
          {evidenceCategories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {helper && <p className="mt-1 text-sm text-slate-600">{helper}</p>}
      </div>

      <div>
        <label htmlFor="title" className="font-medium text-navy">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={values.title}
          placeholder="e.g. Kitchen extinguisher serviced"
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="record_date" className="font-medium text-navy">
            Record date
          </label>
          <input
            id="record_date"
            name="record_date"
            type="date"
            required
            defaultValue={values.record_date}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="review_date" className="font-medium text-navy">
            Review date{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="review_date"
            name="review_date"
            type="date"
            defaultValue={values.review_date}
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
          className={inputClass}
        />
      </div>

      {showStatus && (
        <div>
          <label htmlFor="status" className="font-medium text-navy">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={values.status}
            className={inputClass}
          >
            {evidenceStatuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-slate-600">
            An organisational label only. It does not represent a legal or
            fire-safety compliance status.
          </p>
        </div>
      )}

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
        className="w-full rounded-lg bg-action px-6 py-3 font-semibold text-white hover:bg-action-hover disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
