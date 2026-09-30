"use server";

import { redirect } from "next/navigation";
import {
  buildMaintenancePhotoPath,
  MAINTENANCE_PHOTOS_BUCKET,
  MAX_PHOTOS_PER_ISSUE,
  validateMaintenancePhoto,
} from "@/lib/maintenance-photos";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type PhotoUploadResult = { error?: string };

/**
 * Confirms the signed-in user owns the property and that the issue belongs
 * to it. RLS enforces this at the database and Storage layers too.
 */
async function requireOwnIssue(propertyId: string, issueId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: issue } = await supabase
    .from("maintenance_issues")
    .select("id")
    .eq("id", issueId)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (!issue) redirect("/");

  return { supabase, userId: userData.user.id };
}

/**
 * Uploads ONE photo. The browser sends photos one at a time so several
 * phone photos never exceed the request size limit together.
 */
export async function uploadMaintenancePhoto(
  propertyId: string,
  issueId: string,
  formData: FormData,
): Promise<PhotoUploadResult> {
  if (!isSupabaseConfigured) {
    return { error: "Accounts are not switched on yet. Please try again later." };
  }
  const { supabase, userId } = await requireOwnIssue(propertyId, issueId);

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a photo to upload." };
  }

  // Re-checked on the server for every photo, not just hidden in the UI.
  const { count } = await supabase
    .from("maintenance_photos")
    .select("id", { count: "exact", head: true })
    .eq("issue_id", issueId);
  if ((count ?? 0) >= MAX_PHOTOS_PER_ISSUE) {
    return {
      error: `This issue already has the maximum of ${MAX_PHOTOS_PER_ISSUE} photos.`,
    };
  }

  const validation = await validateMaintenancePhoto(file);
  if (!validation.ok) return { error: validation.error };

  const storagePath = buildMaintenancePhotoPath(
    userId,
    propertyId,
    issueId,
    validation.contentType,
  );

  const { error: uploadError } = await supabase.storage
    .from(MAINTENANCE_PHOTOS_BUCKET)
    .upload(storagePath, file, { contentType: validation.contentType, upsert: false });
  if (uploadError) {
    console.error("Maintenance photo upload failed:", uploadError.message);
    return { error: `We could not upload "${file.name}". Please try again.` };
  }

  const { error: insertError } = await supabase.from("maintenance_photos").insert({
    property_id: propertyId,
    issue_id: issueId,
    storage_path: storagePath,
    original_file_name: file.name,
    content_type: validation.contentType,
    size_bytes: file.size,
  });
  if (insertError) {
    console.error("Maintenance photo save failed:", insertError.code, insertError.message);
    // Don't leave a file behind with no record pointing at it.
    await supabase.storage.from(MAINTENANCE_PHOTOS_BUCKET).remove([storagePath]);
    return { error: `We could not save "${file.name}". Please try again.` };
  }

  return {};
}

/** Only runs when the confirmation step was completed. */
export async function deleteMaintenancePhoto(
  propertyId: string,
  issueId: string,
  photoId: string,
  formData: FormData,
) {
  if (!isSupabaseConfigured) return;
  const issueUrl = `/properties/${propertyId}/maintenance/${issueId}`;
  if (formData.get("confirm") !== "delete") redirect(issueUrl);
  const { supabase } = await requireOwnIssue(propertyId, issueId);

  const { data: photo } = await supabase
    .from("maintenance_photos")
    .select("id, storage_path")
    .eq("id", photoId)
    .eq("issue_id", issueId)
    .maybeSingle();
  if (!photo) redirect(issueUrl);

  const { error: removeError } = await supabase.storage
    .from(MAINTENANCE_PHOTOS_BUCKET)
    .remove([photo.storage_path]);

  // Only remove the record once the file itself is gone.
  if (!removeError) {
    await supabase.from("maintenance_photos").delete().eq("id", photoId);
  } else {
    console.error("Maintenance photo removal failed:", removeError.message);
  }

  redirect(issueUrl);
}
