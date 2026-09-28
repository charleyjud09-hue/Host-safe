import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PropertyForm from "@/components/PropertyForm";
import { createProperty } from "@/app/properties/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add a property | HostSafe",
};

export default async function NewPropertyPage() {
  if (!isSupabaseConfigured) redirect("/sign-in");

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">Add a property</h1>
          <p className="mt-3 mb-8 text-slate-700">
            A few basic details to get this property set up. You can add or
            change anything later.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <PropertyForm action={createProperty} submitLabel="Save property" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
