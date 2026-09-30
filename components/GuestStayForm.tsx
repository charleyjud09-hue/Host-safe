"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  BOOKING_REFERENCE_MAX,
  GUEST_COUNT_MAX,
  GUEST_COUNT_MIN,
  GUEST_FIRST_NAME_MAX,
  GUEST_NAME_HINT,
  type GuestStay,
  type GuestStayFormState,
  type GuestStayInput,
} from "@/lib/calendar";

export default function GuestStayForm({
  action,
  stay,
  propertyName,
  submitLabel,
  cancelHref,
}: {
  action: (prev: GuestStayFormState, formData: FormData) => Promise<GuestStayFormState>;
  stay?: GuestStay;
  propertyName: string;
  submitLabel: string;
  cancelHref: string;
}) {
  const initial: GuestStayInput = stay
    ? {
        arrival_date: stay.start_date,
        departure_date: stay.end_date,
        guest_first_name: stay.guest_first_name ?? "",
        guest_count: stay.guest_count === null ? "" : String(stay.guest_count),
        booking_reference: stay.booking_reference ?? "",
      }
    : {
        arrival_date: "",
        departure_date: "",
        guest_first_name: "",
        guest_count: "",
        booking_reference: "",
      };

  const [state, formAction, pending] = useActionState<GuestStayFormState, FormData>(
    action,
    { values: initial },
  );
  const values = state.values ?? initial;

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

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="arrival_date" className="font-medium text-navy">
            Arrival date
          </label>
          <input
            id="arrival_date"
            name="arrival_date"
            type="date"
            required
            defaultValue={values.arrival_date}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="departure_date" className="font-medium text-navy">
            Departure date
          </label>
          <input
            id="departure_date"
            name="departure_date"
            type="date"
            required
            defaultValue={values.departure_date}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="guest_first_name" className="font-medium text-navy">
          Guest first name {optional}
        </label>
        <input
          id="guest_first_name"
          name="guest_first_name"
          type="text"
          autoComplete="off"
          maxLength={GUEST_FIRST_NAME_MAX}
          defaultValue={values.guest_first_name}
          aria-describedby="guest-name-hint"
          className={inputClass}
        />
        <p id="guest-name-hint" className="mt-1 text-sm text-slate-600">
          {GUEST_NAME_HINT}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="guest_count" className="font-medium text-navy">
            Number of guests {optional}
          </label>
          <input
            id="guest_count"
            name="guest_count"
            type="number"
            inputMode="numeric"
            min={GUEST_COUNT_MIN}
            max={GUEST_COUNT_MAX}
            step={1}
            defaultValue={values.guest_count}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="booking_reference" className="font-medium text-navy">
            Booking reference {optional}
          </label>
          <input
            id="booking_reference"
            name="booking_reference"
            type="text"
            autoComplete="off"
            maxLength={BOOKING_REFERENCE_MAX}
            defaultValue={values.booking_reference}
            className={inputClass}
          />
        </div>
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
          Back
        </Link>
      </div>
    </form>
  );
}
