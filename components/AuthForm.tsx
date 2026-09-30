"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type FormState, signIn, signUp } from "@/app/auth/actions";

export default function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    isSignUp ? signUp : signIn,
    {},
  );

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-teal-600";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="font-medium text-navy">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className="font-medium text-navy">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          minLength={8}
          required
          aria-describedby={isSignUp ? "password-hint" : undefined}
          className={inputClass}
        />
        {isSignUp ? (
          <p id="password-hint" className="mt-1 text-sm text-slate-600">
            At least 8 characters, including an uppercase letter, a
            lowercase letter, a number and a symbol.
          </p>
        ) : (
          <p className="mt-2 text-right text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-navy underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </p>
        )}
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 p-3 text-amber-950 ring-1 ring-amber-200"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p
          role="status"
          className="rounded-lg bg-teal-50 p-3 text-slate-800 ring-1 ring-teal-200"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-action px-6 py-3 font-semibold text-white hover:bg-action-hover disabled:opacity-60"
      >
        {pending
          ? "Please wait..."
          : isSignUp
            ? "Create free account"
            : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-600">
        {isSignUp ? "Already have an account? " : "New to HostSafe? "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-medium text-navy underline underline-offset-4"
        >
          {isSignUp ? "Sign in" : "Create a free account"}
        </Link>
      </p>
    </form>
  );
}
