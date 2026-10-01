import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createPropertyItem } from "@/app/property-items/actions";
import PropertyItemForm from "@/components/PropertyItemForm";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { requireEditAccess } from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add an item | Letnook",
};

export default async function NewPropertyItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { id } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");
  await requireEditAccess();

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  const action = createPropertyItem.bind(null, property.id);

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-2xl px-5 py-12">
          <p className="text-sm text-slate-600">{property.name}</p>
          <h1 className="text-3xl font-semibold text-navy">Add an item</h1>
          <p className="mt-3 mb-8 text-slate-700">
            Your own list of things to do, keep or send. Letnook doesn&apos;t
            decide what the law requires.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <PropertyItemForm action={action} submitLabel="Save item" />
          </div>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
