"use server";

import { redirect } from "next/navigation";
import {
  parsePropertyInput,
  safePropertyReturnTo,
  type PropertyFormState,
} from "@/lib/properties";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const notConfigured: PropertyFormState = {
  error: "Accounts are not switched on yet. Please try again later.",
};

function currentValues(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    address: String(formData.get("address") ?? ""),
    property_type: String(formData.get("property_type") ?? ""),
    floors: String(formData.get("floors") ?? ""),
    max_guests: String(formData.get("max_guests") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

export async function createProperty(
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const parsed = parsePropertyInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error, values: currentValues(formData) };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { error } = await supabase.from("properties").insert(parsed.data);

  if (error) {
    console.error("Create property failed:", error.code, error.message);
    return {
      error: "We could not save this property. Please try again.",
      values: currentValues(formData),
    };
  }

  redirect("/dashboard");
}

export async function updateProperty(
  propertyId: string,
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const parsed = parsePropertyInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error, values: currentValues(formData) };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  // RLS also enforces this; the explicit filter just keeps intent clear.
  const { error } = await supabase
    .from("properties")
    .update(parsed.data)
    .eq("id", propertyId)
    .eq("user_id", userData.user.id);

  if (error) {
    console.error("Update property failed:", error.code, error.message);
    return {
      error: "We could not save your changes. Please try again.",
      values: currentValues(formData),
    };
  }

  // Re-validated here, never trusted from the form: only "/" or this
  // property's overview are allowed; otherwise keep the original /dashboard.
  redirect(safePropertyReturnTo(formData.get("returnTo"), propertyId) ?? "/dashboard");
}
