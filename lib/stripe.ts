import Stripe from "stripe";
import type { BillingInterval, PlanId } from "@/lib/membership";

/**
 * Server-only Stripe helpers. The secret key comes from .env.local (or the
 * hosting settings) and is never sent to the browser or stored in the
 * database. Card details never reach Letnook: Stripe's embedded checkout
 * collects them directly.
 */

const secretKey = process.env.STRIPE_SECRET_KEY;

/** True once a Stripe secret key is set. Until then the payment step stays a placeholder. */
export const isStripeConfigured = Boolean(secretKey?.startsWith("sk_"));

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!secretKey) throw new Error("Stripe is not configured");
  client ??= new Stripe(secretKey);
  return client;
}

/**
 * Prices are found by lookup key rather than hard-coded IDs, so the same code
 * works with the sandbox and the live account. scripts/stripe-setup.mjs
 * creates them.
 */
export function priceLookupKey(plan: PlanId, interval: BillingInterval, founding: boolean): string {
  return `letnook_${plan}_${interval}_${founding ? "founding" : "standard"}`;
}

export async function findPrice(
  plan: PlanId,
  interval: BillingInterval,
  founding: boolean,
): Promise<Stripe.Price> {
  const key = priceLookupKey(plan, interval, founding);
  const { data } = await stripe().prices.list({ lookup_keys: [key], active: true, limit: 1 });
  if (!data[0]) throw new Error(`Missing Stripe price ${key}; run scripts/stripe-setup.mjs`);
  return data[0];
}

/** Reads plan, interval and founding back from a price's lookup key. */
export function parseLookupKey(
  key: string | null | undefined,
): { plan: PlanId; interval: BillingInterval; founding: boolean } | null {
  const match = key?.match(/^letnook_(membership|premium)_(month|year)_(founding|standard)$/);
  if (!match) return null;
  return {
    plan: match[1] as PlanId,
    interval: match[2] as BillingInterval,
    founding: match[3] === "founding",
  };
}
