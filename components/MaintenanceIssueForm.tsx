"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  maintenancePriorities,
  maintenanceStatuses,
  RESOLVED_NOTICE,
  type MaintenanceFormState,
  type MaintenanceInput,
  type MaintenanceIssue,
} from "@/lib/maintenance";

export default function MaintenanceIssueForm({
  action,
  issue,
  propertyName,
  today,
  submitLabel,
  cancelHref,
}: {
  action: (
    prev: MaintenanceFormState,
    formData: FormData,
  ) => Promise<MaintenanceFormState>;
  issue?: MaintenanceIssue;
  propertyName: string;
  /** UK-local today (YYYY-MM-DD), passed from the server so both renders match. */
  today: string;
  submitLabel: string;
  cancelHref: string;
}) {
  const initial: MaintenanceInput = issue
    ? {
        title: issue.title,
        location: issue.location ?? "",
        description: issue.description ?? "",
        priority: issue.priority,
        status: issue.status,
        reported_date: issue.reported_date,
        due_date: issue.due_date ?? "",
        resolved_date: issue.resolved_date ?? "",
        notes: issue.notes ?? "",
      }
    : {
        title: "",
        location: "",
        description: "",
        priority: "medium",
        status: "open",
        reported_date: today,
        due_date: "",
        resolved_date: "",
        notes: "",
      };

  const [state, formAction, pending] = useActionState<MaintenanceFormState, FormData>(
    action,
    { values: initial },
  );
  const values = state.values ?? initial;
  const [status, setStatus] = useState(values.status);

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-teal-600";
  const optional = <span className="font-normal text-slate-500">(optional)</span>;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <p className="font-medium text-navy">Property</p>
        <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2.5 text-slate-700 ring-1 ring-slate-200">
          {propertyName}
        </p>
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
          placeholder="e.g. Dripping tap in the bathroom"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="location" className="font-medium text-navy">
          Location within the property {optional}
        </label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={values.location}
          placeholder="e.g. Upstairs bathroom"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className="font-medium text-navy">
          Description {optional}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={values.description}
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="priority" className="font-medium text-navy">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={values.priority}
            className={inputClass}
          >
            {maintenancePriorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="font-medium text-navy">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={values.status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            {maintenanceStatuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="reported_date" className="font-medium text-navy">
            Reported date
          </label>
          <input
            id="reported_date"
            name="reported_date"
            type="date"
            required
            defaultValue={values.reported_date}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="due_date" className="font-medium text-navy">
            Due date {optional}
          </label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={values.due_date}
            className={inputClass}
          />
        </div>
      </div>

      {status === "resolved" && (
        <div className="space-y-3 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
          <div>
            <label htmlFor="resolved_date" className="font-medium text-navy">
              Resolved date
            </label>
            <input
              id="resolved_date"
              name="resolved_date"
              type="date"
              required
              defaultValue={values.resolved_date || today}
              className={inputClass}
            />
          </div>
          <p className="text-sm text-slate-600">{RESOLVED_NOTICE}</p>
        </div>
      )}

      <div>
        <label htmlFor="notes" className="font-medium text-navy">
          Notes {optional}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={values.notes}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-action px-6 py-3 font-semibold text-white hover:bg-action-hover disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-navy hover:bg-slate-50 sm:w-auto"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
