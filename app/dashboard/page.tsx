import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NeedsAttentionList, { type AttentionRow } from "@/components/NeedsAttentionList";
import SavePendingResult from "@/components/SavePendingResult";
import {
  evidenceCategoryLabel,
  evidenceStatusLabel,
  type EvidenceRecord,
} from "@/lib/evidence-records";
import { suitableMessage, unsuitableMessage, type EligibilityResultRow } from "@/lib/eligibility";
import { getAttentionReason, type PropertyItem } from "@/lib/property-items";
import type { Property } from "@/lib/properties";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your dashboard | HostSafe",
};

export default async function DashboardPage() {
  if (!isSupabaseConfigured) redirect("/sign-in");

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  // All of this user's results, newest first. RLS already scopes this to
  // their own rows; grouping below picks the latest per property.
  const { data: allResults } = await supabase
    .from("eligibility_results")
    .select("id, property_id, answers, may_need_tailored_advice, created_at")
    .order("created_at", { ascending: false })
    .returns<EligibilityResultRow[]>();

  const latestResultByProperty = new Map<string, EligibilityResultRow>();
  const legacyResults: EligibilityResultRow[] = [];
  for (const row of allResults ?? []) {
    if (row.property_id === null) {
      legacyResults.push(row);
    } else if (!latestResultByProperty.has(row.property_id)) {
      latestResultByProperty.set(row.property_id, row);
    }
  }
  const latestLegacyResult = legacyResults[0];

  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<Property[]>();

  const propertyIds = (properties ?? []).map((p) => p.id);
  const { data: evidenceRecords } = propertyIds.length
    ? await supabase
        .from("evidence_records")
        .select("*")
        .in("property_id", propertyIds)
        .neq("status", "archived")
        .order("record_date", { ascending: false })
        .returns<EvidenceRecord[]>()
    : { data: [] as EvidenceRecord[] };

  const evidenceByProperty = new Map<string, EvidenceRecord[]>();
  for (const record of evidenceRecords ?? []) {
    const list = evidenceByProperty.get(record.property_id) ?? [];
    list.push(record);
    evidenceByProperty.set(record.property_id, list);
  }

  const { data: propertyItems } = propertyIds.length
    ? await supabase
        .from("property_items")
        .select("*")
        .in("property_id", propertyIds)
        .returns<PropertyItem[]>()
    : { data: [] as PropertyItem[] };

  const propertyNameById = new Map((properties ?? []).map((p) => [p.id, p.name]));
  const attentionByProperty = new Map<string, number>();
  const crossPropertyAttention: AttentionRow[] = [];
  for (const item of propertyItems ?? []) {
    const reason = getAttentionReason(item);
    if (!reason) continue;
    attentionByProperty.set(
      item.property_id,
      (attentionByProperty.get(item.property_id) ?? 0) + 1,
    );
    crossPropertyAttention.push({
      itemId: item.id,
      propertyId: item.property_id,
      propertyName: propertyNameById.get(item.property_id),
      title: item.title,
      message: reason.message,
      date: reason.date,
      level: reason.level,
    });
  }
  // Most urgent first, then soonest date.
  const levelOrder = { urgent: 0, review: 1, due_soon: 2 } as const;
  crossPropertyAttention.sort(
    (a, b) => levelOrder[a.level] - levelOrder[b.level] || a.date.localeCompare(b.date),
  );

  return (
    <>
      <Header />
      <SavePendingResult />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">Your dashboard</h1>
          <p className="mt-2 text-slate-700">
            Signed in as{" "}
            <span className="font-medium">{userData.user.email}</span>
          </p>

          {properties && properties.length > 0 && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-navy">
                Needs attention across your properties
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Based only on the dates and statuses you&apos;ve recorded.
                This isn&apos;t a legal or compliance judgement.
              </p>
              <div className="mt-4">
                <NeedsAttentionList rows={crossPropertyAttention} />
              </div>
            </section>
          )}

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-navy">
                Your {properties && properties.length > 1 ? "properties" : "property"}
              </h2>
              {properties && properties.length > 0 && (
                <Link
                  href="/properties/new"
                  className="text-sm font-medium text-navy underline underline-offset-4"
                >
                  Add another property
                </Link>
              )}
            </div>
            {properties && properties.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100">
                {properties.map((p) => {
                  const records = evidenceByProperty.get(p.id) ?? [];
                  const propertyResult = latestResultByProperty.get(p.id);
                  return (
                    <li key={p.id} className="py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-navy">{p.name}</p>
                          <p className="text-sm text-slate-600">{p.address}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {[
                              p.property_type,
                              p.floors != null
                                ? `${p.floors} floor${p.floors === 1 ? "" : "s"}`
                                : null,
                              p.max_guests != null
                                ? `up to ${p.max_guests} guests`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "No further details yet"}
                          </p>
                        </div>
                        <Link
                          href={`/properties/${p.id}/edit`}
                          className="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                      </div>

                      <div className="mt-3 rounded-xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-navy">
                            Property check
                          </p>
                          <Link
                            href={`/properties/${p.id}/check`}
                            className="text-sm font-medium text-navy underline underline-offset-4"
                          >
                            {propertyResult
                              ? "Update property check"
                              : "Take property check"}
                          </Link>
                        </div>
                        {propertyResult ? (
                          <div className="mt-3 text-sm">
                            <p className="text-slate-600">
                              Saved on{" "}
                              {new Date(
                                propertyResult.created_at,
                              ).toLocaleDateString("en-GB")}
                            </p>
                            <p
                              className={`mt-2 rounded-lg p-3 leading-relaxed ${
                                propertyResult.may_need_tailored_advice
                                  ? "bg-amber-50 text-amber-950 ring-1 ring-amber-200"
                                  : "bg-teal-50 text-slate-800 ring-1 ring-teal-200"
                              }`}
                            >
                              {propertyResult.may_need_tailored_advice
                                ? unsuitableMessage
                                : suitableMessage}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-slate-600">
                            This property hasn&apos;t been checked yet.
                          </p>
                        )}
                      </div>

                      <div className="mt-3 rounded-xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-navy">
                            Actions &amp; reminders
                            {(attentionByProperty.get(p.id) ?? 0) > 0 && (
                              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                                {attentionByProperty.get(p.id)} need
                                {attentionByProperty.get(p.id) === 1 ? "s" : ""}{" "}
                                attention
                              </span>
                            )}
                          </p>
                          <Link
                            href={`/properties/${p.id}/items`}
                            className="text-sm font-medium text-navy underline underline-offset-4"
                          >
                            View actions &amp; reminders
                          </Link>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-navy">
                            Evidence records
                          </p>
                          <Link
                            href={`/properties/${p.id}/evidence/new`}
                            className="text-sm font-medium text-navy underline underline-offset-4"
                          >
                            Add evidence record
                          </Link>
                        </div>
                        {records.length > 0 ? (
                          <ul className="mt-3 divide-y divide-slate-200">
                            {records.map((r) => (
                              <li
                                key={r.id}
                                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                              >
                                <div>
                                  <p className="font-medium text-navy">
                                    {r.title}
                                  </p>
                                  <p className="text-slate-600">
                                    {evidenceCategoryLabel(r.category)} ·{" "}
                                    {new Date(r.record_date).toLocaleDateString(
                                      "en-GB",
                                    )}{" "}
                                    · {evidenceStatusLabel(r.status)}
                                    {r.status !== "needs_review" &&
                                      r.review_date &&
                                      new Date(r.review_date) < new Date() &&
                                      " · This record may need reviewing"}
                                  </p>
                                </div>
                                <Link
                                  href={`/properties/${p.id}/evidence/${r.id}/edit`}
                                  className="shrink-0 text-navy underline underline-offset-4"
                                >
                                  Edit
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-slate-600">
                            No evidence records added yet.
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-3">
                <p className="text-slate-700">
                  You have not added a property yet.
                </p>
                <Link
                  href="/properties/new"
                  className="mt-4 inline-block rounded-lg bg-navy px-5 py-2.5 font-medium text-white hover:bg-navy-light"
                >
                  Add your property
                </Link>
              </div>
            )}
          </section>

          {latestLegacyResult && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-navy">
                Earlier saved result
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Saved on{" "}
                {new Date(latestLegacyResult.created_at).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "long", year: "numeric" },
                )}
                , before results were linked to a specific property.
              </p>
              <p
                className={`mt-4 rounded-xl p-4 leading-relaxed ${
                  latestLegacyResult.may_need_tailored_advice
                    ? "bg-amber-50 text-amber-950 ring-1 ring-amber-200"
                    : "bg-teal-50 text-slate-800 ring-1 ring-teal-200"
                }`}
              >
                {latestLegacyResult.may_need_tailored_advice
                  ? unsuitableMessage
                  : suitableMessage}
              </p>
              <p className="mt-3 text-sm text-slate-600">
                To attach a check to one of your properties, use that
                property&apos;s &quot;Take property check&quot; link above.
              </p>
            </section>
          )}

          <div className="mt-6 space-y-2 text-sm text-slate-600">
            <p>
              HostSafe is an organisational and educational tool for
              properties in England. It does not provide legal advice,
              fire-risk assessments, or compliance certification, and it does
              not confirm that a property is safe or legally compliant.
              Keeping records here does not by itself demonstrate legal
              compliance.
            </p>
            <p>
              HostSafe&apos;s simplified guidance is intended for smaller,
              straightforward accommodation in England. Larger, more complex,
              shared, converted, or unusual properties may need different
              guidance or advice from a competent fire-risk assessor.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
