import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { archiveEvidenceRecord, deleteEvidenceRecord, updateEvidenceRecord } from "@/app/evidence/actions";
import EvidenceRecordForm from "@/components/EvidenceRecordForm";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { EvidenceRecord } from "@/lib/evidence-records";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit evidence record | HostSafe",
};

export default async function EditEvidenceRecordPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { id, recordId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  const { data: record } = await supabase
    .from("evidence_records")
    .select("*")
    .eq("id", recordId)
    .eq("property_id", id)
    .maybeSingle<EvidenceRecord>();
  if (!record) notFound();

  const updateAction = updateEvidenceRecord.bind(null, property.id, record.id);
  const archiveAction = archiveEvidenceRecord.bind(null, property.id, record.id);
  const deleteAction = deleteEvidenceRecord.bind(null, property.id, record.id);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">
            Edit evidence record
          </h1>
          <p className="mt-3 mb-8 text-slate-700">For {property.name}.</p>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <EvidenceRecordForm
              action={updateAction}
              record={record}
              submitLabel="Save changes"
              showStatus
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={archiveAction}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-navy hover:bg-slate-50"
              >
                Archive record
              </button>
            </form>
            <form action={deleteAction}>
              <button
                type="submit"
                className="rounded-lg border border-red-200 px-5 py-2.5 font-medium text-red-700 hover:bg-red-50"
              >
                Delete record
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
