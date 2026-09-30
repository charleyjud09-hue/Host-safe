import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createEvidenceRecord } from "@/app/evidence/actions";
import EvidenceRecordForm from "@/components/EvidenceRecordForm";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add an evidence record | HostSafe",
};

export default async function NewEvidenceRecordPage({
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

  const action = createEvidenceRecord.bind(null, property.id);

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-2xl px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">
            Add an evidence record
          </h1>
          <p className="mt-3 text-slate-700">For {property.name}.</p>
          <p className="mt-2 mb-8 text-sm text-slate-600">
            HostSafe doesn&apos;t check, certify or assess what you add, and
            isn&apos;t a substitute for professional advice.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <EvidenceRecordForm action={action} submitLabel="Save record" />
          </div>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
