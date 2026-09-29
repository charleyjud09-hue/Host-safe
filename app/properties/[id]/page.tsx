import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PropertyAttentionList from "@/components/PropertyAttentionList";
import PropertyImagePlaceholder from "@/components/PropertyImagePlaceholder";
import ServiceCard from "@/components/ServiceCard";
import {
  buildAttention,
  REMINDER_NOTICE,
  ukToday,
  type AttentionEvidenceInput,
  type AttentionItemInput,
  type AttentionMaintenanceInput,
} from "@/lib/attention";
import { propertyImageUrl } from "@/lib/property-images";
import type { Property } from "@/lib/properties";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Property overview | HostSafe",
};

const iconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
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

  // "*" so this works whether or not the optional image columns exist yet.
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle<Property>();
  if (!property) notFound();

  const [itemsRes, evidenceRes, maintenanceRes] = await Promise.all([
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
    // Returns no rows (not an error page) before the table exists.
    supabase
      .from("maintenance_issues")
      .select("id, property_id, title, status, due_date")
      .eq("property_id", id)
      .in("status", ["open", "in_progress", "waiting"])
      .not("due_date", "is", null),
  ]);

  const attention = buildAttention(
    (itemsRes.data ?? []) as AttentionItemInput[],
    (evidenceRes.data ?? []) as AttentionEvidenceInput[],
    ukToday(),
    (maintenanceRes.data ?? []) as AttentionMaintenanceInput[],
  );

  return (
    <>
      <Header />
      <AppShell>
        <section className="app-band border-b border-paper-line">
          <div className="mx-auto max-w-5xl px-5 pb-8 pt-6 sm:pb-10">
            <nav aria-label="Breadcrumb" className="text-sm">
              <Link href="/" className="text-slate-700 hover:text-navy">
                ← All properties
              </Link>
            </nav>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
              {property.image_path ? (
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-paper-deep ring-1 ring-paper-line sm:h-24 sm:w-36">
                  <Image
                    src={propertyImageUrl(property.id, property.image_updated_at ?? null)}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 640px) 144px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <PropertyImagePlaceholder className="h-40 w-full shrink-0 rounded-2xl ring-1 ring-paper-line sm:h-24 sm:w-36" />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
                  {property.name}
                </h1>
                <p className="mt-1 text-slate-700">{property.address}</p>
              </div>
              <Link
                href={`/properties/${property.id}/edit?returnTo=/properties/${property.id}`}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-navy shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 sm:self-center"
              >
                <svg aria-hidden {...iconProps} width={16} height={16}>
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
                  <path d="m14.5 5.5 3 3" />
                </svg>
                Property details
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
          <section
            aria-labelledby="attention-heading"
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8"
          >
            <h2 id="attention-heading" className="text-2xl font-semibold text-navy">
              Needs your attention
            </h2>
            <p className="mt-1 text-sm text-slate-600">{REMINDER_NOTICE}</p>
            <div className="mt-5">
              <PropertyAttentionList entries={attention} />
            </div>
          </section>

          <section aria-labelledby="services-heading" className="mt-12">
            <h2 id="services-heading" className="text-2xl font-semibold text-navy">
              Property services
            </h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <ServiceCard
                title="Safety & checks"
                description="Keep property check records together."
                href={`/properties/${property.id}/safety`}
                actionLabel="Open safety & checks"
                tone="teal"
                icon={
                  <svg {...iconProps}>
                    <rect x="5" y="4" width="14" height="17" rx="2" />
                    <path d="M9 4V3h6v1" />
                    <path d="m9 13 2 2 4-4" />
                  </svg>
                }
              />
              <ServiceCard
                title="Documents & renewals"
                description="Keep documents, evidence and review dates organised."
                href={`/properties/${property.id}/documents`}
                actionLabel="Open documents"
                tone="paper"
                icon={
                  <svg {...iconProps}>
                    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                    <path d="M14 3v5h5" />
                    <path d="M9 13h6" />
                    <path d="M9 17h4" />
                  </svg>
                }
              />
              <ServiceCard
                title="Maintenance & repairs"
                description="Keep faults, damage and repair tasks organised for this property."
                href={`/properties/${property.id}/maintenance`}
                actionLabel="Open maintenance"
                tone="white"
                className="sm:col-span-2"
                icon={
                  <svg {...iconProps}>
                    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.4 2.4-2.1-.4-.4-2.1z" />
                  </svg>
                }
              />
            </div>
          </section>

          <p className="mt-10 text-sm">
            <Link
              href={`/properties/${property.id}/items`}
              className="text-slate-700 underline underline-offset-4 hover:text-navy"
            >
              All actions &amp; reminders for this property
            </Link>
          </p>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
