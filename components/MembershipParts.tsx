import Link from "next/link";
import {
  formatLongDate,
  PLAN_IDS,
  PLANS,
  priceLabel,
  FOUNDING_TERMS,
  planPrice,
  TRIAL_DAYS,
  yearlySaving,
  type BillingInterval,
  type PlanId,
} from "@/lib/membership";

export const card = "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8";
export const primaryButton =
  "inline-flex items-center justify-center rounded-xl bg-action px-5 py-3 font-semibold text-white hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";
export const secondaryButton =
  "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-navy hover:bg-slate-50";

/** What every plan includes. */
export const INCLUDED = [
  "Maintenance & repairs, with photos",
  "Stays & calendar",
  "Actions & reminders",
  "Documents & renewals, with file uploads",
];

/** Monthly / yearly switch, done with links so it works without JavaScript. */
export function IntervalToggle({
  interval,
  hrefFor,
}: {
  interval: BillingInterval;
  hrefFor: (interval: BillingInterval) => string;
}) {
  const option = (value: BillingInterval, label: string) => (
    <Link
      href={hrefFor(value)}
      aria-current={interval === value ? "true" : undefined}
      className={`rounded-lg px-4 py-2 text-sm font-medium ${
        interval === value ? "bg-navy text-white" : "text-navy hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav
      aria-label="Billing period"
      className="inline-flex gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200"
    >
      {option("month", "Monthly")}
      {option("year", "Yearly · 1 month free")}
    </nav>
  );
}

/**
 * The main choice on the join page: monthly or yearly, side by side. The
 * selected option is in colour; the other stays plain. Links, so it works
 * without JavaScript.
 */
export function BillingChoice({
  plan,
  interval,
  hrefFor,
  founding = false,
}: {
  plan: PlanId;
  interval: BillingInterval;
  hrefFor: (interval: BillingInterval) => string;
  /** Show the founding-member prices. */
  founding?: boolean;
}) {
  const saving = yearlySaving(plan, founding);
  const option = (value: BillingInterval) => {
    const selected = value === interval;
    const yearly = value === "year";
    return (
      <Link
        href={hrefFor(value)}
        aria-current={selected ? "true" : undefined}
        className={`relative flex flex-col rounded-2xl p-5 text-left transition sm:p-6 ${
          selected
            ? "bg-action text-white shadow-card ring-2 ring-action"
            : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-slate-300"
        }`}
      >
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className={`font-semibold ${selected ? "text-white" : "text-slate-700"}`}>
            {yearly ? "Yearly" : "Monthly"}
          </span>
          {yearly && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                selected ? "bg-white text-teal-800" : "bg-slate-100 text-slate-600"
              }`}
            >
              1 month FREE
            </span>
          )}
        </span>
        <span className="mt-3">
          <span className={`text-3xl font-semibold tracking-tight ${selected ? "text-white" : "text-slate-700"}`}>
            £{planPrice(plan, value, founding)}
          </span>
          <span className={selected ? "text-teal-50" : ""}> a {value}</span>
          {founding && (
            <span className={`ml-1.5 text-sm line-through ${selected ? "text-teal-100" : ""}`}>
              £{planPrice(plan, value)}
            </span>
          )}
        </span>
        <span className={`mt-2 text-sm ${selected ? "text-teal-50" : ""}`}>
          {yearly ? `£${saving} cheaper than paying monthly` : "Pay as you go, cancel any time"}
        </span>
        {selected && <span className="sr-only">(selected)</span>}
      </Link>
    );
  };
  return (
    <nav aria-label="How you pay" className="grid grid-cols-2 gap-3">
      {option("month")}
      {option("year")}
    </nav>
  );
}

function Tick() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
    >
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

/** The two plans side by side. `cta` decides each plan's button. */
export function PlanCards({
  interval,
  cta,
  currentPlan,
  founding = false,
}: {
  interval: BillingInterval;
  cta: (plan: PlanId) => { href: string; label: string } | null;
  currentPlan?: PlanId | null;
  /** Show the founding-member prices (with the standard price struck through). */
  founding?: boolean;
}) {
  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {PLAN_IDS.map((id) => {
        const plan = PLANS[id];
        const action = cta(id);
        return (
          <li
            key={id}
            className={`flex flex-col rounded-2xl bg-white p-6 shadow-card sm:p-8 ${
              id === "premium" ? "ring-2 ring-action" : "border border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-navy">{plan.name}</h3>
              {currentPlan === id && (
                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 ring-1 ring-teal-200">
                  Your plan
                </span>
              )}
            </div>
            {founding && (
              <p className="mt-3 inline-flex self-start rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
                Founding member price
              </p>
            )}
            <p className="mt-3">
              <span className="text-4xl font-semibold tracking-tight text-navy">
                £{planPrice(id, interval, founding)}
              </span>
              <span className="text-slate-600"> a {interval}</span>
              {founding && (
                <span className="ml-2 text-slate-500">
                  <span className="sr-only">instead of </span>
                  <span className="line-through">£{planPrice(id, interval)}</span>
                </span>
              )}
            </p>
            {interval === "year" && (
              <p className="mt-1 text-sm text-slate-600">
                One month free: save £{yearlySaving(id, founding)} compared with paying
                monthly.
              </p>
            )}
            <p className="mt-2 text-sm font-medium text-teal-800">
              {TRIAL_DAYS}-day free trial
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-slate-800">
              <li className="flex gap-2">
                <Tick />
                <span>
                  <strong className="font-semibold">Up to {plan.propertyLimit} properties</strong>
                </span>
              </li>
              {INCLUDED.map((f) => (
                <li key={f} className="flex gap-2">
                  <Tick />
                  <span>{f}</span>
                </li>
              ))}
              <li className="flex gap-2">
                <Tick />
                <span>{plan.storageGb}GB of file storage (fair use)</span>
              </li>
            </ul>

            {plan.extras.length > 0 && (
              <>
                <p className="mt-6 text-sm font-semibold text-navy">
                  Premium extras{" "}
                  <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
                    Coming soon
                  </span>
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                  {plan.extras.map((f) => (
                    <li key={f} className="list-inside list-disc">
                      {f}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-auto pt-8">
              {action && (
                <Link href={action.href} className={`w-full ${primaryButton}`}>
                  {action.label}
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The free-trial conditions, in plain words. Shown before anyone adds a
 * card: the first charge date and amount, and how to avoid it.
 */
export function TrialConditions({
  plan,
  interval,
  trialEnds,
  founding = false,
}: {
  plan: PlanId;
  interval: BillingInterval;
  /** YYYY-MM-DD if known (trial starting today), otherwise "day 30". */
  trialEnds: string | null;
  /** Quote the founding-member price, and say how it's kept and lost. */
  founding?: boolean;
}) {
  const price = priceLabel(plan, interval, founding);
  const firstCharge = trialEnds ? formatLongDate(trialEnds) : `day ${TRIAL_DAYS}`;
  const conditions = [
    <>
      <strong className="font-semibold">You pay £0 today.</strong> You add a card to
      start the trial.
    </>,
    <>
      The trial lasts {TRIAL_DAYS} days
      {trialEnds ? <>, until {formatLongDate(trialEnds)}</> : null}.
    </>,
    <>
      <strong className="font-semibold">
        Cancel at any time during the trial and you won’t be charged anything.
      </strong>
    </>,
    <>
      If you don’t cancel, {PLANS[plan].name} costs{" "}
      <strong className="font-semibold">{price}</strong>
      {founding && <> (founding member price, normally {priceLabel(plan, interval)})</>}.
      The first payment is taken on {firstCharge}, then every {interval} until you
      cancel.
    </>,
    ...(founding ? [<>{FOUNDING_TERMS}</>] : []),
    <>If you cancel during the trial, you can keep using Letnook until it ends.</>,
    <>We’ll remind you a few days before your trial ends.</>,
    <>
      When you add your card, your bank may show a small temporary check. It isn’t a
      payment and disappears within a few days.
    </>,
    <>
      You can cancel at any time in Account settings, under Subscription &amp;
      billing. You don’t need to contact us.
    </>,
  ];

  return (
    <ol className="space-y-3 text-slate-800">
      {conditions.map((c, i) => (
        <li key={i} className="flex gap-3">
          <span
            aria-hidden
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800 ring-1 ring-teal-200"
          >
            {i + 1}
          </span>
          <span>{c}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Who people are buying from. UK law requires this before they pay; the
 * details are still to be decided, so they show as clear placeholders.
 */
export function SellerDetails() {
  const missing = (
    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-900 ring-1 ring-amber-200">
      To be added before launch
    </span>
  );
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
      <dt className="font-medium text-navy">Sold by</dt>
      <dd>{missing}</dd>
      <dt className="font-medium text-navy">Address</dt>
      <dd>{missing}</dd>
      <dt className="font-medium text-navy">Contact email</dt>
      <dd>{missing}</dd>
    </dl>
  );
}

/** A clearly-marked empty space where the payment provider will go. */
export function PaymentPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <p className="font-medium text-navy">{title}</p>
      <p className="mt-1 text-sm text-slate-600">
        Payments aren’t switched on yet. This space is reserved for secure card
        details from the payment provider. Letnook won’t store card numbers.
      </p>
    </div>
  );
}
