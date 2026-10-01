import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createProperty } from "@/app/properties/actions";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PropertyForm from "@/components/PropertyForm";
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

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-2xl px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">Add a property</h1>
          <p className="mt-3 mb-8 text-slate-700">
            Add the basic details. You can change them at any time.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <PropertyForm action={createProperty} submitLabel="Add property" />
          </div>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
