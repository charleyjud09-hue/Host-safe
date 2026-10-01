"use client";

import { useActionState } from "react";
import { startMembership, type JoinFormState } from "@/app/membership/actions";
import { PaymentPlaceholder } from "@/components/MembershipParts";

/**
 * The final step: two unticked boxes (UK rules need active consent), the
 * reserved payment space, and a button that says plainly that it means paying.
 */
export default function JoinForm({
  plan,
  interval,
  mode,
  buttonLabel,
}: {
  plan: string;
  interval: string;
  mode: "trial" | "rejoin";
  buttonLabel: string;
}) {
  const [state, formAction, pending] = useActionState<JoinFormState, FormData>(
    startMembership,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="interval" value={interval} />

      <PaymentPlaceholder title="Card details" />

      <label className="flex gap-3 text-slate-800">
        <input
          type="checkbox"
          name="accept_terms"
          value="yes"
          className="mt-1 h-5 w-5 shrink-0 accent-teal-700"
        />
        <span>
          I agree to the Terms of Service and have read the Privacy Notice.{" "}
          <span className="text-sm text-amber-900">
            (Both are being written and will be linked here before launch.)
          </span>
        </span>
      </label>

      <label className="flex gap-3 text-slate-800">
        <input
          type="checkbox"
          name="start_now"
          value="yes"
          className="mt-1 h-5 w-5 shrink-0 accent-teal-700"
        />
        <span>
          {mode === "trial"
            ? "I want my free trial to start straight away."
            : "I want my membership to start straight away. I understand that if I cancel within 14 days, I may be charged for the time I’ve used."}
        </span>
      </label>

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
        className="w-full rounded-xl bg-action px-5 py-3 font-semibold text-white hover:bg-action-hover disabled:opacity-60"
      >
        {pending ? "Please wait..." : buttonLabel}
      </button>
    </form>
  );
}
