import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import NeedsAttentionList, { type AttentionRow } from "@/components/NeedsAttentionList";
import PropertyItemList from "@/components/PropertyItemList";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getAttentionReason, type PropertyItem } from "@/lib/property-items";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Actions & reminders | HostSafe",
};

export default async function PropertyItemsPage({
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

  const { data: items } = await supabase
    .from("property_items")
    .select("*")
    .eq("property_id", id)
    .order("created_at", { ascending: false })
    .returns<PropertyItem[]>();

  const attentionRows: AttentionRow[] = (items ?? []).flatMap((item) => {
    const reason = getAttentionReason(item);
    if (!reason) return [];
    return [
      {
        itemId: item.id,
        propertyId: id,
        title: item.title,
        message: reason.message,
        date: reason.date,
        level: reason.level,
      },
    ];
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-5 py-12">
          <p className="text-sm text-slate-600">{property.name}</p>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold text-navy">
              Actions &amp; reminders
            </h1>
            <Link
              href={`/properties/${id}/items/new`}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light"
            >
              Add item
            </Link>
          </div>
          <p className="mt-3 text-slate-700">
            Organisational actions, records, and submission tracking for this
            property. HostSafe does not decide what is legally required — you
            add and manage these items yourself.
          </p>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-navy">
              Needs attention
            </h2>
            <div className="mt-4">
              <NeedsAttentionList rows={attentionRows} />
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-navy">All items</h2>
            <div className="mt-4">
              <PropertyItemList propertyId={id} items={items ?? []} />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
