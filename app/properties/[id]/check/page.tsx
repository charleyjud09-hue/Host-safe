import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import EligibilityChecker from "@/components/EligibilityChecker";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Property check | HostSafe",
};

export default async function PropertyCheckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { id } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  const { data: existing } = await supabase
    .from("eligibility_results")
    .select("id")
    .eq("property_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-2xl px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">
            Property check for {property.name}
          </h1>
          <p className="mt-3 mb-8 text-slate-700">
            Six quick questions. This is not an assessment. It only helps you
            see whether HostSafe&apos;s simplified guidance is designed for a
            property like this one.
          </p>
          <EligibilityChecker
            accountsEnabled={isSupabaseConfigured}
            signedIn
            propertyId={property.id}
            propertyName={property.name}
            hasExistingResult={Boolean(existing)}
          />
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
