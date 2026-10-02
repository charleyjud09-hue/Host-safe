import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  card,
  IntervalToggle,
  PlanCards,
  SellerDetails,
  TrialConditions,
} from "@/components/MembershipParts";
import {
  canEdit,
  FOUNDING_PLACES,
  FOUNDING_TERMS,
  foundingOffered,
  JOIN_BACK_CTA,
  priceLabel,
  MY_SUBSCRIPTION_CTA,
  parseInterval,
  PLANS,
  TRIAL_CTA,
  type Membership,
} from "@/lib/membership";
import { getFoundingPlacesLeft, getMembership } from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing | Letnook",
  description:
    "Letnook Membership and Premium: one price for every feature, with a 30-day free trial.",
};

const faqs = [
  {
    q: "Do I need a card for the free trial?",
    a: "Yes. You add a card to start, but you pay nothing for the first 30 days. Cancel before the trial ends and you’re never charged.",
  },
  {
    q: "How do I cancel?",
    a: "Any time, in Account settings under Subscription & billing. You keep access until the end of the time you’ve paid for (or the end of your trial), and you aren’t charged again.",
  },
  {
    q: "What happens to my records if I stop?",
    a: "They stay in your account. Without a membership your account becomes read-only: you can still view, download and delete everything, but not add or change things. Rejoin at any time to carry on.",
  },
  {
    q: "Can I switch between Membership and Premium?",
    a: "Yes, at any time from Subscription & billing.",
  },
  {
    q: "I have more than 25 properties.",
    a: "Get in touch and we’ll talk about what you need.",
  },
  {
    q: "Does a membership include legal or safety advice?",
    a: "No. Letnook is an organisational tool. It doesn’t give legal, safety or compliance advice and doesn’t check or approve any property. You remain responsible for your property and your legal obligations.",
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const { billing } = await searchParams;
  const interval = parseInterval(billing);

  let membership: Membership | null = null;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) membership = await getMembership();
  }
  const placesLeft = await getFoundingPlacesLeft();
  const founding = foundingOffered(membership, placesLeft);

  const cta = (plan: "membership" | "premium") => {
    const query = `plan=${plan}&billing=${interval}`;
    if (!membership) {
      return { href: "/sign-up", label: "Create an account to start" };
    }
    if (canEdit(membership)) {
      if (membership.plan === plan) return { href: "/account/billing", label: MY_SUBSCRIPTION_CTA };
      return membership.complimentary
        ? null
        : { href: "/account/billing", label: `Switch to ${PLANS[plan].name}` };
    }
    return membership.status === "none"
      ? { href: `/membership/trial?${query}`, label: TRIAL_CTA }
      : { href: `/membership/join?${query}`, label: JOIN_BACK_CTA };
  };

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              Membership
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-slate-700">
              One price for every feature, with a 30-day free trial. Cancel any
              time.
            </p>
            {founding && placesLeft > 0 && !membership?.foundingPrice && (
              <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-amber-50 p-4 text-left text-amber-950 ring-1 ring-amber-200">
                <p className="font-semibold">
                  Founding member price for the first {FOUNDING_PLACES} members:{" "}
                  {priceLabel("membership", "month", true)} instead of{" "}
                  {priceLabel("membership", "month")}
                </p>
                <p className="mt-1 text-sm">
                  {placesLeft} of {FOUNDING_PLACES} places left. {FOUNDING_TERMS}
                </p>
              </div>
            )}
            <div className="mt-6">
              <IntervalToggle
                interval={interval}
                hrefFor={(i) => (i === "year" ? "/membership?billing=year" : "/membership")}
              />
            </div>
          </div>

          <div className="mt-10">
            <PlanCards
              interval={interval}
              cta={cta}
              currentPlan={membership && canEdit(membership) ? membership.plan : null}
              founding={founding}
            />
          </div>
          <p className="mt-4 text-center text-sm text-slate-600">
            Coming later for both plans: bring in bookings from Airbnb and
            Booking.com automatically. More than 25 properties? Get in touch.
          </p>

          <section aria-labelledby="trial-heading" className={`mt-12 ${card}`}>
            <h2 id="trial-heading" className="text-xl font-semibold text-navy">
              How the free trial works
            </h2>
            <div className="mt-5">
              <TrialConditions
                plan="membership"
                interval={interval}
                trialEnds={null}
                founding={founding}
              />
            </div>
            <p className="mt-5 text-sm text-slate-600">
              Prices are for Membership; Premium works the same way at its own
              price. You also have a legal right to cancel within 14 days of
              joining. As the trial lasts 30 days, cancelling in that time means
              you pay nothing.
            </p>
          </section>

          <section aria-labelledby="faq-heading" className={`mt-6 ${card}`}>
            <h2 id="faq-heading" className="text-xl font-semibold text-navy">
              Questions
            </h2>
            <dl className="mt-5 space-y-5">
              {faqs.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold text-navy">{f.q}</dt>
                  <dd className="mt-1 text-slate-700">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="seller-heading" className={`mt-6 ${card}`}>
            <h2 id="seller-heading" className="text-xl font-semibold text-navy">
              Who you’re buying from
            </h2>
            <div className="mt-4">
              <SellerDetails />
            </div>
          </section>

          {!membership && (
            <p className="mt-8 text-center text-slate-700">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-semibold text-navy underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
