"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useActionState } from "react";
import { startMembership, type JoinFormState } from "@/app/membership/actions";
import { PaymentPlaceholder } from "@/components/MembershipParts";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// Loaded once, and only in the browser. Stripe's script serves the card form.
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/**
 * The final step: two unticked boxes (UK rules need active consent), then
 * Stripe's embedded card form. Card details are typed into Stripe's form
 * and go straight to Stripe; Letnook never sees them.
 */
export default function JoinForm({
  plan,
  interval,
  mode,
  buttonLabel,
  stripeReady,
}: {
  plan: string;
  interval: string;
  mode: "trial" | "rejoin";
  buttonLabel: string;
  /** Real payments are set up (otherwise the space stays a placeholder). */
  stripeReady: boolean;
}) {
  const [state, formAction, pending] = useActionState<JoinFormState, FormData>(
    startMembership,
    {},
  );

  if (state.clientSecret && stripePromise) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Your card details are entered securely with Stripe, our payment
          provider. Letnook never sees or stores them.
        </p>
        <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret: state.clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    );
  }

  const ready = stripeReady && Boolean(stripePromise);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="interval" value={interval} />

      {!ready && <PaymentPlaceholder title="Card details" />}

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
        {pending ? "Please wait..." : ready ? "Continue to secure card details" : buttonLabel}
      </button>
    </form>
  );
}
