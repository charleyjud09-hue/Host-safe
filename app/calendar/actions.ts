"use server";

import { redirect } from "next/navigation";
import {
  parseGuestStayInput,
  STAY_OVERLAP_ERROR,
  type GuestStayFormState,
} from "@/lib/calendar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const notConfigured: GuestStayFormState = {
  error: "Accounts are not switched on yet. Please try again later.",
};

/** Postgres exclusion_violation: the database refused an overlapping stay. */
const EXCLUSION_VIOLATION = "23P01";

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

const listUrl = (propertyId: string) => `/properties/${propertyId}/calendar`;
const entryUrl = (propertyId: string, entryId: string) =>
  `/properties/${propertyId}/calendar/${entryId}`;

/**
 * Friendly pre-check for another planned guest stay on these dates, each
 * stay being [arrival, departure). The database's exclusion constraint is
 * what makes this safe against two requests arriving at once.
 */
async function overlapsPlannedStay(
  supabase: Awaited<ReturnType<typeof createClient>>,
  propertyId: string,
  arrival: string,
  departure: string,
  excludeEntryId?: string,
): Promise<boolean> {
  let query = supabase
    .from("calendar_entries")
    .select("id")
    .eq("property_id", propertyId)
    .eq("entry_type", "guest_stay")
    .eq("status", "planned")
    .lt("start_date", departure)
    .gt("end_date", arrival)
    .limit(1);
  if (excludeEntryId) query = query.neq("id", excludeEntryId);

  const { data } = await query;
  return (data ?? []).length > 0;
}

export async function createGuestStay(
  propertyId: string,
  _prev: GuestStayFormState,
  formData: FormData,
): Promise<GuestStayFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const parsed = parseGuestStayInput(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  const { supabase } = await requireOwnProperty(propertyId);

  const arrival = parsed.data.start_date as string;
  const departure = parsed.data.end_date as string;
  if (await overlapsPlannedStay(supabase, propertyId, arrival, departure)) {
    return { error: STAY_OVERLAP_ERROR, values: parsed.values };
  }

  const { error } = await supabase
    .from("calendar_entries")
    .insert({ ...parsed.data, property_id: propertyId, entry_type: "guest_stay" });

  if (error) {
    if (error.code === EXCLUSION_VIOLATION) {
      return { error: STAY_OVERLAP_ERROR, values: parsed.values };
    }
    // Code only: database messages and details can contain row values.
    console.error("Create guest stay failed:", error.code);
    return {
      error: "We could not save this stay. Please try again.",
      values: parsed.values,
    };
  }

  redirect(listUrl(propertyId));
}

/** Only planned stays can be edited; a cancelled stay is read-only. */
export async function updateGuestStay(
  propertyId: string,
  entryId: string,
  _prev: GuestStayFormState,
  formData: FormData,
): Promise<GuestStayFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const parsed = parseGuestStayInput(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  const { supabase, userId } = await requireOwnProperty(propertyId);

  const arrival = parsed.data.start_date as string;
  const departure = parsed.data.end_date as string;
  if (await overlapsPlannedStay(supabase, propertyId, arrival, departure, entryId)) {
    return { error: STAY_OVERLAP_ERROR, values: parsed.values };
  }

  const { error } = await supabase
    .from("calendar_entries")
    .update(parsed.data)
    .eq("id", entryId)
    .eq("property_id", propertyId)
    .eq("user_id", userId)
    .eq("entry_type", "guest_stay")
    .eq("status", "planned");

  if (error) {
    if (error.code === EXCLUSION_VIOLATION) {
      return { error: STAY_OVERLAP_ERROR, values: parsed.values };
    }
    console.error("Update guest stay failed:", error.code);
    return {
      error: "We could not save your changes. Please try again.",
      values: parsed.values,
    };
  }

  redirect(listUrl(propertyId));
}

/**
 * One-way cancel. Status and guest first name change in a single update,
 * so a cancelled stay can never keep a name. Only runs when the
 * confirmation step was completed.
 */
export async function cancelGuestStay(
  propertyId: string,
  entryId: string,
  formData: FormData,
) {
  if (!isSupabaseConfigured) return;
  if (formData.get("confirm") !== "cancel") redirect(entryUrl(propertyId, entryId));

  const { supabase, userId } = await requireOwnProperty(propertyId);

  const { error } = await supabase
    .from("calendar_entries")
    .update({ status: "cancelled", guest_first_name: null })
    .eq("id", entryId)
    .eq("property_id", propertyId)
    .eq("user_id", userId)
    .eq("entry_type", "guest_stay")
    .eq("status", "planned");
  if (error) console.error("Cancel guest stay failed:", error.code);

  redirect(entryUrl(propertyId, entryId));
}

/** Clears only the guest first name; everything else on the stay is kept. */
export async function removeGuestName(propertyId: string, entryId: string) {
  if (!isSupabaseConfigured) return;
  const { supabase, userId } = await requireOwnProperty(propertyId);

  const { error } = await supabase
    .from("calendar_entries")
    .update({ guest_first_name: null })
    .eq("id", entryId)
    .eq("property_id", propertyId)
    .eq("user_id", userId)
    .eq("entry_type", "guest_stay");
  if (error) console.error("Remove guest name failed:", error.code);

  redirect(entryUrl(propertyId, entryId));
}

/**
 * Permanent delete. Only runs when the confirmation step was completed,
 * so a stray form submission can't delete an entry.
 */
export async function deleteCalendarEntry(
  propertyId: string,
  entryId: string,
  formData: FormData,
) {
  if (!isSupabaseConfigured) return;
  if (formData.get("confirm") !== "delete") redirect(entryUrl(propertyId, entryId));

  const { supabase, userId } = await requireOwnProperty(propertyId);

  const { error } = await supabase
    .from("calendar_entries")
    .delete()
    .eq("id", entryId)
    .eq("property_id", propertyId)
    .eq("user_id", userId);
  if (error) {
    console.error("Delete calendar entry failed:", error.code);
    redirect(entryUrl(propertyId, entryId));
  }

  redirect(listUrl(propertyId));
}
