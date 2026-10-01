"use server";

import { redirect } from "next/navigation";
import {
  ATTACHMENTS_BUCKET,
  buildStoragePath,
  MAX_ATTACHMENTS_PER_RECORD,
  validateAttachmentFile,
} from "@/lib/evidence-attachments";
import { errorCode } from "@/lib/log";
import { editBlockedMessage } from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AttachmentFormState = { error?: string };

/**
 * Confirms the signed-in user owns the property and the evidence record
 * belongs to it. RLS enforces this at the database/storage layer too; this
 * just gives a clear result instead of a silent RLS rejection.
 */
async function requireOwnEvidenceRecord(propertyId: string, recordId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: record } = await supabase
    .from("evidence_records")
    .select("id")
    .eq("id", recordId)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (!record) redirect("/");

  return { supabase, userId: userData.user.id };
}

export async function uploadAttachments(
  propertyId: string,
  recordId: string,
  _prev: AttachmentFormState,
  formData: FormData,
): Promise<AttachmentFormState> {
  if (!isSupabaseConfigured) {
    return { error: "Accounts are not switched on yet. Please try again later." };
  }

  const { supabase, userId } = await requireOwnEvidenceRecord(propertyId, recordId);
  const blocked = await editBlockedMessage();
  if (blocked) return { error: blocked };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return { error: "Please choose at least one file to upload." };
  }

  const { count: existingCount } = await supabase
    .from("evidence_attachments")
    .select("id", { count: "exact", head: true })
    .eq("evidence_record_id", recordId);

  if ((existingCount ?? 0) + files.length > MAX_ATTACHMENTS_PER_RECORD) {
    return {
      error: `This record can have at most ${MAX_ATTACHMENTS_PER_RECORD} attachments (it currently has ${existingCount ?? 0}).`,
    };
  }

  for (const file of files) {
    const validation = await validateAttachmentFile(file);
    if (!validation.ok) return { error: validation.error };

    const storagePath = buildStoragePath(
      userId,
      propertyId,
      recordId,
      validation.contentType,
    );

    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(storagePath, file, {
        contentType: validation.contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Attachment upload failed:", errorCode(uploadError));
      return { error: `We could not upload "${file.name}". Please try again.` };
    }

    const { error: insertError } = await supabase.from("evidence_attachments").insert({
      property_id: propertyId,
      evidence_record_id: recordId,
      storage_path: storagePath,
      original_file_name: file.name,
      content_type: validation.contentType,
      size_bytes: file.size,
    });

    if (insertError) {
      console.error("Attachment record insert failed:", errorCode(insertError));
      // Clean up the orphaned storage object rather than leaving a file
      // with no database row pointing at it.
      await supabase.storage.from(ATTACHMENTS_BUCKET).remove([storagePath]);
      return { error: `We could not save "${file.name}". Please try again.` };
    }
  }

  redirect(`/properties/${propertyId}/evidence/${recordId}/edit`);
}

/** Only runs when the confirmation step was completed. */
export async function deleteAttachment(
  propertyId: string,
  recordId: string,
  attachmentId: string,
  formData: FormData,
) {
  if (!isSupabaseConfigured) return;
  if (formData.get("confirm") !== "delete") {
    redirect(`/properties/${propertyId}/evidence/${recordId}/edit`);
  }
  const { supabase } = await requireOwnEvidenceRecord(propertyId, recordId);

  const { data: attachment } = await supabase
    .from("evidence_attachments")
    .select("id, storage_path")
    .eq("id", attachmentId)
    .eq("evidence_record_id", recordId)
    .maybeSingle();

  if (!attachment) redirect(`/properties/${propertyId}/evidence/${recordId}/edit`);

  const { error: removeError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .remove([attachment.storage_path]);

  // Only remove the database row once the file itself is confirmed gone,
  // so we never end up with a row pointing at nothing (or a file with a
  // missing row while it's mid-way through deletion).
  if (!removeError) {
    await supabase.from("evidence_attachments").delete().eq("id", attachmentId);
  }

  redirect(`/properties/${propertyId}/evidence/${recordId}/edit`);
}

/** Deletes every attachment's storage object for an evidence record being deleted. */
export async function deleteAttachmentsForRecord(recordId: string) {
  if (!isSupabaseConfigured) return;
  const supabase = await createClient();

  const { data: attachments } = await supabase
    .from("evidence_attachments")
    .select("storage_path")
    .eq("evidence_record_id", recordId);

  if (attachments && attachments.length > 0) {
    await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .remove(attachments.map((a) => a.storage_path));
  }
}
