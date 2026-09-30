import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  questions,
  suitableMessage,
  unsuitableMessage,
  type EligibilityResultRow,
} from "@/lib/eligibility";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Safety & checks | HostSafe",
};

const answerLabels: Record<string, string> = {
  yes: "Yes",
  no: "No",
  unsure: "Not sure",
};

export default async function SafetyAndChecksPage({
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

  const { data: latest } = await supabase
    .from("eligibility_results")
    .select("id, property_id, answers, may_need_tailored_advice, created_at")
    .eq("property_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<EligibilityResultRow>();

  const answers = (latest?.answers ?? {}) as Record<string, string>;

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

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy">
            Safety &amp; checks
          </h1>
          <p className="mt-2 text-slate-700">
            The property check shows whether HostSafe&apos;s simplified
            approach fits this property. It is not a fire-risk assessment or a
            compliance result.
          </p>

          <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-navy">
                Latest property check
              </h2>
              <Link
                href={`/properties/${property.id}/check`}
                className="rounded-xl bg-action px-4 py-2.5 text-sm font-semibold text-white hover:bg-action-hover"
              >
                {latest ? "Update property check" : "Take property check"}
              </Link>
            </div>

            {latest ? (
              <>
                <p className="mt-2 text-sm text-slate-600">
                  Saved on{" "}
                  {new Date(latest.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p
                  className={`mt-4 rounded-xl p-4 leading-relaxed ${
                    latest.may_need_tailored_advice
                      ? "bg-amber-50 text-amber-950 ring-1 ring-amber-200"
                      : "bg-slate-50 text-slate-800 ring-1 ring-slate-200"
                  }`}
                >
                  {latest.may_need_tailored_advice ? unsuitableMessage : suitableMessage}
                </p>
                <dl className="mt-6 divide-y divide-slate-100 text-sm">
                  {questions.map((q) => (
                    <div key={q.id} className="flex justify-between gap-4 py-2">
                      <dt className="text-slate-700">{q.text}</dt>
                      <dd className="shrink-0 font-medium text-navy">
                        {answerLabels[answers[q.id]] ?? "-"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className="mt-3 text-slate-700">
                No property check has been saved for this property yet.
              </p>
            )}
          </section>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
