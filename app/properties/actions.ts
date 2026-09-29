"use server";

import { redirect } from "next/navigation";
import { mayNeedTailoredAdvice, parseAnswers, type Answers } from "@/lib/eligibility";
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

  // The one-time property questions, answered just before this form.
  // Re-validated here against the fixed question list; never trusted.
  let answers: Answers | null = null;
  try {
    answers = parseAnswers(JSON.parse(String(formData.get("eligibility_answers") ?? "")));
  } catch {
    answers = null;
  }
  if (!answers) {
    return {
      error: "Please answer the property questions before adding this property.",
      values: currentValues(formData),
    };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: created, error } = await supabase
    .from("properties")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !created) {
    console.error("Create property failed:", error?.code, error?.message);
    return {
      error: "We could not save this property. Please try again.",
      values: currentValues(formData),
    };
  }

  const { error: checkError } = await supabase.from("eligibility_results").insert({
    property_id: created.id,
    answers,
    may_need_tailored_advice: mayNeedTailoredAdvice(answers),
  });

  if (checkError) {
    console.error("Save property check failed:", checkError.code, checkError.message);
    // Roll back the just-created (still empty) property so the two are
    // saved together or not at all.
    await supabase
      .from("properties")
      .delete()
      .eq("id", created.id)
      .eq("user_id", userData.user.id);
    return {
      error: "We could not save this property. Please try again.",
      values: currentValues(formData),
    };
  }

  redirect(`/properties/${created.id}`);
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
