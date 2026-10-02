import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  card,
  IntervalToggle,
  primaryButton,
  TrialConditions,
} from "@/components/MembershipParts";
import { addDays, ukToday } from "@/lib/attention";
import {
  canEdit,
  foundingOffered,
  parseInterval,
  parsePlan,
  PLAN_IDS,
  PLANS,
  priceLabel,
  TRIAL_DAYS,
} from "@/lib/membership";
import { getFoundingPlacesLeft, getMembership } from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your free trial | Letnook",
};

/**
 * Where new accounts land. Leads with the trial conditions so nobody adds
 * a card without knowing when, and how much, they'll first be charged.
 */
export default async function TrialPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; billing?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");

  const membership = await getMembership();
  if (canEdit(membership)) redirect("/account/billing");
  // The free trial is for new members; a returning member rejoins instead.
  const params = await searchParams;
  const plan = parsePlan(params.plan);
  const interval = parseInterval(params.billing);
  if (membership.status === "ended") {
    redirect(`/membership/join?plan=${plan}&billing=${interval}`);
  }

  const trialEnds = addDays(ukToday(), TRIAL_DAYS);
  const founding = foundingOffered(membership, await getFoundingPlacesLeft());
  const href = (p: string, i: string) => `/membership/trial?plan=${p}&billing=${i}`;

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-2xl px-5 py-10 sm:py-12">
          <h1 className="text-3xl font-semibold tracking-tight text-navy">
            Your {TRIAL_DAYS}-day free trial
          </h1>
          <p className="mt-3 text-slate-700">
            Please read these conditions before you start. They tell you exactly
            when you’d first be charged, and how to make sure you aren’t.
          </p>

          <section aria-labelledby="conditions-heading" className={`mt-8 ${card}`}>
            <h2 id="conditions-heading" className="text-xl font-semibold text-navy">
              The trial conditions
            </h2>
            <div className="mt-5">
              <TrialConditions
                plan={plan}
                interval={interval}
                trialEnds={trialEnds}
                founding={founding}
              />
            </div>
          </section>

          <section aria-labelledby="plan-heading" className={`mt-6 ${card}`}>
            <h2 id="plan-heading" className="text-xl font-semibold text-navy">
              Choose your plan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              You can switch plans at any time.{" "}
              <Link href="/membership" className="font-medium text-navy underline">
                Compare plans in full
              </Link>
            </p>
            <div className="mt-5">
              <IntervalToggle interval={interval} hrefFor={(i) => href(plan, i)} />
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {PLAN_IDS.map((id) => {
                const selected = id === plan;
                return (
                  <li key={id}>
                    <Link
                      href={href(id, interval)}
                      aria-current={selected ? "true" : undefined}
                      className={`block rounded-xl p-4 ring-1 hover:bg-slate-50 ${
                        selected ? "bg-teal-50/60 ring-2 ring-action" : "bg-white ring-slate-200"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-navy">{PLANS[id].name}</span>
                        {selected && (
                          <span className="text-xs font-semibold text-teal-800">Selected</span>
                        )}
                      </span>
                      <span className="mt-1 block text-sm text-slate-700">
                        {priceLabel(id, interval, founding)} after the trial · up to{" "}
                        {PLANS[id].propertyLimit} properties
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Link
              href={`/membership/join?plan=${plan}&billing=${interval}`}
              className={`mt-6 w-full ${primaryButton}`}
            >
              Continue to start your free trial
            </Link>
            <p className="mt-3 text-center text-sm text-slate-600">
              You’ll check your order on the next page. You pay nothing today.
            </p>
          </section>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
