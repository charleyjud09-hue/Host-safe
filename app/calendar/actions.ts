"use server";

import { redirect } from "next/navigation";
import {
  BLOCK_OVERLAP_ERROR,
  parseEntryInput,
  parseGuestStayInput,
  sameDayTurnoverProblem,
  STAY_BLOCKED_ERROR,
  STAY_OVERLAP_ERROR,
  TURNOVER_TIMES_DB_ERROR,
  type CalendarEntryType,
  type EntryFormState,
  type GuestStayFormState,
} from "@/lib/calendar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type NonGuestType = Exclude<CalendarEntryType, "guest_stay">;
type Supabase = Awaited<ReturnType<typeof createClient>>;
type DbError = { code?: string; message?: string } | null;

const notConfigured = {
  error: "Accounts are not switched on yet. Please try again later.",
};

/** Postgres exclusion_violation: the database refused an overlapping entry. */
const EXCLUSION_VIOLATION = "23P01";
const BLOCK_CONSTRAINT = "calendar_entries_guest_stay_vs_blocking_block";
const TIME_CONSTRAINT = "calendar_entries_guest_stays_no_time_overlap";

type StayTimes = {
  start_date: string;
  end_date: string;
  arrival_time: string | null;
  departure_time: string | null;
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

const listUrl = (propertyId: string) => `/properties/${propertyId}/calendar`;
const entryUrl = (propertyId: string, entryId: string) =>
  `/properties/${propertyId}/calendar/${entryId}`;

/**
 * Friendly pre-check for a guest stay [arrival, departure): another planned
 * stay, or a blocking custom block [start, end + 1). The database's
 * exclusion constraints are what make this safe against simultaneous saves.
 */
async function guestStayConflict(
  supabase: Supabase,
  propertyId: string,
  stay: StayTimes,
  excludeEntryId?: string,
): Promise<string | null> {
  const arrival = stay.start_date;
  const departure = stay.end_date;
  let stays = supabase
    .from("calendar_entries")
    .select("id")
    .eq("property_id", propertyId)
    .eq("entry_type", "guest_stay")
    .eq("status", "planned")
    .lt("start_date", departure)
    .gt("end_date", arrival)
    .limit(1);
  if (excludeEntryId) stays = stays.neq("id", excludeEntryId);
  const { data: stayRows } = await stays;
  if ((stayRows ?? []).length > 0) return STAY_OVERLAP_ERROR;

  const { data: blockRows } = await supabase
    .from("calendar_entries")
    .select("id")
    .eq("property_id", propertyId)
    .eq("entry_type", "custom_block")
    .eq("status", "planned")
    .eq("blocks_guest_stays", true)
    .lt("start_date", departure)
    .gte("end_date", arrival)
    .limit(1);
  if ((blockRows ?? []).length > 0) return STAY_BLOCKED_ERROR;

  // Same-day turnovers: another planned stay leaving on this arrival date,
  // or arriving on this departure date, needs times on both sides.
  let neighbours = supabase
    .from("calendar_entries")
    .select("start_date, end_date, arrival_time, departure_time")
    .eq("property_id", propertyId)
    .eq("entry_type", "guest_stay")
    .eq("status", "planned")
    .or(`end_date.eq.${arrival},start_date.eq.${departure}`);
  if (excludeEntryId) neighbours = neighbours.neq("id", excludeEntryId);
  const { data: neighbourRows } = await neighbours;
  for (const other of neighbourRows ?? []) {
    const problem =
      other.end_date === arrival
        ? sameDayTurnoverProblem(other, stay, "arriving")
        : sameDayTurnoverProblem(stay, other, "leaving");
    if (problem) return problem;
  }

  return null;
}

/** Friendly pre-check for a blocking custom block [start, end + 1) against planned stays. */
async function blockConflictsWithStay(
  supabase: Supabase,
  propertyId: string,
  start: string,
  end: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("calendar_entries")
    .select("id")
    .eq("property_id", propertyId)
    .eq("entry_type", "guest_stay")
    .eq("status", "planned")
    .lte("start_date", end)
    .gt("end_date", start)
    .limit(1);
  return (data ?? []).length > 0;
}

/**
 * The database message is only inspected for the constraint name, to pick
 * the right fixed wording. It is never logged or shown.
 */
function guestStayErrorFor(error: NonNullable<DbError>): string | null {
  if (error.code !== EXCLUSION_VIOLATION) return null;
  if (error.message?.includes(BLOCK_CONSTRAINT)) return STAY_BLOCKED_ERROR;
  if (error.message?.includes(TIME_CONSTRAINT)) return TURNOVER_TIMES_DB_ERROR;
  return STAY_OVERLAP_ERROR;
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

  const conflict = await guestStayConflict(supabase, propertyId, parsed.data as StayTimes);
  if (conflict) return { error: conflict, values: parsed.values };

  const { error } = await supabase
    .from("calendar_entries")
    .insert({ ...parsed.data, property_id: propertyId, entry_type: "guest_stay" });

  if (error) {
    const overlap = guestStayErrorFor(error);
    if (overlap) return { error: overlap, values: parsed.values };
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

  const conflict = await guestStayConflict(
    supabase,
    propertyId,
    parsed.data as StayTimes,
    entryId,
  );
  if (conflict) return { error: conflict, values: parsed.values };

  const { error } = await supabase
    .from("calendar_entries")
    .update(parsed.data)
    .eq("id", entryId)
    .eq("property_id", propertyId)
    .eq("user_id", userId)
    .eq("entry_type", "guest_stay")
    .eq("status", "planned");

  if (error) {
    const overlap = guestStayErrorFor(error);
    if (overlap) return { error: overlap, values: parsed.values };
    console.error("Update guest stay failed:", error.code);
    return {
      error: "We could not save your changes. Please try again.",
      values: parsed.values,
    };
  }

  redirect(listUrl(propertyId));
}

async function saveEntry(
  mode: "create" | "update",
  propertyId: string,
  entryType: NonGuestType,
  entryId: string | null,
  formData: FormData,
): Promise<EntryFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const parsed = parseEntryInput(entryType, formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  const { supabase, userId } = await requireOwnProperty(propertyId);

  if (
    parsed.data.blocks_guest_stays === true &&
    (await blockConflictsWithStay(
      supabase,
      propertyId,
      parsed.data.start_date as string,
      parsed.data.end_date as string,
    ))
  ) {
    return { error: BLOCK_OVERLAP_ERROR, values: parsed.values };
  }

  let error: DbError;
  if (mode === "create") {
    ({ error } = await supabase
      .from("calendar_entries")
      .insert({ ...parsed.data, property_id: propertyId, entry_type: entryType }));
  } else {
    ({ error } = await supabase
      .from("calendar_entries")
      .update(parsed.data)
      .eq("id", entryId!)
      .eq("property_id", propertyId)
      .eq("user_id", userId)
      .eq("entry_type", entryType));
  }

  if (error) {
    if (error.code === EXCLUSION_VIOLATION) {
      return { error: BLOCK_OVERLAP_ERROR, values: parsed.values };
    }
    console.error(`${mode === "create" ? "Create" : "Update"} calendar entry failed:`, error.code);
    return {
      error: "We could not save this entry. Please try again.",
      values: parsed.values,
    };
  }

  redirect(listUrl(propertyId));
}

/** Planned work, planned cleanup or a custom block. */
export async function createCalendarEntry(
  propertyId: string,
  entryType: NonGuestType,
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  return saveEntry("create", propertyId, entryType, null, formData);
}

export async function updateCalendarEntry(
  propertyId: string,
  entryId: string,
  entryType: NonGuestType,
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  return saveEntry("update", propertyId, entryType, entryId, formData);
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
