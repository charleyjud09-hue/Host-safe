"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  parseInterval,
  parsePlan,
  type BillingInterval,
  type Membership,
  type PlanId,
} from "@/lib/membership";
import {
  getMembership,
  isPreviewState,
  PREVIEW_COOKIE,
  PREVIEW_INTERVAL_COOKIE,
  PREVIEW_PLAN_COOKIE,
  previewEnabled,
  type PreviewState,
} from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type JoinFormState = { error?: string };

async function requireUser() {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");
}

/**
 * Development only: switches the preview membership state. The plan and
 * billing period are kept unless new ones are given.
 */
async function setPreview(
  state: PreviewState,
  overrides: { plan?: PlanId; interval?: BillingInterval } = {},
) {
  const jar = await cookies();
  const options = { httpOnly: true, sameSite: "lax" as const, path: "/" };
  jar.set(PREVIEW_COOKIE, state, options);
  if (overrides.plan) jar.set(PREVIEW_PLAN_COOKIE, overrides.plan, options);
  if (overrides.interval) jar.set(PREVIEW_INTERVAL_COOKIE, overrides.interval, options);
}

/** The preview state matching a membership, for keeping it while changing plan. */
function stateFor(m: Membership): PreviewState {
  if (m.status === "trialing") return m.cancelAtPeriodEnd ? "trial-cancelled" : "trial";
  return m.cancelAtPeriodEnd ? "ending" : "active";
}

const billingUrl = (notice: string) => `/account/billing?notice=${notice}`;

/** Dev-only "Preview" switch on the billing page. */
export async function choosePreviewState(formData: FormData) {
  if (!previewEnabled) redirect("/account/billing");
  await requireUser();
  const state = formData.get("state");
  if (state === "reset") {
    const jar = await cookies();
    jar.delete(PREVIEW_COOKIE);
    jar.delete(PREVIEW_PLAN_COOKIE);
    jar.delete(PREVIEW_INTERVAL_COOKIE);
  } else if (isPreviewState(state)) {
    await setPreview(state, {
      plan: state.includes("premium") ? "premium" : "membership",
      interval: state.endsWith("-year") ? "year" : "month",
    });
  }
  redirect("/account/billing");
}

/**
 * Start a free trial (new members) or rejoin (returning members). Payments
 * aren't connected yet, so nothing is charged and no card details are
 * taken. In development the preview switches state so the rest of the
 * flow can be tried.
 */
export async function startMembership(
  _prev: JoinFormState,
  formData: FormData,
): Promise<JoinFormState> {
  await requireUser();
  const plan = parsePlan(formData.get("plan"));
  const interval = parseInterval(formData.get("interval"));

  const membership = await getMembership();
  if (membership.status === "trialing" || membership.status === "active") {
    redirect("/account/billing");
  }

  if (formData.get("accept_terms") !== "yes") {
    return { error: "Please tick the box to agree to the Terms and Privacy Notice." };
  }
  if (formData.get("start_now") !== "yes") {
    return { error: "Please tick the box to confirm you want to start straight away." };
  }

  if (!previewEnabled) {
    return {
      error:
        "Payments aren’t switched on yet, so you can’t join today. Nothing has been charged and no card details were taken.",
    };
  }
  const rejoining = membership.status === "ended";
  await setPreview(rejoining ? "active" : "trial", { plan, interval });
  redirect(billingUrl(rejoining ? "rejoined" : "trial-started"));
}

/** Cancel: stops renewal; access continues until the period ends. */
export async function cancelMembership(formData: FormData) {
  await requireUser();
  if (formData.get("confirm") !== "cancel") redirect("/account/billing/cancel");

  const membership = await getMembership();
  if (!previewEnabled) redirect(billingUrl("payments-off"));
  if (membership.status === "trialing") {
    await setPreview("trial-cancelled");
    redirect(billingUrl("trial-cancelled"));
  }
  if (membership.status === "active") await setPreview("ending");
  redirect(billingUrl("cancelled"));
}

/** Undo a cancellation before the period ends. */
export async function resumeMembership() {
  await requireUser();
  const membership = await getMembership();
  if (!previewEnabled) redirect(billingUrl("payments-off"));
  await setPreview(membership.status === "trialing" ? "trial" : "active");
  redirect(billingUrl("resumed"));
}

/** Switch between Membership and Premium. */
export async function changePlan(formData: FormData) {
  await requireUser();
  const plan = parsePlan(formData.get("plan"));
  const membership = await getMembership();
  if (!previewEnabled) redirect(billingUrl("payments-off"));
  if (membership.status === "trialing" || membership.status === "active") {
    await setPreview(stateFor(membership), { plan });
  }
  redirect(billingUrl("plan-changed"));
}
