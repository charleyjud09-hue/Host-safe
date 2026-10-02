/**
 * Membership plans, prices and status.
 * Shared by server and client code, so nothing here reads cookies or the DB;
 * see lib/membership-server.ts for how the current membership is found.
 */

export type PlanId = "membership" | "premium";
export type BillingInterval = "month" | "year";

export type Plan = {
  id: PlanId;
  name: string;
  /** Pounds, VAT position still to be confirmed (see pricing page). */
  monthly: number;
  yearly: number;
  /** Founding-member prices for the first FOUNDING_PLACES members. */
  founding: { monthly: number; yearly: number };
  propertyLimit: number;
  /** Fair-use file storage. Not enforced until phase 2. */
  storageGb: number;
  /** Extra features on top of everything in Membership. */
  extras: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  membership: {
    id: "membership",
    name: "Membership",
    monthly: 16,
    // Yearly = one month free (11 × monthly).
    yearly: 176,
    founding: { monthly: 12, yearly: 132 },
    propertyLimit: 5,
    storageGb: 10,
    extras: [],
  },
  premium: {
    id: "premium",
    name: "Premium",
    monthly: 35,
    yearly: 385,
    founding: { monthly: 29, yearly: 319 },
    propertyLimit: 25,
    storageGb: 50,
    extras: [
      "See all your properties on one page",
      "Copy a to-do list to several properties at once",
      "Download your records as a PDF or spreadsheet",
      "Premium questions answered first",
    ],
  },
};

export const PLAN_IDS: PlanId[] = ["membership", "premium"];
export const TRIAL_DAYS = 30;

/** Matches the 50 in docs/database/2026-10-02_08_founding_price.sql. */
export const FOUNDING_PLACES = 50;

/** What a founding member keeps, and how they'd lose it. Shown wherever the price is. */
export const FOUNDING_TERMS =
  "You keep the founding price for as long as your membership continues. It ends for good if your membership ends: if you cancel, if payments can’t be taken and your membership stops, or if you delete your account.";

/**
 * "none": never started a trial. "trialing"/"active": full access.
 * "ended": read-only. cancelAtPeriodEnd means it won't renew after periodEnd.
 */
export type MembershipStatus = "none" | "trialing" | "active" | "ended";

export type Membership = {
  status: MembershipStatus;
  plan: PlanId | null;
  interval: BillingInterval | null;
  /** YYYY-MM-DD: trial end while trialing, next renewal while active. */
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** Free full access granted by Letnook (e.g. accounts from before launch). */
  complimentary: boolean;
  /** Holds a founding-member price. */
  foundingPrice: boolean;
  /** Held a founding price before and lost it when the membership ended. */
  foundingLost: boolean;
};

/** Adding and changing things needs a trial or an active membership. */
export function canEdit(m: Membership): boolean {
  return m.status === "trialing" || m.status === "active";
}

export function propertyLimit(m: Membership): number {
  return m.plan && canEdit(m) ? PLANS[m.plan].propertyLimit : 0;
}

export function parsePlan(value: unknown): PlanId {
  return value === "premium" ? "premium" : "membership";
}

export function parseInterval(value: unknown): BillingInterval {
  return value === "year" ? "year" : "month";
}

export function planPrice(plan: PlanId, interval: BillingInterval, founding = false): number {
  const prices = founding ? PLANS[plan].founding : PLANS[plan];
  return interval === "year" ? prices.yearly : prices.monthly;
}

/** What paying yearly saves compared with 12 monthly payments (one month). */
export function yearlySaving(plan: PlanId, founding = false): number {
  return planPrice(plan, "month", founding) * 12 - planPrice(plan, "year", founding);
}

/** "£16 a month" / "£176 a year" (or the founding price). */
export function priceLabel(plan: PlanId, interval: BillingInterval, founding = false): string {
  return `£${planPrice(plan, interval, founding)} a ${interval}`;
}

/**
 * Whether this account would get the founding price if it joined now:
 * places must be left, and it can't have lost a founding price before.
 */
export function foundingOffered(m: Membership | null, placesLeft: number): boolean {
  if (m?.foundingPrice) return true;
  return placesLeft > 0 && !m?.foundingLost && !(m && canEdit(m));
}

/** "1 October 2026". */
export function formatLongDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Whole days from `today` to `date` (both YYYY-MM-DD). */
export function daysBetween(today: string, date: string): number {
  const ms = Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Where to send someone who tries to add or change things without access. */
export function joinHref(m: Membership): string {
  return m.status === "none" ? "/membership/trial" : "/membership/join?reason=read-only";
}

export const TRIAL_CTA = "Redeem 30-day trial FREE";
export const JOIN_BACK_CTA = "Join Back";
export const MY_SUBSCRIPTION_CTA = "My Subscription";

/**
 * The one membership button shown across the app, by account state:
 * never joined, subscribed (trial or paying), or ended.
 */
export function membershipCta(m: Membership): { href: string; label: string } {
  if (m.status === "none") return { href: "/membership/trial", label: TRIAL_CTA };
  if (m.status === "ended") return { href: "/membership/join", label: JOIN_BACK_CTA };
  return { href: "/account/billing", label: MY_SUBSCRIPTION_CTA };
}

/** Shown when the plan's property limit is reached. */
export function propertyLimitMessage(m: Membership): string {
  const limit = propertyLimit(m);
  return m.plan === "premium"
    ? `Premium covers up to ${limit} properties. If you need more, get in touch.`
    : `Membership covers up to ${limit} properties. Switch to Premium for up to ${PLANS.premium.propertyLimit}.`;
}

/**
 * The database refuses read-only and over-limit writes itself (hints set in
 * docs/database/2026-10-01_07_memberships.sql). Turns those refusals into
 * friendly messages; returns null for any other error.
 */
export function membershipDbErrorMessage(error: { hint?: string | null } | null): string | null {
  if (error?.hint === "read_only") return READ_ONLY_ERROR;
  if (error?.hint === "property_limit") {
    return "You’ve reached your plan’s property limit. Switch to Premium for up to 25 properties.";
  }
  return null;
}

export const READ_ONLY_ERROR =
  "Your account is read-only because you don’t have an active membership. Redeem your 30-day free trial, or Join Back, to add or change things.";
