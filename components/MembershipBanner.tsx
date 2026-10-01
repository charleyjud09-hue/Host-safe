import Link from "next/link";
import { ukToday } from "@/lib/attention";
import { daysBetween, formatLongDate, membershipCta, priceLabel } from "@/lib/membership";
import { getMembership } from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * One line at the top of signed-in pages: the trial countdown and first
 * charge, a cancellation end date, or that the account is read-only.
 * Nothing is shown for an active membership that renews as normal.
 */
export default async function MembershipBanner() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const m = await getMembership();
  const date = m.periodEnd ? formatLongDate(m.periodEnd) : "";
  const link = "font-semibold text-navy underline underline-offset-2";

  let tone: "info" | "warn" = "info";
  let text: string;

  const action = membershipCta(m);
  if (m.status === "none") {
    text = "Add properties and records with a free 30-day trial.";
  } else if (m.status === "ended") {
    tone = "warn";
    text =
      "Your membership has ended, so your account is read-only. You can still view, download and delete everything.";
  } else if (m.cancelAtPeriodEnd) {
    text = `Your ${m.status === "trialing" ? "trial" : "membership"} is cancelled and ends on ${date}. You won’t be charged.`;
  } else if (m.status === "trialing" && m.plan && m.interval && m.periodEnd) {
    const days = daysBetween(ukToday(), m.periodEnd);
    text = `Free trial: ${days} ${days === 1 ? "day" : "days"} left. ${priceLabel(m.plan, m.interval)} will be charged on ${date} unless you cancel.`;
  } else {
    return null;
  }

  return (
    <div
      role="status"
      className={`border-b px-4 py-2.5 text-sm sm:px-5 ${
        tone === "warn"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-teal-200 bg-teal-50 text-slate-800"
      }`}
    >
      <p className="mx-auto max-w-5xl">
        {text}{" "}
        <Link href={action.href} className={link}>
          {action.label}
        </Link>
      </p>
    </div>
  );
}
