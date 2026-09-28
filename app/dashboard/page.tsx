import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SavePendingResult from "@/components/SavePendingResult";
import {
  evidenceCategoryLabel,
  evidenceStatusLabel,
  type EvidenceRecord,
} from "@/lib/evidence-records";
import { questions, suitableMessage, unsuitableMessage } from "@/lib/eligibility";
import type { Property } from "@/lib/properties";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your dashboard | HostSafe",
};

const labels: Record<string, string> = {
  yes: "Yes",
  no: "No",
  unsure: "Not sure",
};

export default async function DashboardPage() {
  if (!isSupabaseConfigured) redirect("/sign-in");

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: result } = await supabase
    .from("eligibility_results")
    .select("answers, may_need_tailored_advice, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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

  const answers = (result?.answers ?? {}) as Record<string, string>;

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

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-navy">
              Your saved suitability check
            </h2>
            {result ? (
              <>
                <p className="mt-1 text-sm text-slate-600">
                  Saved on{" "}
                  {new Date(result.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p
                  className={`mt-4 rounded-xl p-4 leading-relaxed ${
                    result.may_need_tailored_advice
                      ? "bg-amber-50 text-amber-950 ring-1 ring-amber-200"
                      : "bg-teal-50 text-slate-800 ring-1 ring-teal-200"
                  }`}
                >
                  {result.may_need_tailored_advice
                    ? unsuitableMessage
                    : suitableMessage}
                </p>
                <dl className="mt-6 divide-y divide-slate-100 text-sm">
                  {questions.map((q) => (
                    <div key={q.id} className="flex justify-between gap-4 py-2">
                      <dt className="text-slate-700">{q.text}</dt>
                      <dd className="shrink-0 font-medium text-navy">
                        {labels[answers[q.id]] ?? "-"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className="mt-3 text-slate-700">
                You have not saved a suitability check yet.
              </p>
            )}
            <Link
              href="/check"
              className="mt-6 inline-block rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-navy hover:bg-slate-50"
            >
              {result ? "Take the check again" : "Check if your property is suitable"}
            </Link>
          </section>

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
