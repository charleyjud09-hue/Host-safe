import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelMembership } from "@/app/membership/actions";
import AccountPage from "@/components/AccountPage";
import ConfirmAction from "@/components/ConfirmAction";
import { secondaryButton } from "@/components/MembershipParts";
import { canEdit, formatLongDate, PLANS } from "@/lib/membership";
import { getMembership } from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Cancel membership | Letnook",
};

/** As easy to leave as to join: one page, one confirmation, no contact needed. */
export default async function CancelMembershipPage() {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");

  const membership = await getMembership();
  if (!canEdit(membership) || membership.cancelAtPeriodEnd) redirect("/account/billing");

  const trial = membership.status === "trialing";
  const date = membership.periodEnd ? formatLongDate(membership.periodEnd) : "the end of this period";
  const name = membership.plan ? PLANS[membership.plan].name : "Membership";

  return (
    <AccountPage title="Cancel membership">
      <div className="space-y-5">
        <p className="text-slate-800">
          {trial
            ? `If you cancel your ${name} trial now, you won’t be charged anything.`
            : `If you cancel ${name} now, you won’t be charged again.`}
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-slate-700">
          <li>You can keep using Letnook until {date}.</li>
          <li>
            After that your account becomes read-only. You can still view,
            download and delete everything.
          </li>
          <li>You can rejoin at any time.</li>
        </ul>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <ConfirmAction
            action={cancelMembership}
            confirmValue="cancel"
            triggerLabel="Cancel membership"
            heading="Cancel your membership?"
            body={
              trial
                ? `You won’t be charged. Access continues until ${date}.`
                : `You won’t be charged again. Access continues until ${date}.`
            }
            confirmLabel="Yes, cancel"
            keepLabel="Keep my membership"
          />
          <Link href="/account/billing" className={secondaryButton}>
            Back
          </Link>
        </div>
      </div>
    </AccountPage>
  );
}
