import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { addDays, ukToday } from "@/lib/attention";
import {
  canEdit,
  joinHref,
  READ_ONLY_ERROR,
  TRIAL_DAYS,
  type Membership,
} from "@/lib/membership";

/**
 * Phase 1 has no membership table and no payments, so everyone is treated
 * as an active member. In development only, a preview cookie (set from
 * /membership/preview) swaps in other states so every screen can be tested.
 * Phase 2 replaces this with a lookup of the server-written membership row.
 */
export const PREVIEW_COOKIE = "letnook_membership_preview";
/** Optional overrides for the preview state's billing period and plan. */
export const PREVIEW_INTERVAL_COOKIE = "letnook_membership_preview_interval";
export const PREVIEW_PLAN_COOKIE = "letnook_membership_preview_plan";
export const previewEnabled = process.env.NODE_ENV !== "production";

export const PREVIEW_STATES = {
  none: "New account, no trial started",
  trial: "Membership free trial (just started)",
  "trial-premium": "Premium free trial (just started)",
  "trial-cancelled": "Free trial, cancelled (won’t be charged)",
  active: "Membership, monthly",
  "active-premium-year": "Premium, yearly",
  ending: "Membership, cancelled (ends at period end)",
  ended: "Membership ended (read-only)",
} as const;

export type PreviewState = keyof typeof PREVIEW_STATES;

export function isPreviewState(value: unknown): value is PreviewState {
  return typeof value === "string" && value in PREVIEW_STATES;
}

function previewMembership(state: PreviewState, today: string): Membership {
  switch (state) {
    case "none":
      return { status: "none", plan: null, interval: null, periodEnd: null, cancelAtPeriodEnd: false };
    case "trial":
    case "trial-premium":
    case "trial-cancelled":
      return {
        status: "trialing",
        plan: state === "trial-premium" ? "premium" : "membership",
        interval: "month",
        periodEnd: addDays(today, TRIAL_DAYS),
        cancelAtPeriodEnd: state === "trial-cancelled",
      };
    case "active":
    case "ending":
      return {
        status: "active",
        plan: "membership",
        interval: "month",
        periodEnd: addDays(today, 12),
        cancelAtPeriodEnd: state === "ending",
      };
    case "active-premium-year":
      return {
        status: "active",
        plan: "premium",
        interval: "year",
        periodEnd: addDays(today, 200),
        cancelAtPeriodEnd: false,
      };
    case "ended":
      return { status: "ended", plan: "membership", interval: "month", periodEnd: null, cancelAtPeriodEnd: false };
  }
}

/** The signed-in user's membership. Cached for the length of one request. */
export const getMembership = cache(async (): Promise<Membership> => {
  const today = ukToday();
  if (previewEnabled) {
    const jar = await cookies();
    const preview = jar.get(PREVIEW_COOKIE)?.value;
    if (isPreviewState(preview)) {
      const m = previewMembership(preview, today);
      const interval = jar.get(PREVIEW_INTERVAL_COOKIE)?.value;
      const plan = jar.get(PREVIEW_PLAN_COOKIE)?.value;
      return {
        ...m,
        interval: m.interval && (interval === "month" || interval === "year") ? interval : m.interval,
        plan: m.plan && (plan === "membership" || plan === "premium") ? plan : m.plan,
      };
    }
  }
  return previewMembership("active", today);
});

/** For server actions that add or change things: an error message, or null. */
export async function editBlockedMessage(): Promise<string | null> {
  return canEdit(await getMembership()) ? null : READ_ONLY_ERROR;
}

/** For server actions without form state: sends a read-only user to join. */
export async function requireEditAccess(): Promise<void> {
  const membership = await getMembership();
  if (!canEdit(membership)) redirect(joinHref(membership));
}
