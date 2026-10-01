import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { formatDisplayDate } from "@/lib/attention";
import {
  evidenceCategoryLabel,
  evidenceStatusLabel,
  type EvidenceRecord,
} from "@/lib/evidence-records";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Documents & renewals | Letnook",
};

export default async function DocumentsAndRenewalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ show?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { id } = await params;
  const { show } = await searchParams;
  const showArchived = show === "archived";

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  const [recordsRes, attachmentsRes] = await Promise.all([
    supabase
      .from("evidence_records")
      .select("*")
      .eq("property_id", id)
      .order("record_date", { ascending: false })
      .returns<EvidenceRecord[]>(),
    supabase
      .from("evidence_attachments")
      .select("evidence_record_id")
      .eq("property_id", id),
  ]);

  const allRecords = recordsRes.data ?? [];
  const attachmentCount = new Map<string, number>();
  for (const a of attachmentsRes.data ?? []) {
    attachmentCount.set(
      a.evidence_record_id,
      (attachmentCount.get(a.evidence_record_id) ?? 0) + 1,
    );
  }

  const archivedCount = allRecords.filter((r) => r.status === "archived").length;
  const records = allRecords.filter((r) =>
    showArchived ? r.status === "archived" : r.status !== "archived",
  );
  const base = `/properties/${property.id}/documents`;

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-3xl px-5 py-10 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
            <Link href="/" className="hover:text-navy">
              All properties
            </Link>
            <span aria-hidden> / </span>
            <Link href={`/properties/${property.id}`} className="hover:text-navy">
              {property.name}
            </Link>
          </nav>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-navy">
              Documents &amp; renewals
            </h1>
            <Link
              href={`/properties/${property.id}/evidence/new`}
              className="rounded-xl bg-action px-4 py-2.5 text-sm font-semibold text-white hover:bg-action-hover"
            >
              Add record
            </Link>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Files are stored privately to help you organise records. Letnook
            doesn&apos;t check, verify or approve them, or confirm they are
            valid, complete or up to date.
          </p>

          {/* Plain links between two views; aria-current marks the one shown. */}
          <nav aria-label="Record view" className="mt-6 flex gap-2 text-sm">
            <Link
              href={base}
              aria-current={!showArchived ? "page" : undefined}
              className={`rounded-xl px-3.5 py-2 font-medium ${
                !showArchived
                  ? "bg-action text-white"
                  : "bg-white text-navy ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              Current records
            </Link>
            <Link
              href={`${base}?show=archived`}
              aria-current={showArchived ? "page" : undefined}
              className={`rounded-xl px-3.5 py-2 font-medium ${
                showArchived
                  ? "bg-action text-white"
                  : "bg-white text-navy ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              Archived ({archivedCount})
            </Link>
          </nav>

          <section className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
            {records.length === 0 ? (
              <p className="text-slate-700">
                {showArchived
                  ? "No archived records for this property."
                  : "No records added for this property yet."}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {records.map((r) => {
                  const files = attachmentCount.get(r.id) ?? 0;
                  return (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-navy">{r.title}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {evidenceCategoryLabel(r.category)} ·{" "}
                          {evidenceStatusLabel(r.status)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Recorded {formatDisplayDate(r.record_date)}
                          {r.review_date &&
                            ` · Review ${formatDisplayDate(r.review_date)}`}
                          {` · ${files} attachment${files === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <Link
                        href={`/properties/${property.id}/evidence/${r.id}/edit`}
                        className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-navy hover:bg-slate-50"
                      >
                        Open
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
