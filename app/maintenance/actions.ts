"use server";

import { redirect } from "next/navigation";
import { ukToday } from "@/lib/attention";
import { parseMaintenanceInput, type MaintenanceFormState } from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const notConfigured: MaintenanceFormState = {
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

const listUrl = (propertyId: string) => `/properties/${propertyId}/maintenance`;
const issueUrl = (propertyId: string, issueId: string) =>
  `/properties/${propertyId}/maintenance/${issueId}`;

export async function createMaintenanceIssue(
  propertyId: string,
  _prev: MaintenanceFormState,
  formData: FormData,
): Promise<MaintenanceFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const parsed = parseMaintenanceInput(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  const { supabase } = await requireOwnProperty(propertyId);

  const { data: created, error } = await supabase
    .from("maintenance_issues")
    .insert({ ...parsed.data, property_id: propertyId })
    .select("id")
    .single();

  if (error || !created) {
    console.error("Create maintenance issue failed:", error?.code, error?.message);
    return {
      error: "We could not save this issue. Please try again.",
      values: parsed.values,
    };
  }

  redirect(issueUrl(propertyId, created.id));
}

export async function updateMaintenanceIssue(
  propertyId: string,
  issueId: string,
  _prev: MaintenanceFormState,
  formData: FormData,
): Promise<MaintenanceFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const parsed = parseMaintenanceInput(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  const { supabase, userId } = await requireOwnProperty(propertyId);

  const { error } = await supabase
    .from("maintenance_issues")
    .update(parsed.data)
    .eq("id", issueId)
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  if (error) {
    console.error("Update maintenance issue failed:", error.code, error.message);
    return {
      error: "We could not save your changes. Please try again.",
      values: parsed.values,
    };
  }

  redirect(listUrl(propertyId));
}

/** Quick action: resolved as of today (UK). The date can be changed in the form. */
export async function resolveMaintenanceIssue(propertyId: string, issueId: string) {
  if (!isSupabaseConfigured) return;
  const { supabase, userId } = await requireOwnProperty(propertyId);

  await supabase
    .from("maintenance_issues")
    .update({ status: "resolved", resolved_date: ukToday() })
    .eq("id", issueId)
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  redirect(issueUrl(propertyId, issueId));
}

export async function archiveMaintenanceIssue(propertyId: string, issueId: string) {
  if (!isSupabaseConfigured) return;
  const { supabase, userId } = await requireOwnProperty(propertyId);

  await supabase
    .from("maintenance_issues")
    .update({ status: "archived", resolved_date: null })
    .eq("id", issueId)
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  redirect(listUrl(propertyId));
}

/**
 * Permanent delete. Only runs when the confirmation step was completed,
 * so a stray form submission can't delete an issue.
 */
export async function deleteMaintenanceIssue(
  propertyId: string,
  issueId: string,
  formData: FormData,
) {
  if (!isSupabaseConfigured) return;
  if (formData.get("confirm") !== "delete") redirect(issueUrl(propertyId, issueId));

  const { supabase, userId } = await requireOwnProperty(propertyId);

  await supabase
    .from("maintenance_issues")
    .delete()
    .eq("id", issueId)
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  redirect(listUrl(propertyId));
}
