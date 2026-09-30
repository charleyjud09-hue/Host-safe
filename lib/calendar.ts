import { addDays } from "@/lib/attention";

/**
 * Stays & calendar — a private, per-property schedule of when a property is
 * occupied, blocked, being worked on or being cleaned. Organisational only:
 * nothing here says a property is ready, cleaned, safe, suitable or available.
 *
 * RANGE SPECIFICATION (the written source of truth)
 *
 * - Guest stay: occupies arrival (inclusive) up to departure (exclusive),
 *   i.e. [arrival, departure). The departure date is the checkout/turnover
 *   day and is not part of the stay, so one stay may depart on the day
 *   another arrives.
 * - Blocking custom block: occupies its start and end dates inclusive,
 *   i.e. [start, end + 1 day).
 * - Planned work, planned cleanup and non-blocking custom blocks never take
 *   part in overlap checks.
 * - Two occupied ranges overlap when each starts before the other ends.
 *
 * This file implements the specification for display and friendly server
 * validation. The database implements the same rules independently in its
 * CHECK and exclusion constraints. The manual test matrix checks both agree.
 */

export type CalendarEntryType =
  | "guest_stay"
  | "planned_work"
  | "planned_cleanup"
  | "custom_block";

export type CalendarEntryStatus = "planned" | "cancelled";

export const calendarEntryTypes: { value: CalendarEntryType; label: string; description: string }[] = [
  {
    value: "guest_stay",
    label: "Guest stay",
    description: "When guests are staying, from arrival to departure.",
  },
  {
    value: "planned_work",
    label: "Planned work",
    description: "Maintenance or repair work on a date or across a few days.",
  },
  {
    value: "planned_cleanup",
    label: "Planned cleanup",
    description: "A cleaning or turnover task on a chosen date.",
  },
  {
    value: "custom_block",
    label: "Custom block",
    description: "Owner use, a private event or any other period — can block guest stays.",
  },
];

export function isCalendarEntryType(v: unknown): v is CalendarEntryType {
  return calendarEntryTypes.some((t) => t.value === v);
}

export function calendarEntryTypeLabel(v: string): string {
  return calendarEntryTypes.find((t) => t.value === v)?.label ?? v;
}

/** Safe for lists: never includes guest name, count, booking reference or description. */
export const CALENDAR_LIST_COLUMNS =
  "id, property_id, entry_type, status, start_date, end_date, title, blocks_guest_stays";

/** Only for an entry's own detail page. */
export const CALENDAR_DETAIL_COLUMNS = `${CALENDAR_LIST_COLUMNS}, description, guest_first_name, guest_count, booking_reference`;

export type CalendarListEntry = {
  id: string;
  property_id: string;
  entry_type: CalendarEntryType;
  status: CalendarEntryStatus;
  /** Guest stay: arrival date. */
  start_date: string;
  /** Guest stay: departure date (not part of the stay). Others: last day, inclusive. */
  end_date: string;
  title: string | null;
  blocks_guest_stays: boolean | null;
};

export type CalendarEntry = CalendarListEntry & {
  description: string | null;
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

/** Shared form values for planned work, planned cleanup and custom blocks. */
export type EntryInput = {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  blocks_guest_stays: string;
};

export type EntryFormState = { error?: string; values?: EntryInput };

export const GUEST_FIRST_NAME_MAX = 40;
export const BOOKING_REFERENCE_MAX = 40;
export const GUEST_COUNT_MIN = 1;
export const GUEST_COUNT_MAX = 50;
export const TITLE_MAX = 80;
export const BLOCK_DESCRIPTION_MAX = 500;
const MIN_DATE = "2000-01-01";
const MAX_DATE = "2100-12-31";

/** Fixed wording — never includes details of the other entry. */
export const STAY_OVERLAP_ERROR =
  "These dates overlap an existing planned guest stay for this property. Choose different dates.";

export const STAY_BLOCKED_ERROR =
  "These dates overlap a custom block that blocks guest stays for this property. Choose different dates.";

export const BLOCK_OVERLAP_ERROR =
  "These dates overlap a planned guest stay for this property. Change the dates, or choose not to block guest stays.";

export const GUEST_NAME_HINT = "Only add what you need to recognise this booking.";

export const FREE_TEXT_HINT =
  "Don’t include names or contact details of guests, cleaners or contractors.";

export const REMOVE_GUEST_NAME_NOTICE =
  "This removes the guest’s first name. Dates, guest count, booking reference and stay status will be kept.";

export const CANCEL_STAY_NOTICE =
  "Cancelling removes the guest’s first name, and these dates will no longer stop another planned stay being recorded. Dates, guest count and booking reference will be kept. A cancelled stay cannot be changed back to planned.";

export const PLANNED_WORK_NOTICE =
  "Planned work is a calendar entry only. It is separate from Maintenance & repairs issues and does not confirm that any work has been done, or that the property is safe, compliant or ready for guests.";

export const PLANNED_CLEANUP_NOTICE =
  "A planned cleanup is a date you have chosen. HostSafe does not record or confirm that the property has been cleaned or is ready for guests.";

export const BLOCKING_HINT =
  "If yes, HostSafe will not let you record a planned guest stay on any of these dates, including the first and last day.";

export const TURNOVER_NOTICE =
  "Turnover dates are worked out from guest departure dates. They do not mean the property has been cleaned or is ready, safe or suitable for guests.";

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
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  );
}

/** Number of nights: departure minus arrival. */
export function stayNights(stay: { start_date: string; end_date: string }): number {
  return daysBetween(stay.start_date, stay.end_date);
}

/** The exclusive end of an entry's occupied range, per the specification above. */
export function occupiedEndExclusive(entry: { entry_type: string; end_date: string }): string {
  return entry.entry_type === "guest_stay" ? entry.end_date : addDays(entry.end_date, 1);
}

/** Current only while arrival <= today < departure, and not cancelled. */
export function isCurrentStay(
  entry: { entry_type: string; status: string; start_date: string; end_date: string },
  today: string,
): boolean {
  return (
    entry.entry_type === "guest_stay" &&
    entry.status === "planned" &&
    entry.start_date <= today &&
    today < entry.end_date
  );
}

/** Past once its last occupied day is before today (a stay's departure day counts as past). */
export function isPastEntry(
  entry: { entry_type: string; end_date: string },
  today: string,
): boolean {
  return occupiedEndExclusive(entry) <= today;
}

const typeOrder: Record<CalendarEntryType, number> = {
  custom_block: 0,
  planned_work: 1,
  planned_cleanup: 2,
  guest_stay: 3,
};

/** Date order; on the same date, blocks and work first, guest arrivals last. */
export function sortEntries<T extends CalendarListEntry>(entries: T[], descending = false): T[] {
  const dir = descending ? -1 : 1;
  return [...entries].sort(
    (a, b) =>
      dir * a.start_date.localeCompare(b.start_date) ||
      typeOrder[a.entry_type] - typeOrder[b.entry_type] ||
      a.end_date.localeCompare(b.end_date),
  );
}

export type Turnover = {
  /** The stay's departure date. */
  date: string;
  /** Arrival date of the next planned stay, if one is recorded. */
  nextArrival: string | null;
  /** Days between departure and the next arrival; 0 is a same-day turnover. */
  gapDays: number | null;
};

/**
 * Derived turnover for each planned guest stay: its departure date, and the
 * next planned stay's arrival. Never stored, and never implies the property
 * has been cleaned or is ready.
 */
export function buildTurnovers(entries: CalendarListEntry[]): Record<string, Turnover> {
  const stays = entries
    .filter((e) => e.entry_type === "guest_stay" && e.status === "planned")
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const result: Record<string, Turnover> = {};
  for (const stay of stays) {
    const next = stays.find((s) => s.id !== stay.id && s.start_date >= stay.end_date);
    result[stay.id] = {
      date: stay.end_date,
      nextArrival: next?.start_date ?? null,
      gapDays: next ? daysBetween(stay.end_date, next.start_date) : null,
    };
  }
  return result;
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

function readGuestStayValues(formData: FormData): GuestStayInput {
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
  const values = readGuestStayValues(formData);
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

function readEntryValues(formData: FormData): EntryInput {
  const get = (k: string) => String(formData.get(k) ?? "");
  return {
    title: get("title"),
    description: get("description"),
    start_date: get("start_date"),
    end_date: get("end_date"),
    blocks_guest_stays: get("blocks_guest_stays"),
  };
}

/**
 * Planned work, planned cleanup and custom blocks. Mirrors the database
 * CHECK constraints; fields that don't belong to the type are always null.
 */
export function parseEntryInput(
  entryType: Exclude<CalendarEntryType, "guest_stay">,
  formData: FormData,
):
  | { data: Record<string, unknown>; values: EntryInput }
  | { error: string; values: EntryInput } {
  const values = readEntryValues(formData);
  const title = values.title.trim();
  const description = values.description.trim();
  const start = values.start_date;
  const end = entryType === "planned_cleanup" ? start : values.end_date || start;

  if (entryType !== "planned_cleanup") {
    if (!title) return { error: "Please enter a short title.", values };
    if (title.length > TITLE_MAX) {
      return { error: `The title must be ${TITLE_MAX} characters or fewer.`, values };
    }
  }
  if (entryType === "custom_block") {
    if (!description) return { error: "Please enter a description.", values };
    if (description.length > BLOCK_DESCRIPTION_MAX) {
      return {
        error: `The description must be ${BLOCK_DESCRIPTION_MAX} characters or fewer.`,
        values,
      };
    }
    if (values.blocks_guest_stays !== "yes" && values.blocks_guest_stays !== "no") {
      return { error: "Please choose whether this blocks guest stays.", values };
    }
  }
  if (!validDate(start)) {
    return {
      error:
        entryType === "planned_cleanup"
          ? "Please enter a valid date."
          : "Please enter a valid start date.",
      values,
    };
  }
  if (!validDate(end)) {
    return { error: "Please enter a valid end date, or leave it blank.", values };
  }
  if (end < start) {
    return { error: "The end date cannot be before the start date.", values };
  }

  return {
    data: {
      title: entryType === "planned_cleanup" ? null : title,
      description: entryType === "custom_block" ? description : null,
      start_date: start,
      end_date: end,
      blocks_guest_stays:
        entryType === "custom_block" ? values.blocks_guest_stays === "yes" : null,
    },
    values,
  };
}
