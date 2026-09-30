"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AccountFormState } from "@/app/account/actions";

export type AccountField = {
  name: string;
  label: string;
  type: "email" | "password" | "text";
  autoComplete: string;
  hint?: string;
};

/**
 * Shared form for the account pages. On success it shows the message and a
 * link back to Account settings instead of the fields.
 */
export default function AccountForm({
  action,
  fields,
  submitLabel,
  danger = false,
}: {
  action: (prev: AccountFormState, formData: FormData) => Promise<AccountFormState>;
  fields: AccountField[];
  submitLabel: string;
  /** Red submit button, for destructive actions. */
  danger?: boolean;
}) {
  const [state, formAction, pending] = useActionState<AccountFormState, FormData>(
    action,
    {},
  );

  if (state.message) {
    return (
      <div className="space-y-5">
        <p
          role="status"
          className="rounded-lg bg-teal-50 p-3 text-slate-800 ring-1 ring-teal-200"
        >
          {state.message}
        </p>
        <Link
          href="/account"
          className="block w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-navy hover:bg-slate-50"
        >
          Back to account settings
        </Link>
      </div>
    );
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-teal-600";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="font-medium text-navy">
            {f.label}
          </label>
          <input
            id={f.name}
            name={f.name}
            type={f.type}
            autoComplete={f.autoComplete}
            required
            aria-describedby={f.hint ? `${f.name}-hint` : undefined}
            className={inputClass}
          />
          {f.hint && (
            <p id={`${f.name}-hint`} className="mt-1 text-sm text-slate-600">
              {f.hint}
            </p>
          )}
        </div>
      ))}

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
          className={`w-full rounded-lg px-6 py-3 font-semibold text-white disabled:opacity-60 sm:w-auto ${
            danger ? "bg-red-700 hover:bg-red-800" : "bg-action hover:bg-action-hover"
          }`}
        >
          {pending ? "Please wait..." : submitLabel}
        </button>
        <Link
          href="/account"
          className="w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-navy hover:bg-slate-50 sm:w-auto"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
