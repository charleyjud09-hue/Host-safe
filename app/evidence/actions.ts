"use server";

import { redirect } from "next/navigation";
import { deleteAttachmentsForRecord } from "@/app/evidence/attachments/actions";
import { parseEvidenceInput, type EvidenceFormState } from "@/lib/evidence-records";
import { errorCode } from "@/lib/log";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const notConfigured: EvidenceFormState = {
  error: "Accounts are not switched on yet. Please try again later.",
};

/**
 * Confirms the signed-in user owns this property before letting them add or
 * see evidence against it. RLS enforces this too; this just gives a clear
 * page instead of a database error.
 */
async function requireOwnProperty(propertyId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .maybeSingle();

  if (!property) redirect("/");

  return { supabase, userId: userData.user.id };
}

const documentsUrl = (propertyId: string) => `/properties/${propertyId}/documents`;
const recordUrl = (propertyId: string, recordId: string) =>
  `/properties/${propertyId}/evidence/${recordId}/edit`;

export async function createEvidenceRecord(
  propertyId: string,
  _prev: EvidenceFormState,
  formData: FormData,
): Promise<EvidenceFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const parsed = parseEvidenceInput(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  const { supabase } = await requireOwnProperty(propertyId);

  const { error } = await supabase
    .from("evidence_records")
    .insert({ ...parsed.data, property_id: propertyId });

  if (error) {
    console.error("Create evidence record failed:", errorCode(error));
    return {
      error: "We could not save this record. Please try again.",
      values: parsed.values,
    };
  }

  redirect(documentsUrl(propertyId));
}

export async function updateEvidenceRecord(
  propertyId: string,
  recordId: string,
  _prev: EvidenceFormState,
  formData: FormData,
): Promise<EvidenceFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const parsed = parseEvidenceInput(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  const { supabase, userId } = await requireOwnProperty(propertyId);

  const { error } = await supabase
    .from("evidence_records")
    .update(parsed.data)
    .eq("id", recordId)
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  if (error) {
    console.error("Update evidence record failed:", errorCode(error));
    return {
      error: "We could not save your changes. Please try again.",
      values: parsed.values,
    };
  }

  redirect(documentsUrl(propertyId));
}

export async function archiveEvidenceRecord(
  propertyId: string,
  recordId: string,
) {
  if (!isSupabaseConfigured) return;
  const { supabase, userId } = await requireOwnProperty(propertyId);

  await supabase
    .from("evidence_records")
    .update({ status: "archived" })
    .eq("id", recordId)
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  redirect(documentsUrl(propertyId));
}

/**
 * Permanent delete of the record and its attachments. Only runs when the
 * confirmation step was completed, so a stray submission can't delete it.
 */
export async function deleteEvidenceRecord(
  propertyId: string,
  recordId: string,
  formData: FormData,
) {
  if (!isSupabaseConfigured) return;
  if (formData.get("confirm") !== "delete") redirect(recordUrl(propertyId, recordId));
  const { supabase, userId } = await requireOwnProperty(propertyId);

  // Remove attachment files from Storage first, so the row cascade below
  // never leaves orphaned files behind in the bucket.
  await deleteAttachmentsForRecord(recordId);

  await supabase
    .from("evidence_records")
    .delete()
    .eq("id", recordId)
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  redirect(documentsUrl(propertyId));
}
