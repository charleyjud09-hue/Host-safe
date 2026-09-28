import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { archiveEvidenceRecord, deleteEvidenceRecord, updateEvidenceRecord } from "@/app/evidence/actions";
import { uploadAttachments } from "@/app/evidence/attachments/actions";
import AttachmentList from "@/components/AttachmentList";
import AttachmentUploadForm from "@/components/AttachmentUploadForm";
import EvidenceRecordForm from "@/components/EvidenceRecordForm";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { EvidenceAttachment } from "@/lib/evidence-attachments";
import { MAX_ATTACHMENTS_PER_RECORD } from "@/lib/evidence-attachments";
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

  const { data: attachments } = await supabase
    .from("evidence_attachments")
    .select("id, storage_path, original_file_name, content_type, size_bytes, created_at")
    .eq("evidence_record_id", record.id)
    .order("created_at", { ascending: false })
    .returns<EvidenceAttachment[]>();

  const updateAction = updateEvidenceRecord.bind(null, property.id, record.id);
  const archiveAction = archiveEvidenceRecord.bind(null, property.id, record.id);
  const deleteAction = deleteEvidenceRecord.bind(null, property.id, record.id);
  const uploadAction = uploadAttachments.bind(null, property.id, record.id);
  const attachmentCount = attachments?.length ?? 0;

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
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-navy">Attachments</h2>
            <p className="mt-1 text-sm text-slate-600">
              Private to your account. HostSafe does not check, certify, or
              analyse anything you upload.
            </p>
            <div className="mt-4">
              <AttachmentList
                propertyId={property.id}
                recordId={record.id}
                attachments={attachments ?? []}
              />
            </div>
            <div className="mt-6 border-t border-slate-100 pt-6">
              {attachmentCount >= MAX_ATTACHMENTS_PER_RECORD ? (
                <p className="text-sm text-slate-600">
                  This record has reached the limit of{" "}
                  {MAX_ATTACHMENTS_PER_RECORD} attachments. Delete one to add
                  another.
                </p>
              ) : (
                <AttachmentUploadForm action={uploadAction} disabled={false} />
              )}
            </div>
          </section>

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
