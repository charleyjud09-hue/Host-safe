import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import JoinForm from "@/components/JoinForm";
import { BillingChoice, card, SellerDetails } from "@/components/MembershipParts";
import { addDays, ukToday } from "@/lib/attention";
import {
  canEdit,
  formatLongDate,
  parseInterval,
  parsePlan,
  PLANS,
  planPrice,
  priceLabel,
  TRIAL_DAYS,
} from "@/lib/membership";
import { getMembership } from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Join Letnook | Letnook",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; billing?: string; reason?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");

  const membership = await getMembership();
  if (canEdit(membership)) redirect("/account/billing");

  const params = await searchParams;
  const plan = parsePlan(params.plan);
  const interval = parseInterval(params.billing);
  const rejoining = membership.status === "ended";
  const today = ukToday();
  const firstCharge = rejoining ? today : addDays(today, TRIAL_DAYS);
  const price = planPrice(plan, interval);

  const row = "flex items-baseline justify-between gap-4 py-3";

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-xl px-5 py-10 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
            <Link
              href={rejoining ? "/membership" : `/membership/trial?plan=${plan}&billing=${interval}`}
              className="hover:text-navy"
            >
              {rejoining ? "Pricing" : "Trial conditions"}
            </Link>
          </nav>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy">
            {rejoining ? "Join Back" : "Start your free trial"}
          </h1>

          {params.reason === "read-only" && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-950 ring-1 ring-amber-200"
            >
              Your account is read-only because you don’t have an active
              membership. You can still view, download and delete your records.
            </p>
          )}

          <section aria-labelledby="billing-heading" className="mt-6">
            <h2 id="billing-heading" className="text-xl font-semibold text-navy">
              How would you like to pay for {PLANS[plan].name}?
            </h2>
            <div className="mt-4">
              <BillingChoice
                plan={plan}
                interval={interval}
                hrefFor={(i) => `/membership/join?plan=${plan}&billing=${i}`}
              />
            </div>
          </section>

          <section aria-labelledby="summary-heading" className={`mt-6 ${card}`}>
            <h2 id="summary-heading" className="text-xl font-semibold text-navy">
              Your order
            </h2>
            <dl className="mt-3 divide-y divide-slate-200 text-slate-800">
              <div className={row}>
                <dt>Plan</dt>
                <dd className="text-right font-medium">
                  {PLANS[plan].name}, up to {PLANS[plan].propertyLimit} properties
                </dd>
              </div>
              <div className={row}>
                <dt>Price</dt>
                <dd className="text-right font-medium">
                  {priceLabel(plan, interval)}, renews automatically
                </dd>
              </div>
              <div className={row}>
                <dt>Pay today</dt>
                <dd className="text-right text-lg font-semibold text-navy">
                  £{rejoining ? price : 0}
                </dd>
              </div>
              <div className={row}>
                <dt>{rejoining ? "Next payment" : "First payment"}</dt>
                <dd className="text-right font-medium">
                  £{price} on{" "}
                    {formatLongDate(
                    rejoining ? addDays(firstCharge, interval === "year" ? 365 : 30) : firstCharge,
                  )}
                  {!rejoining && ", unless you cancel before then"}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-slate-600">
              <Link
                href={`/membership/join?plan=${plan === "premium" ? "membership" : "premium"}&billing=${interval}`}
                className="font-medium text-navy underline"
              >
                Switch to {plan === "premium" ? PLANS.membership.name : PLANS.premium.name}
              </Link>
            </p>
            {!rejoining && (
              <p className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-slate-800 ring-1 ring-teal-200">
                Cancel at any time before {formatLongDate(firstCharge)} and you
                won’t be charged anything.
              </p>
            )}
          </section>

          <section aria-labelledby="pay-heading" className={`mt-6 ${card}`}>
            <h2 id="pay-heading" className="text-xl font-semibold text-navy">
              {rejoining ? "Payment" : "Add your card"}
            </h2>
            <div className="mt-5">
              <JoinForm
                plan={plan}
                interval={interval}
                mode={rejoining ? "rejoin" : "trial"}
                buttonLabel={
                  rejoining
                    ? `Join Back and pay ${priceLabel(plan, interval)}`
                    : `Start free trial, then pay ${priceLabel(plan, interval)}`
                }
              />
            </div>
          </section>

          <section aria-labelledby="seller-heading" className={`mt-6 ${card}`}>
            <h2 id="seller-heading" className="text-base font-semibold text-navy">
              Who you’re buying from
            </h2>
            <div className="mt-3">
              <SellerDetails />
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Letnook is an organisational tool. It doesn’t give legal, safety or
              compliance advice, and doesn’t check or approve any property.
            </p>
          </section>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
