import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { addDays, ukToday } from "@/lib/attention";
import { errorCode } from "@/lib/log";
import {
  canEdit,
  joinHref,
  READ_ONLY_ERROR,
  TRIAL_DAYS,
  type BillingInterval,
  type Membership,
  type PlanId,
} from "@/lib/membership";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Each account's membership comes from its server-written row in
 * public.memberships (no row = never joined). In development only, the
 * "Developer preview" on the billing page sets cookies that swap in other
 * states so every screen can be tested without touching the database.
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
  return { ...previewBase(state, today), complimentary: false };
}

function previewBase(state: PreviewState, today: string): Omit<Membership, "complimentary"> {
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
  return readMembership();
});

const NONE: Membership = {
  status: "none",
  plan: null,
  interval: null,
  periodEnd: null,
  cancelAtPeriodEnd: false,
  complimentary: false,
};

/** Same grace period as public.has_edit_access() in the database. */
const GRACE_MS = 3 * 86_400_000;

type MembershipRow = {
  plan: PlanId;
  billing_interval: BillingInterval;
  status: "trialing" | "active" | "past_due" | "ended" | "complimentary";
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

/**
 * Reads the signed-in user's row. Mirrors the database's own access rule,
 * so the app shows read-only exactly when the database would refuse a change.
 */
async function readMembership(): Promise<Membership> {
  if (!isSupabaseConfigured) return NONE;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NONE;

  const { data, error } = await supabase
    .from("memberships")
    .select("plan, billing_interval, status, current_period_end, cancel_at_period_end")
    .maybeSingle<MembershipRow>();

  if (error) {
    // The database still enforces access, so showing full access here can't
    // let anyone change anything they shouldn't; it just avoids a broken page.
    console.error("Read membership failed:", errorCode(error));
    return { ...NONE, status: "active", plan: "membership", interval: "month" };
  }
  if (!data) return NONE;

  const base = {
    plan: data.plan,
    interval: data.billing_interval,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  };
  if (data.status === "complimentary") {
    return { ...base, status: "active", periodEnd: null, complimentary: true };
  }

  const periodEndMs = data.current_period_end ? Date.parse(data.current_period_end) : 0;
  const lapsed = periodEndMs + GRACE_MS < Date.now();
  if (data.status === "ended" || lapsed) {
    return { ...base, status: "ended", periodEnd: null, complimentary: false };
  }
  return {
    ...base,
    status: data.status === "trialing" ? "trialing" : "active",
    periodEnd: ukToday(new Date(periodEndMs)),
    complimentary: false,
  };
}

/** For server actions that add or change things: an error message, or null. */
export async function editBlockedMessage(): Promise<string | null> {
  return canEdit(await getMembership()) ? null : READ_ONLY_ERROR;
}

/** For server actions without form state: sends a read-only user to join. */
export async function requireEditAccess(): Promise<void> {
  const membership = await getMembership();
  if (!canEdit(membership)) redirect(joinHref(membership));
}
