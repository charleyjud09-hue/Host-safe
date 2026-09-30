"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  BLOCK_DESCRIPTION_MAX,
  BLOCKING_HINT,
  FREE_TEXT_HINT,
  PLANNED_CLEANUP_NOTICE,
  PLANNED_WORK_NOTICE,
  TITLE_MAX,
  type CalendarEntry,
  type CalendarEntryType,
  type EntryFormState,
  type EntryInput,
} from "@/lib/calendar";

/** Form for planned work, planned cleanup and custom blocks. */
export default function CalendarEntryForm({
  action,
  entryType,
  entry,
  propertyName,
  submitLabel,
  cancelHref,
}: {
  action: (prev: EntryFormState, formData: FormData) => Promise<EntryFormState>;
  entryType: Exclude<CalendarEntryType, "guest_stay">;
  entry?: CalendarEntry;
  propertyName: string;
  submitLabel: string;
  cancelHref: string;
}) {
  const initial: EntryInput = entry
    ? {
        title: entry.title ?? "",
        description: entry.description ?? "",
        start_date: entry.start_date,
        end_date: entry.end_date === entry.start_date ? "" : entry.end_date,
        blocks_guest_stays:
          entry.blocks_guest_stays === null ? "" : entry.blocks_guest_stays ? "yes" : "no",
      }
    : { title: "", description: "", start_date: "", end_date: "", blocks_guest_stays: "" };

  const [state, formAction, pending] = useActionState<EntryFormState, FormData>(action, {
    values: initial,
  });
  const values = state.values ?? initial;

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-teal-600";
  const optional = <span className="font-normal text-slate-500">(optional)</span>;
  const hasTitle = entryType !== "planned_cleanup";
  const hasRange = entryType !== "planned_cleanup";
  const isBlock = entryType === "custom_block";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <p className="font-medium text-navy">Property</p>
        <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2.5 text-slate-700 ring-1 ring-slate-200">
          {propertyName}
        </p>
      </div>

      {hasTitle && (
        <div>
          <label htmlFor="title" className="font-medium text-navy">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={TITLE_MAX}
            defaultValue={values.title}
            placeholder={isBlock ? "e.g. Owner use" : "e.g. Boiler service"}
            aria-describedby="title-hint"
            className={inputClass}
          />
          <p id="title-hint" className="mt-1 text-sm text-slate-600">
            {FREE_TEXT_HINT}
          </p>
        </div>
      )}

      {isBlock && (
        <div>
          <label htmlFor="description" className="font-medium text-navy">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            required
            maxLength={BLOCK_DESCRIPTION_MAX}
            defaultValue={values.description}
            aria-describedby="description-hint"
            className={inputClass}
          />
          <p id="description-hint" className="mt-1 text-sm text-slate-600">
            {FREE_TEXT_HINT}
          </p>
        </div>
      )}

      {hasRange ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="start_date" className="font-medium text-navy">
              Start date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              defaultValue={values.start_date}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="end_date" className="font-medium text-navy">
              End date {optional}
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              defaultValue={values.end_date}
              aria-describedby="end-date-hint"
              className={inputClass}
            />
            <p id="end-date-hint" className="mt-1 text-sm text-slate-600">
              Leave blank for a single day.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor="start_date" className="font-medium text-navy">
            Date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={values.start_date}
            className={inputClass}
          />
        </div>
      )}

      {isBlock && (
        <fieldset>
          <legend className="font-medium text-navy">Does this block guest stays?</legend>
          <p id="blocking-hint" className="mt-1 text-sm text-slate-600">
            {BLOCKING_HINT}
          </p>
          <div className="mt-2 flex flex-wrap gap-5">
            {[
              { value: "yes", label: "Yes, block guest stays" },
              { value: "no", label: "No, for information only" },
            ].map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-slate-800">
                <input
                  type="radio"
                  name="blocks_guest_stays"
                  value={o.value}
                  required
                  defaultChecked={values.blocks_guest_stays === o.value}
                  aria-describedby="blocking-hint"
                  className="h-4 w-4 accent-teal-700"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {entryType === "planned_work" && (
        <p className="text-sm text-slate-600">{PLANNED_WORK_NOTICE}</p>
      )}
      {entryType === "planned_cleanup" && (
        <p className="text-sm text-slate-600">{PLANNED_CLEANUP_NOTICE}</p>
      )}

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
          Back
        </Link>
      </div>
    </form>
  );
}
