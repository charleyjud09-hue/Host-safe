/**
 * Stays & calendar — a private, per-property schedule. Organisational only:
 * nothing here says a property is ready, cleaned, safe or available.
 *
 * RANGE SPECIFICATION (the written source of truth)
 *
 * - Guest stay: occupies arrival (inclusive) up to departure (exclusive),
 *   i.e. [arrival, departure). The departure date is the checkout day and is
 *   not part of the stay, so one stay may depart on the day another arrives.
 * - Blocking custom block: occupies its start and end dates inclusive,
 *   i.e. [start, end + 1 day).
 * - Everything else never takes part in overlap checks.
 * - Two occupied ranges overlap when each starts before the other ends.
 *
 * This file implements the specification for display and friendly server
 * validation. The database implements the same rules independently in its
 * CHECK and exclusion constraints. The manual test matrix checks both agree.
 */

export type CalendarEntryStatus = "planned" | "cancelled";

/** Safe for lists: never includes guest name, count or booking reference. */
export const CALENDAR_LIST_COLUMNS = "id, property_id, entry_type, status, start_date, end_date";

/** Only for the guest-stay detail page. */
export const GUEST_STAY_DETAIL_COLUMNS =
  "id, property_id, entry_type, status, start_date, end_date, guest_first_name, guest_count, booking_reference";

export type CalendarListEntry = {
  id: string;
  property_id: string;
  entry_type: string;
  status: CalendarEntryStatus;
  /** Guest stay: arrival date. */
  start_date: string;
  /** Guest stay: departure date (not part of the stay). */
  end_date: string;
};

export type GuestStay = CalendarListEntry & {
  guest_first_name: string | null;
  guest_count: number | null;
  booking_reference: string | null;
};

export type GuestStayInput = {
  arrival_date: string;
  departure_date: string;
  guest_first_name: string;
  guest_count: string;
  booking_reference: string;
};

export type GuestStayFormState = { error?: string; values?: GuestStayInput };

export const GUEST_FIRST_NAME_MAX = 40;
export const BOOKING_REFERENCE_MAX = 40;
export const GUEST_COUNT_MIN = 1;
export const GUEST_COUNT_MAX = 50;
const MIN_DATE = "2000-01-01";
const MAX_DATE = "2100-12-31";

/** Fixed wording — never includes details of the other stay. */
export const STAY_OVERLAP_ERROR =
  "These dates overlap an existing planned guest stay for this property. Choose different dates.";

export const GUEST_NAME_HINT = "Only add what you need to recognise this booking.";

export const REMOVE_GUEST_NAME_NOTICE =
  "This removes the guest’s first name. Dates, guest count, booking reference and stay status will be kept.";

export const CANCEL_STAY_NOTICE =
  "Cancelling removes the guest’s first name, and these dates will no longer stop another planned stay being recorded. Dates, guest count and booking reference will be kept. A cancelled stay cannot be changed back to planned.";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function validDate(v: string) {
  return (
    isoDate.test(v) &&
    !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) &&
    v >= MIN_DATE &&
    v <= MAX_DATE
  );
}

/** Whole days from one YYYY-MM-DD date to another, calendar-only. */
function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  );
}

/** Number of nights: departure minus arrival. */
export function stayNights(stay: { start_date: string; end_date: string }): number {
  return daysBetween(stay.start_date, stay.end_date);
}

/** Current only while arrival <= today < departure, and not cancelled. */
export function isCurrentStay(
  stay: { status: string; start_date: string; end_date: string },
  today: string,
): boolean {
  return stay.status === "planned" && stay.start_date <= today && today < stay.end_date;
}

/** Overlap of two guest stays, each [arrival, departure). */
export function guestStaysOverlap(
  a: { start_date: string; end_date: string },
  b: { start_date: string; end_date: string },
): boolean {
  return a.start_date < b.end_date && b.start_date < a.end_date;
}

/** Groups date-ordered entries under "October 2026"-style month headings. */
export function groupByMonth<T extends { start_date: string }>(
  entries: T[],
): { key: string; label: string; entries: T[] }[] {
  const groups: { key: string; label: string; entries: T[] }[] = [];
  for (const entry of entries) {
    const key = entry.start_date.slice(0, 7);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = {
        key,
        label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }),
        entries: [],
      };
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups;
}

function readValues(formData: FormData): GuestStayInput {
  const get = (k: string) => String(formData.get(k) ?? "");
  return {
    arrival_date: get("arrival_date"),
    departure_date: get("departure_date"),
    guest_first_name: get("guest_first_name"),
    guest_count: get("guest_count"),
    booking_reference: get("booking_reference"),
  };
}

/**
 * Mirrors the database CHECK constraints, so a friendly message appears
 * before the database would reject the row. Error messages are fixed
 * strings and never echo what was typed.
 */
export function parseGuestStayInput(
  formData: FormData,
):
  | { data: Record<string, unknown>; values: GuestStayInput }
  | { error: string; values: GuestStayInput } {
  const values = readValues(formData);
  const firstName = values.guest_first_name.trim();
  const reference = values.booking_reference.trim();
  const countRaw = values.guest_count.trim();

  if (!validDate(values.arrival_date)) {
    return { error: "Please enter a valid arrival date.", values };
  }
  if (!validDate(values.departure_date)) {
    return { error: "Please enter a valid departure date.", values };
  }
  if (values.departure_date <= values.arrival_date) {
    return { error: "The departure date must be after the arrival date.", values };
  }
  if (firstName.length > GUEST_FIRST_NAME_MAX) {
    return {
      error: `The guest first name must be ${GUEST_FIRST_NAME_MAX} characters or fewer.`,
      values,
    };
  }
  if (reference.length > BOOKING_REFERENCE_MAX) {
    return {
      error: `The booking reference must be ${BOOKING_REFERENCE_MAX} characters or fewer.`,
      values,
    };
  }
  const count = countRaw ? Number(countRaw) : null;
  if (
    count !== null &&
    (!Number.isInteger(count) || count < GUEST_COUNT_MIN || count > GUEST_COUNT_MAX)
  ) {
    return {
      error: `The number of guests must be a whole number from ${GUEST_COUNT_MIN} to ${GUEST_COUNT_MAX}, or left blank.`,
      values,
    };
  }

  return {
    data: {
      start_date: values.arrival_date,
      end_date: values.departure_date,
      guest_first_name: firstName || null,
      guest_count: count,
      booking_reference: reference || null,
    },
    values,
  };
}
