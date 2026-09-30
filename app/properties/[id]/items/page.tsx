import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PropertyAttentionList from "@/components/PropertyAttentionList";
import PropertyItemList from "@/components/PropertyItemList";
import {
  buildAttention,
  REMINDER_NOTICE,
  ukToday,
  type AttentionMaintenanceInput,
} from "@/lib/attention";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { PropertyItem } from "@/lib/property-items";
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

  const [{ data: items }, { data: maintenance }] = await Promise.all([
    supabase
      .from("property_items")
      .select("*")
      .eq("property_id", id)
      .order("created_at", { ascending: false })
      .returns<PropertyItem[]>(),
    // Open maintenance issues for this property (RLS-scoped). Shown in
    // their own section below, using the property attention rules.
    supabase
      .from("maintenance_issues")
      .select("id, property_id, title, status, due_date")
      .eq("property_id", id)
      .in("status", ["open", "in_progress", "waiting"]),
  ]);

  // Actions and open maintenance issues, using the same rules as the
  // property overview and selector.
  const attention = buildAttention(
    items ?? [],
    [],
    ukToday(),
    (maintenance ?? []) as AttentionMaintenanceInput[],
  );

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-2xl px-5 py-12">
          <p className="text-sm text-slate-600">{property.name}</p>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold text-navy">
              Actions &amp; reminders
            </h1>
            <Link
              href={`/properties/${id}/items/new`}
              className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white hover:bg-action-hover"
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
            <p className="mt-1 text-sm text-slate-600">{REMINDER_NOTICE}</p>
            <div className="mt-4">
              <PropertyAttentionList entries={attention} />
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-navy">All items</h2>
            <div className="mt-4">
              <PropertyItemList propertyId={id} items={items ?? []} />
            </div>
          </section>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
