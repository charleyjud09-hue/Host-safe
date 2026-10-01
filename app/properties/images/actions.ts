"use server";

import { redirect } from "next/navigation";
import {
  buildPropertyImagePath,
  PROPERTY_IMAGES_BUCKET,
  validatePropertyImage,
} from "@/lib/property-images";
import { errorCode } from "@/lib/log";
import { editBlockedMessage } from "@/lib/membership-server";
import { safePropertyReturnTo } from "@/lib/properties";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type PropertyImageFormState = { error?: string };

function editPageUrl(propertyId: string, returnTo: string | null) {
  return `/properties/${propertyId}/edit${
    returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
  }`;
}

/**
 * Confirms the signed-in user owns this property (RLS enforces this too)
 * and returns its current image path, if any.
 */
async function requireOwnProperty(propertyId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .maybeSingle();
  if (!property) redirect("/");

  return {
    supabase,
    userId: userData.user.id,
    currentPath: (property.image_path as string | null | undefined) ?? null,
  };
}

/**
 * Add or replace the property image. Order: upload the new file, point the
 * property at it, then delete the old file. If pointing fails, the new file
 * is removed and the old image is left untouched.
 */
export async function uploadPropertyImage(
  propertyId: string,
  returnToRaw: string | null,
  _prev: PropertyImageFormState,
  formData: FormData,
): Promise<PropertyImageFormState> {
  if (!isSupabaseConfigured) {
    return { error: "Accounts are not switched on yet. Please try again later." };
  }
  const returnTo = safePropertyReturnTo(returnToRaw, propertyId);
  const { supabase, userId, currentPath } = await requireOwnProperty(propertyId);
  const blocked = await editBlockedMessage();
  if (blocked) return { error: blocked };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose an image to upload." };
  }

  const validation = await validatePropertyImage(file);
  if (!validation.ok) return { error: validation.error };

  const newPath = buildPropertyImagePath(userId, propertyId, validation.contentType);

  const { error: uploadError } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(newPath, file, { contentType: validation.contentType, upsert: false });
  if (uploadError) {
    console.error("Property image upload failed:", errorCode(uploadError));
    return { error: "We could not upload that image. Please try again." };
  }

  const { error: updateError } = await supabase
    .from("properties")
    .update({
      image_path: newPath,
      image_content_type: validation.contentType,
      image_size_bytes: file.size,
      image_updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId)
    .eq("user_id", userId);

  if (updateError) {
    console.error("Property image save failed:", errorCode(updateError));
    await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([newPath]);
    return { error: "We could not save that image. Please try again." };
  }

  if (currentPath && currentPath !== newPath) {
    const { error: removeOldError } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .remove([currentPath]);
    if (removeOldError) {
      // The property already points at the new image; the old file is
      // simply left behind. Logged so it can be cleaned up.
      console.error("Old property image cleanup failed:", errorCode(removeOldError));
    }
  }

  redirect(editPageUrl(propertyId, returnTo));
}

/**
 * Remove the property image. The file is deleted first; the property is
 * only cleared once that succeeds, so it never points at a missing file.
 */
export async function removePropertyImage(
  propertyId: string,
  returnToRaw: string | null,
  formData: FormData,
) {
  if (!isSupabaseConfigured) return;
  const returnTo = safePropertyReturnTo(returnToRaw, propertyId);
  // Only runs when the confirmation step was completed.
  if (formData.get("confirm") !== "remove") redirect(editPageUrl(propertyId, returnTo));
  const { supabase, userId, currentPath } = await requireOwnProperty(propertyId);

  if (currentPath) {
    const { error: removeError } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .remove([currentPath]);
    if (removeError) {
      console.error("Property image removal failed:", errorCode(removeError));
      redirect(editPageUrl(propertyId, returnTo));
    }

    await supabase
      .from("properties")
      .update({
        image_path: null,
        image_content_type: null,
        image_size_bytes: null,
        image_updated_at: new Date().toISOString(),
      })
      .eq("id", propertyId)
      .eq("user_id", userId);
  }

  redirect(editPageUrl(propertyId, returnTo));
}
