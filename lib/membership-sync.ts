import type Stripe from "stripe";
import { errorCode } from "@/lib/log";
import { findPrice, parseLookupKey, stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Copies a Stripe subscription onto the account's row in public.memberships.
 * Stripe is the source of truth for payments; this is the only code that
 * writes memberships, using the server-only secret key.
 *
 * Also enforces two rules Stripe can't:
 *   - UK customers only: a non-UK card ends the subscription before any charge.
 *   - Founding places: a founding price is only kept if the database grants a
 *     place; otherwise the subscription moves to the standard price before
 *     the first payment.
 */

export type SyncResult = "ok" | "not_uk" | "founding_full";

type DbStatus = "trialing" | "active" | "past_due" | "ended";

function dbStatus(status: Stripe.Subscription.Status): DbStatus | null {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
    case "paused":
      return "ended";
    default:
      // "incomplete": checkout not finished, so nothing to record yet.
      return null;
  }
}

function customerId(sub: Stripe.Subscription): string {
  return typeof sub.customer === "string" ? sub.customer : sub.customer.id;
}

/** The two-letter country of the card on the subscription, if known. */
async function cardCountry(sub: Stripe.Subscription): Promise<string | null> {
  let pm = sub.default_payment_method;
  if (typeof pm === "string") pm = await stripe().paymentMethods.retrieve(pm);
  return pm?.card?.country ?? null;
}

export async function syncSubscription(
  userId: string,
  incoming: Stripe.Subscription | string,
): Promise<SyncResult> {
  const sub =
    typeof incoming === "string"
      ? await stripe().subscriptions.retrieve(incoming, { expand: ["default_payment_method"] })
      : incoming;

  // UK customers only. Checked before anything is recorded or charged.
  const status = dbStatus(sub.status);
  if (status === "trialing" || status === "active") {
    // A missing country (not a card) is refused too: only UK cards are accepted.
    const country = await cardCountry(sub);
    if (country !== "GB") {
      await stripe().subscriptions.cancel(sub.id);
      return "not_uk";
    }
  }
  if (!status) return "ok";

  const item = sub.items.data[0];
  const parsed = parseLookupKey(item?.price.lookup_key);
  if (!item || !parsed) {
    console.error("Sync membership: unrecognised Stripe price");
    return "ok";
  }

  const admin = createAdminClient();
  const periodEnd = sub.status === "trialing" && sub.trial_end ? sub.trial_end : item.current_period_end;

  const { data: existing } = await admin
    .from("memberships")
    .select("trial_started_at")
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await admin.from("memberships").upsert(
    {
      user_id: userId,
      plan: parsed.plan,
      billing_interval: parsed.interval,
      status,
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      trial_started_at:
        existing?.trial_started_at ??
        (sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null),
      provider: "stripe",
      provider_customer_id: customerId(sub),
      provider_subscription_id: sub.id,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("Sync membership failed:", errorCode(error));
    throw new Error("Could not record membership");
  }

  // Founding price: claim a place, or switch to the standard price before
  // the first payment if none is free (or it was lost before).
  if (parsed.founding && status !== "ended") {
    const { data: granted, error: claimError } = await admin.rpc("claim_founding_price", {
      target_user: userId,
    });
    if (claimError) console.error("Claim founding price failed:", errorCode(claimError));
    if (!claimError && granted === false) {
      const standard = await findPrice(parsed.plan, parsed.interval, false);
      await stripe().subscriptions.update(sub.id, {
        items: [{ id: item.id, price: standard.id }],
        proration_behavior: "none",
      });
      return "founding_full";
    }
  }
  return "ok";
}

/** Refreshes an account's membership from Stripe, if it has a subscription. */
export async function refreshFromStripe(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("memberships")
    .select("provider, provider_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (data?.provider !== "stripe" || !data.provider_subscription_id) return;
  try {
    await syncSubscription(userId, data.provider_subscription_id);
  } catch (error) {
    console.error("Refresh membership failed:", errorCode(error));
  }
}

/** The account's Stripe customer and subscription IDs, if any. */
export async function stripeIds(
  userId: string,
): Promise<{ customer: string | null; subscription: string | null }> {
  const { data } = await createAdminClient()
    .from("memberships")
    .select("provider_customer_id, provider_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    customer: data?.provider_customer_id ?? null,
    subscription: data?.provider_subscription_id ?? null,
  };
}
