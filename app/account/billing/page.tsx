import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { changePlan, choosePreviewState, resumeMembership } from "@/app/membership/actions";
import AccountPage from "@/components/AccountPage";
import {
  PaymentPlaceholder,
  primaryButton,
  secondaryButton,
} from "@/components/MembershipParts";
import { ukToday } from "@/lib/attention";
import {
  canEdit,
  daysBetween,
  formatLongDate,
  JOIN_BACK_CTA,
  PLANS,
  priceLabel,
  propertyLimit,
  TRIAL_CTA,
  type Membership,
} from "@/lib/membership";
import {
  getMembership,
  PREVIEW_COOKIE,
  PREVIEW_STATES,
  previewEnabled,
} from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Subscription & billing | Letnook",
};

const notices: Record<string, string> = {
  "trial-started": "Your free trial has started (preview only: nothing was charged).",
  rejoined: "Welcome back. Your membership is active again (preview only: nothing was charged).",
  cancelled: "Your membership has been cancelled. You won’t be charged again.",
  "trial-cancelled": "Your free trial has been cancelled. You won’t be charged anything.",
  resumed: "Your membership will carry on as normal.",
  "plan-changed": "Your plan has been changed.",
  "payments-off":
    "Payments aren’t switched on yet, so nothing has changed. This will work once payments are connected.",
};

function StatusSummary({ m, today }: { m: Membership; today: string }) {
  const plan = m.plan ? PLANS[m.plan] : null;
  const price = m.plan && m.interval ? priceLabel(m.plan, m.interval) : "";
  const date = m.periodEnd ? formatLongDate(m.periodEnd) : "";

  if (m.complimentary) {
    return (
      <>
        <p className="text-lg font-semibold text-navy">{plan?.name} · complimentary</p>
        <p className="mt-1 text-slate-700">
          You have full access free of charge. There are no payments to manage.
        </p>
      </>
    );
  }
  if (m.status === "none") {
    return (
      <>
        <p className="text-lg font-semibold text-navy">No membership yet</p>
        <p className="mt-1 text-slate-700">
          Start a 30-day free trial to add your properties and records.
        </p>
        <Link href="/membership/trial" className={`mt-4 ${primaryButton}`}>
          {TRIAL_CTA}
        </Link>
      </>
    );
  }
  if (m.status === "ended") {
    return (
      <>
        <p className="text-lg font-semibold text-navy">Membership ended</p>
        <p className="mt-1 text-slate-700">
          Your account is read-only. You can still view, download and delete
          everything. Rejoin to add or change things.
        </p>
        <Link href="/membership/join" className={`mt-4 ${primaryButton}`}>
          {JOIN_BACK_CTA}
        </Link>
      </>
    );
  }

  const daysLeft = m.periodEnd ? daysBetween(today, m.periodEnd) : 0;
  let detail: string;
  if (m.status === "trialing") {
    detail = m.cancelAtPeriodEnd
      ? `Trial cancelled: you won’t be charged. You can keep using Letnook until ${date}, then your account becomes read-only.`
      : `Free trial: ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left. Your first payment of ${price} will be taken on ${date} unless you cancel before then.`;
  } else {
    detail = m.cancelAtPeriodEnd
      ? `Cancelled: you won’t be charged again. Your access continues until ${date}, then your account becomes read-only.`
      : `Active. Your next payment of ${price} is on ${date}.`;
  }

  return (
    <>
      <p className="text-lg font-semibold text-navy">
        {plan?.name} · {price}
      </p>
      <p className="mt-1 text-slate-700">{detail}</p>
      {m.cancelAtPeriodEnd && (
        <form action={resumeMembership} className="mt-4">
          <button type="submit" className={primaryButton}>
            {m.status === "trialing" ? "Keep my trial going" : "Don’t cancel"}
          </button>
        </form>
      )}
    </>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { notice } = await searchParams;
  const membership = await getMembership();
  const today = ukToday();
  const active = canEdit(membership);
  // Complimentary access has no plan to change, nothing to pay and nothing to cancel.
  const paying = active && !membership.complimentary;
  const otherPlan = membership.plan === "premium" ? "membership" : "premium";

  const { count } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true });

  const previewState = previewEnabled
    ? (await cookies()).get(PREVIEW_COOKIE)?.value ?? ""
    : "";

  const section = "border-t border-slate-200 pt-6";

  return (
    <AccountPage title="Subscription & billing">
      <div className="space-y-6">
        {notice && notices[notice] && (
          <p
            role="status"
            className="rounded-lg bg-teal-50 p-3 text-slate-800 ring-1 ring-teal-200"
          >
            {notices[notice]}
          </p>
        )}

        <div>
          <StatusSummary m={membership} today={today} />
        </div>

        {active && membership.plan && (
          <div className={section}>
            <h2 className="font-semibold text-navy">Usage</h2>
            <p className="mt-1 text-slate-700">
              {count ?? 0} of {propertyLimit(membership)} properties ·{" "}
              {PLANS[membership.plan].storageGb}GB file storage (fair use)
            </p>
          </div>
        )}

        {paying && (
          <div className={section}>
            <h2 className="font-semibold text-navy">Change plan</h2>
            <p className="mt-1 text-slate-700">
              {PLANS[otherPlan].name}: {priceLabel(otherPlan, "month")} or{" "}
              {priceLabel(otherPlan, "year")}, up to {PLANS[otherPlan].propertyLimit}{" "}
              properties.{" "}
              <Link href="/membership" className="font-medium text-navy underline">
                Compare plans
              </Link>
            </p>
            {otherPlan === "membership" && (count ?? 0) > PLANS.membership.propertyLimit && (
              <p className="mt-2 text-sm text-amber-900">
                You have more than {PLANS.membership.propertyLimit} properties, so
                you’d need to remove some before switching.
              </p>
            )}
            <form action={changePlan} className="mt-4">
              <input type="hidden" name="plan" value={otherPlan} />
              <button
                type="submit"
                disabled={
                  otherPlan === "membership" && (count ?? 0) > PLANS.membership.propertyLimit
                }
                className={`${secondaryButton} disabled:opacity-50`}
              >
                Switch to {PLANS[otherPlan].name}
              </button>
            </form>
          </div>
        )}

        {!membership.complimentary && (
          <>
            <div className={section}>
              <h2 className="font-semibold text-navy">Payment method</h2>
              <div className="mt-3">
                <PaymentPlaceholder title="Your card will appear here" />
              </div>
            </div>

            <div className={section}>
              <h2 className="font-semibold text-navy">Invoices</h2>
              <p className="mt-1 text-slate-600">
                Your receipts will be listed here once payments are switched on.
              </p>
            </div>
          </>
        )}

        {paying && !membership.cancelAtPeriodEnd && (
          <div className={section}>
            <h2 className="font-semibold text-navy">Cancel membership</h2>
            <p className="mt-1 text-slate-700">
              {membership.status === "trialing"
                ? "Cancel during your trial and you won’t be charged anything."
                : "You keep access until the end of the time you’ve paid for."}
            </p>
            <Link
              href="/account/billing/cancel"
              className="mt-4 inline-flex rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-700 hover:bg-red-50"
            >
              Cancel membership
            </Link>
          </div>
        )}

        {previewEnabled && (
          <div className="rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 p-5">
            <h2 className="font-semibold text-violet-950">Developer preview</h2>
            <p className="mt-1 text-sm text-violet-950">
              Only on your local dev server, never on the live site. Switch your
              membership state to try each screen. Nothing is charged and the
              database isn’t changed, so it still enforces your real membership
              when you save.
            </p>
            <form action={choosePreviewState} className="mt-4 flex flex-wrap gap-3">
              <label htmlFor="preview-state" className="sr-only">
                Preview as
              </label>
              <select
                id="preview-state"
                name="state"
                defaultValue={previewState || "active"}
                className="min-w-0 flex-1 rounded-lg border border-violet-300 bg-white px-3 py-2 text-slate-900"
              >
                {Object.entries(PREVIEW_STATES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-violet-700 px-4 py-2 font-medium text-white hover:bg-violet-800"
              >
                Preview
              </button>
            </form>
            {previewState && (
              <form action={choosePreviewState} className="mt-2">
                <input type="hidden" name="state" value="reset" />
                <button type="submit" className="text-sm font-medium text-violet-900 underline">
                  Stop previewing (back to your real membership)
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </AccountPage>
  );
}
