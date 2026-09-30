"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type FormState, updatePassword } from "@/app/auth/actions";

export default function NewPasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updatePassword,
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
          href="/"
          className="block w-full rounded-lg bg-action px-6 py-3 text-center font-semibold text-white hover:bg-action-hover"
        >
          Go to your properties
        </Link>
      </div>
    );
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-teal-600";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="password" className="font-medium text-navy">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-describedby="password-hint"
          className={inputClass}
        />
        <p id="password-hint" className="mt-1 text-sm text-slate-600">
          At least 8 characters, including an uppercase letter, a lowercase
          letter, a number and a symbol.
        </p>
      </div>
      <div>
        <label htmlFor="confirm_password" className="font-medium text-navy">
          Confirm new password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 p-3 text-amber-950 ring-1 ring-amber-200"
        >
          {state.error}{" "}
          {state.error.includes("expired") && (
            <Link href="/forgot-password" className="font-medium underline underline-offset-4">
              Request a new link
            </Link>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-action px-6 py-3 font-semibold text-white hover:bg-action-hover disabled:opacity-60"
      >
        {pending ? "Please wait..." : "Save new password"}
      </button>
    </form>
  );
}
