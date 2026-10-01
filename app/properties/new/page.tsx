import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createProperty } from "@/app/properties/actions";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PropertyForm from "@/components/PropertyForm";
import { propertyLimit, propertyLimitMessage } from "@/lib/membership";
import { getMembership, requireEditAccess } from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add a property | Letnook",
};

export default async function NewPropertyPage() {
  if (!isSupabaseConfigured) redirect("/sign-in");

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");
  await requireEditAccess();

  const membership = await getMembership();
  const { count } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true });
  const atLimit = (count ?? 0) >= propertyLimit(membership);

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-2xl px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">Add a property</h1>
          {atLimit ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-slate-800">{propertyLimitMessage(membership)}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {membership.plan !== "premium" && (
                  <Link
                    href="/account/billing"
                    className="rounded-lg bg-action px-5 py-2.5 font-semibold text-white hover:bg-action-hover"
                  >
                    See plans
                  </Link>
                )}
                <Link
                  href="/"
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-navy hover:bg-slate-50"
                >
                  Back to your properties
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-3 mb-8 text-slate-700">
                Add the basic details. You can change them at any time.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <PropertyForm action={createProperty} submitLabel="Add property" />
              </div>
            </>
          )}
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
