import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PropertyAttentionList from "@/components/PropertyAttentionList";
import ServiceCard from "@/components/ServiceCard";
import {
  buildAttention,
  REMINDER_NOTICE,
  type AttentionEvidenceInput,
  type AttentionItemInput,
} from "@/lib/attention";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Property overview | HostSafe",
};

export default async function PropertyOverviewPage({
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
    .select("id, name, address")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  const [itemsRes, evidenceRes] = await Promise.all([
    supabase
      .from("property_items")
      .select("id, property_id, title, item_type, status, due_date, review_date")
      .eq("property_id", id),
    supabase
      .from("evidence_records")
      .select("id, property_id, title, status, review_date")
      .eq("property_id", id)
      .neq("status", "archived")
      .not("review_date", "is", null),
  ]);

  const attention = buildAttention(
    (itemsRes.data ?? []) as AttentionItemInput[],
    (evidenceRes.data ?? []) as AttentionEvidenceInput[],
  );

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-sm">
            <Link href="/" className="text-slate-600 hover:text-navy">
              ← All properties
            </Link>
          </nav>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-navy">
                {property.name}
              </h1>
              <p className="mt-1 text-slate-600">{property.address}</p>
            </div>
            <Link
              href={`/properties/${property.id}/edit`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50"
            >
              Property details
            </Link>
          </div>

          <section
            aria-labelledby="attention-heading"
            className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 id="attention-heading" className="text-xl font-semibold text-navy">
              Needs your attention
            </h2>
            <p className="mt-1 text-sm text-slate-600">{REMINDER_NOTICE}</p>
            <div className="mt-5">
              <PropertyAttentionList entries={attention} />
            </div>
          </section>

          <section aria-labelledby="services-heading" className="mt-10">
            <h2 id="services-heading" className="text-xl font-semibold text-navy">
              Property services
            </h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <ServiceCard
                title="Safety & checks"
                description="Keep property check records together."
                href={`/properties/${property.id}/safety`}
                actionLabel="Open safety & checks"
              />
              <ServiceCard
                title="Documents & renewals"
                description="Keep documents, evidence and review dates organised."
                href={`/properties/${property.id}/documents`}
                actionLabel="Open documents"
              />
            </div>
          </section>

          <p className="mt-8 text-sm">
            <Link
              href={`/properties/${property.id}/items`}
              className="text-slate-600 underline underline-offset-4 hover:text-navy"
            >
              All actions &amp; reminders for this property
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
