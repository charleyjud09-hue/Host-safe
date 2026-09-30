"use server";

import { redirect } from "next/navigation";
import { parsePropertyItemInput, type PropertyItemFormState } from "@/lib/property-items";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const notConfigured: PropertyItemFormState = {
  error: "Accounts are not switched on yet. Please try again later.",
};

/**
 * Confirms the signed-in user owns this property. RLS enforces this too;
 * this just gives a clear page instead of a database error.
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

export async function createPropertyItem(
  propertyId: string,
  _prev: PropertyItemFormState,
  formData: FormData,
): Promise<PropertyItemFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const parsed = parsePropertyItemInput(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  const { supabase } = await requireOwnProperty(propertyId);

  const { error } = await supabase
    .from("property_items")
    .insert({ ...parsed.data, property_id: propertyId });

  if (error) {
    console.error("Create property item failed:", error.code, error.message);
    return {
      error: "We could not save this item. Please try again.",
      values: parsed.values,
    };
  }

  redirect(`/properties/${propertyId}/items`);
}

export async function updatePropertyItem(
  propertyId: string,
  itemId: string,
  _prev: PropertyItemFormState,
  formData: FormData,
): Promise<PropertyItemFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const parsed = parsePropertyItemInput(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  const { supabase, userId } = await requireOwnProperty(propertyId);

  const { error } = await supabase
    .from("property_items")
    .update(parsed.data)
    .eq("id", itemId)
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  if (error) {
    console.error("Update property item failed:", error.code, error.message);
    return {
      error: "We could not save your changes. Please try again.",
      values: parsed.values,
    };
  }

  redirect(`/properties/${propertyId}/items`);
}

/** Sets status back to Not started. Needs no extra fields, so it's a quick action. */
export async function reopenPropertyItem(propertyId: string, itemId: string) {
  if (!isSupabaseConfigured) return;
  const { supabase, userId } = await requireOwnProperty(propertyId);

  await supabase
    .from("property_items")
    .update({ status: "not_started" })
    .eq("id", itemId)
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  redirect(`/properties/${propertyId}/items`);
}

export async function archivePropertyItem(propertyId: string, itemId: string) {
  if (!isSupabaseConfigured) return;
  const { supabase, userId } = await requireOwnProperty(propertyId);

  await supabase
    .from("property_items")
    .update({ status: "archived" })
    .eq("id", itemId)
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  redirect(`/properties/${propertyId}/items`);
}

/** Permanent delete. Only runs when the confirmation step was completed. */
export async function deletePropertyItem(
  propertyId: string,
  itemId: string,
  formData: FormData,
) {
  if (!isSupabaseConfigured) return;
  if (formData.get("confirm") !== "delete") {
    redirect(`/properties/${propertyId}/items/${itemId}/edit`);
  }
  const { supabase, userId } = await requireOwnProperty(propertyId);

  await supabase
    .from("property_items")
    .delete()
    .eq("id", itemId)
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  redirect(`/properties/${propertyId}/items`);
}
