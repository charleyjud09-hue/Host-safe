import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AccountPage from "@/components/AccountPage";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Subscription & billing | HostSafe",
};

/** Placeholder until subscriptions are built. */
export default async function BillingPage() {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  return (
    <AccountPage title="Subscription & billing">
      <div className="space-y-4">
        <p className="text-slate-700">
          Subscriptions and billing are not set up yet. There is nothing to
          manage here at the moment, and no payment details are held.
        </p>
        <Link
          href="/account"
          className="block w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-navy hover:bg-slate-50 sm:inline-block sm:w-auto"
        >
          Back to account settings
        </Link>
      </div>
    </AccountPage>
  );
}
