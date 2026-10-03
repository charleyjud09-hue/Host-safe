"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { errorCode } from "@/lib/log";
import {
  canEdit,
  foundingOffered,
  parseInterval,
  parsePlan,
  PLANS,
  type BillingInterval,
  type Membership,
  type PlanId,
} from "@/lib/membership";
import {
  getFoundingPlacesLeft,
  getMembership,
  isPreviewing,
  isPreviewState,
  PREVIEW_COOKIE,
  PREVIEW_INTERVAL_COOKIE,
  PREVIEW_PLAN_COOKIE,
  previewEnabled,
  type PreviewState,
} from "@/lib/membership-server";
import { stripeIds, syncSubscription } from "@/lib/membership-sync";
import { findPrice, isStripeConfigured, parseLookupKey, stripe } from "@/lib/stripe";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type JoinFormState = { error?: string; clientSecret?: string };

async function requireUser() {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");
  return data.user;
}

/** Real payments run when Stripe and the server key are set, and no preview is on. */
async function usesStripe(): Promise<boolean> {
  return isStripeConfigured && isAdminConfigured && !(await isPreviewing());
}

async function siteOrigin(): Promise<string> {
  const h = await headers();
  return h.get("origin") ?? `http://${h.get("host")}`;
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

/** The account's Stripe customer, found by its Letnook user ID or created. */
async function customerFor(userId: string, email: string | undefined): Promise<string> {
  const known = (await stripeIds(userId)).customer;
  if (known) return known;
  const found = await stripe().customers.search({ query: `metadata['user_id']:'${userId}'` });
  if (found.data[0]) return found.data[0].id;
  const created = await stripe().customers.create({ email, metadata: { user_id: userId } });
  return created.id;
}

/**
 * Start a free trial (new members) or rejoin (returning members). With
 * Stripe set up, this returns a checkout for Stripe's embedded card form;
 * card details go straight to Stripe. Without it (or while previewing),
 * the dev preview switches state instead.
 */
export async function startMembership(
  _prev: JoinFormState,
  formData: FormData,
): Promise<JoinFormState> {
  const user = await requireUser();
  const plan = parsePlan(formData.get("plan"));
  const interval = parseInterval(formData.get("interval"));

  const membership = await getMembership();
  if (canEdit(membership)) redirect("/account/billing");

  if (formData.get("accept_terms") !== "yes") {
    return { error: "Please tick the box to agree to the Terms and Privacy Notice." };
  }
  if (formData.get("start_now") !== "yes") {
    return { error: "Please tick the box to confirm you want to start straight away." };
  }

  const rejoining = membership.status === "ended";

  if (await usesStripe()) {
    try {
      const founding = foundingOffered(membership, await getFoundingPlacesLeft());
      const price = await findPrice(plan, interval, founding);
      const session = await stripe().checkout.sessions.create({
        ui_mode: "embedded_page",
        mode: "subscription",
        customer: await customerFor(user.id, user.email),
        client_reference_id: user.id,
        line_items: [{ price: price.id, quantity: 1 }],
        // One free trial per account: returning members pay straight away.
        subscription_data: {
          ...(rejoining ? {} : { trial_period_days: 30 }),
          metadata: { user_id: user.id },
        },
        payment_method_collection: "always",
        billing_address_collection: "required",
        metadata: { user_id: user.id },
        return_url: `${await siteOrigin()}/membership/complete?session_id={CHECKOUT_SESSION_ID}`,
      });
      if (!session.client_secret) throw new Error("No client secret");
      return { clientSecret: session.client_secret };
    } catch (error) {
      console.error("Start checkout failed:", errorCode(error));
      return { error: "We couldn’t open the payment form. Please try again in a moment." };
    }
  }

  if (!previewEnabled) {
    return {
      error:
        "Payments aren’t switched on yet, so you can’t join today. Nothing has been charged and no card details were taken.",
    };
  }
  await setPreview(rejoining ? "active" : "trial", { plan, interval });
  redirect(billingUrl(rejoining ? "rejoined" : "trial-started"));
}

/** The signed-in account's Stripe subscription, or a redirect if there isn't one. */
async function requireSubscription(userId: string): Promise<string> {
  const { subscription } = await stripeIds(userId);
  if (!subscription) redirect(billingUrl("payments-off"));
  return subscription;
}

/** Cancel: stops renewal; access continues until the period ends. */
export async function cancelMembership(formData: FormData) {
  const user = await requireUser();
  if (formData.get("confirm") !== "cancel") redirect("/account/billing/cancel");
  const membership = await getMembership();

  if (await usesStripe()) {
    const id = await requireSubscription(user.id);
    await stripe().subscriptions.update(id, { cancel_at_period_end: true });
    await syncSubscription(user.id, id);
    redirect(billingUrl(membership.status === "trialing" ? "trial-cancelled" : "cancelled"));
  }

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
  const user = await requireUser();
  const membership = await getMembership();

  if (await usesStripe()) {
    const id = await requireSubscription(user.id);
    await stripe().subscriptions.update(id, { cancel_at_period_end: false });
    await syncSubscription(user.id, id);
    redirect(billingUrl("resumed"));
  }

  if (!previewEnabled) redirect(billingUrl("payments-off"));
  await setPreview(membership.status === "trialing" ? "trial" : "active");
  redirect(billingUrl("resumed"));
}

/** Switch between Membership and Premium, keeping the billing period and any founding price. */
export async function changePlan(formData: FormData) {
  const user = await requireUser();
  const plan = parsePlan(formData.get("plan"));
  const membership = await getMembership();
  if (!canEdit(membership) || membership.complimentary) redirect("/account/billing");

  // Moving down to Membership needs the property count to fit its limit.
  if (plan === "membership") {
    const supabase = await createClient();
    const { count } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) > PLANS.membership.propertyLimit) redirect(billingUrl("too-many-properties"));
  }

  if (await usesStripe()) {
    const id = await requireSubscription(user.id);
    const sub = await stripe().subscriptions.retrieve(id);
    const item = sub.items.data[0];
    const current = parseLookupKey(item?.price.lookup_key);
    if (!item || !current) redirect(billingUrl("payments-off"));
    const price = await findPrice(plan, current.interval, membership.foundingPrice);
    await stripe().subscriptions.update(id, {
      items: [{ id: item.id, price: price.id }],
      proration_behavior: "create_prorations",
    });
    await syncSubscription(user.id, id);
    redirect(billingUrl("plan-changed"));
  }

  if (!previewEnabled) redirect(billingUrl("payments-off"));
  await setPreview(stateFor(membership), { plan });
  redirect(billingUrl("plan-changed"));
}

/** Opens Stripe's secure page for updating the card and seeing receipts. */
export async function openBillingPortal() {
  const user = await requireUser();
  if (!(await usesStripe())) redirect(billingUrl("payments-off"));
  const { customer } = await stripeIds(user.id);
  if (!customer) redirect(billingUrl("payments-off"));

  let url: string;
  try {
    const session = await stripe().billingPortal.sessions.create({
      customer,
      return_url: `${await siteOrigin()}/account/billing`,
    });
    url = session.url;
  } catch (error) {
    console.error("Open billing portal failed:", errorCode(error));
    redirect(billingUrl("portal-unavailable"));
  }
  redirect(url);
}
