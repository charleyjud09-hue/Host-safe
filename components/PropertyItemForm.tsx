"use client";

import { useActionState, useState } from "react";
import {
  itemServices,
  itemTypes,
  priorities,
  statuses,
  type PropertyItem,
  type PropertyItemFormState,
  type PropertyItemInput,
} from "@/lib/property-items";

const emptyValues: PropertyItemInput = {
  item_type: "",
  service: "",
  category: "",
  title: "",
  description: "",
  priority: "medium",
  status: "not_started",
  due_date: "",
  review_date: "",
  completed_date: "",
  submitted_date: "",
  destination: "",
  notes: "",
};

export default function PropertyItemForm({
  action,
  item,
  submitLabel,
}: {
  action: (
    prev: PropertyItemFormState,
    formData: FormData,
  ) => Promise<PropertyItemFormState>;
  item?: PropertyItem;
  submitLabel: string;
}) {
  // Start from the saved item when editing; after a failed save the
  // server hands back what was typed instead.
  const initialValues: PropertyItemInput = item
    ? {
        item_type: item.item_type,
        service: item.service ?? "",
        category: item.category ?? "",
        title: item.title,
        description: item.description ?? "",
        priority: item.priority,
        status: item.status,
        due_date: item.due_date ?? "",
        review_date: item.review_date ?? "",
        completed_date: item.completed_date ?? "",
        submitted_date: item.submitted_date ?? "",
        destination: item.destination ?? "",
        notes: item.notes ?? "",
      }
    : emptyValues;

  const [state, formAction, pending] = useActionState<PropertyItemFormState, FormData>(
    action,
    { values: initialValues },
  );

  const values: PropertyItemInput = state.values ?? initialValues;

  const [itemType, setItemType] = useState(values.item_type);
  const [status, setStatus] = useState(values.status);
  const helper = itemTypes.find((t) => t.value === itemType)?.helper;

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-teal-600";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="item_type" className="font-medium text-navy">
          Type
        </label>
        <select
          id="item_type"
          name="item_type"
          required
          defaultValue={values.item_type}
          onChange={(e) => setItemType(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Choose a type
          </option>
          {itemTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
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
          placeholder="e.g. Arrange annual alarm service"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="service" className="font-medium text-navy">
          Service <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <select
          id="service"
          name="service"
          defaultValue={values.service}
          aria-describedby="service-hint"
          className={inputClass}
        >
          <option value="">Not set</option>
          {itemServices.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <p id="service-hint" className="mt-1 text-sm text-slate-600">
          Which part of the property this action relates to. Shown next to it
          in your reminders.
        </p>
      </div>

      <div>
        <label htmlFor="category" className="font-medium text-navy">
          Category <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input
          id="category"
          name="category"
          type="text"
          defaultValue={values.category}
          placeholder="e.g. Alarms, escape routes, guest information"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className="font-medium text-navy">
          Description <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
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
            {priorities.map((p) => (
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
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-slate-600">
            An organisational status only — not a legal or compliance
            judgement.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="due_date" className="font-medium text-navy">
            Due date <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={values.due_date}
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

      {status === "completed" && (
        <div>
          <label htmlFor="completed_date" className="font-medium text-navy">
            Completed date
          </label>
          <input
            id="completed_date"
            name="completed_date"
            type="date"
            required
            defaultValue={values.completed_date || new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </div>
      )}

      {status === "submitted" && (
        <div className="space-y-5 rounded-lg bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Submitted items must be a Submit / send item, with a destination
            and submitted date.
          </p>
          <p className="text-sm text-slate-600">
            Marking an item as submitted records what you entered in
            HostSafe. It does not confirm that the document was received,
            accepted, valid, complete, or submitted by any deadline.
          </p>
          <div>
            <label htmlFor="destination" className="font-medium text-navy">
              Destination
            </label>
            <input
              id="destination"
              name="destination"
              type="text"
              required
              defaultValue={values.destination}
              placeholder="e.g. local authority, licensing team, insurer"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="submitted_date" className="font-medium text-navy">
              Submitted date
            </label>
            <input
              id="submitted_date"
              name="submitted_date"
              type="date"
              required
              defaultValue={
                values.submitted_date || new Date().toISOString().slice(0, 10)
              }
              className={inputClass}
            />
          </div>
        </div>
      )}

      {status !== "submitted" && itemType === "submit_send" && (
        <div>
          <label htmlFor="destination_optional" className="font-medium text-navy">
            Destination{" "}
            <span className="font-normal text-slate-500">(optional until submitted)</span>
          </label>
          <input
            id="destination_optional"
            name="destination"
            type="text"
            defaultValue={values.destination}
            placeholder="e.g. local authority, licensing team, insurer"
            className={inputClass}
          />
        </div>
      )}

      {status === "not_applicable" && (
        <p className="text-sm text-slate-600">
          Please explain why in the notes below — a note is required when
          marking something not applicable.
        </p>
      )}

      <div>
        <label htmlFor="notes" className="font-medium text-navy">
          Notes{" "}
          {status !== "not_applicable" && (
            <span className="font-normal text-slate-500">(optional)</span>
          )}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          required={status === "not_applicable"}
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
