/**
 * Property-specific "Needs your attention", built only from dates and
 * statuses the user has recorded. Never claims anything is overdue in a
 * legal sense, non-compliant, unsafe, or "all clear".
 *
 * The single source of reminder logic: used by the property selector, the
 * property overview, and the Actions & reminders page (including the badge
 * on each item in its list).
 */

import { itemServiceLabel } from "@/lib/property-items";

/**
 * Every open, dated reminder appears, at a level set by how close its date is:
 *   urgent     — the date has passed (red)
 *   very_soon  — today to 7 days away (lighter red)
 *   due_soon   — 8 to 30 days away (yellow)
 *   later      — more than 30 days away (clear)
 * "open" is only used for open maintenance issues with no due date: listed
 * neutrally (clear), with no date and no urgency.
 */
export type AttentionLevel = "urgent" | "very_soon" | "due_soon" | "open" | "later";

export type AttentionEntry = {
  key: string;
  level: AttentionLevel;
  /** Which property service this belongs to, or "Action" when unclassified. */
  serviceLabel: string;
  title: string;
  /** Extra neutral explanation, only where a date has already passed. */
  reason: string | null;
  /** Null only for undated open issues. */
  dateLabel: "Due" | "Review" | null;
  date: string | null;
  href: string;
};

export type AttentionItemInput = {
  id: string;
  property_id: string;
  title: string;
  item_type: string;
  /** Optional service tag; when absent the reminder is labelled "Action". */
  service?: string | null;
  status: string;
  due_date: string | null;
  review_date: string | null;
};

export type AttentionEvidenceInput = {
  id: string;
  property_id: string;
  title: string;
  status: string;
  review_date: string | null;
};

export type AttentionMaintenanceInput = {
  id: string;
  property_id: string;
  title: string;
  status: string;
  due_date: string | null;
};

const openMaintenanceStatuses = new Set(["open", "in_progress", "waiting"]);

const VERY_SOON_DAYS = 7;
const DUE_SOON_DAYS = 30;
const openItemStatuses = new Set(["not_started", "in_progress", "needs_review"]);
// Undated open issues sit before far-off ("later") reminders.
const levelOrder: Record<AttentionLevel, number> = {
  urgent: 0,
  very_soon: 1,
  due_soon: 2,
  open: 3,
  later: 4,
};

/** Today's calendar date in the UK (Europe/London), as YYYY-MM-DD. */
export function ukToday(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Adds whole days to a YYYY-MM-DD date string, calendar-only. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function levelFor(date: string, today: string): AttentionLevel {
  if (date < today) return "urgent";
  if (date <= addDays(today, VERY_SOON_DAYS)) return "very_soon";
  if (date <= addDays(today, DUE_SOON_DAYS)) return "due_soon";
  return "later";
}

type Candidate = { level: AttentionLevel; dateLabel: "Due" | "Review"; date: string };

/** Picks the most pressing of an item's dates (by level, then earliest). */
function bestCandidate(
  dates: { dateLabel: "Due" | "Review"; date: string | null }[],
  today: string,
): Candidate | null {
  let best: Candidate | null = null;
  for (const { dateLabel, date } of dates) {
    if (!date) continue;
    const level = levelFor(date, today);
    const candidate = { level, dateLabel, date };
    if (
      !best ||
      levelOrder[candidate.level] < levelOrder[best.level] ||
      (candidate.level === best.level && candidate.date < best.date)
    ) {
      best = candidate;
    }
  }
  return best;
}

/** The reminder for one action item, or null if it doesn't need attention. */
export function itemAttention(
  item: AttentionItemInput,
  today: string = ukToday(),
): AttentionEntry | null {
  if (!openItemStatuses.has(item.status)) return null;
  const c = bestCandidate(
    [
      { dateLabel: "Due", date: item.due_date },
      { dateLabel: "Review", date: item.review_date },
    ],
    today,
  );
  if (!c) return null;

  let reason: string | null = null;
  if (c.level === "urgent") {
    if (c.dateLabel === "Review") {
      reason = "Review date has passed — check whether this item needs reviewing.";
    } else if (item.item_type === "submit_send") {
      reason =
        "This item is not marked as submitted. Check the relevant requirement and take appropriate action.";
    } else {
      reason = "Due date has passed — this item may need attention.";
    }
  }

  return {
    key: `item-${item.id}`,
    level: c.level,
    // Only the service the user chose; never guessed.
    serviceLabel: itemServiceLabel(item.service) ?? "Action",
    title: item.title,
    reason,
    dateLabel: c.dateLabel,
    date: c.date,
    href: `/properties/${item.property_id}/items/${item.id}/edit`,
  };
}

export function buildAttention(
  items: AttentionItemInput[],
  evidence: AttentionEvidenceInput[],
  today: string = ukToday(),
  maintenance: AttentionMaintenanceInput[] = [],
): AttentionEntry[] {
  const entries: AttentionEntry[] = [];

  for (const item of items) {
    const entry = itemAttention(item, today);
    if (entry) entries.push(entry);
  }

  for (const record of evidence) {
    if (record.status === "archived" || !record.review_date) continue;
    const level = levelFor(record.review_date, today);
    entries.push({
      key: `evidence-${record.id}`,
      level,
      serviceLabel: "Documents & renewals",
      title: record.title,
      reason:
        level === "urgent"
          ? "Review date has passed — check whether this record needs reviewing."
          : null,
      dateLabel: "Review",
      date: record.review_date,
      href: `/properties/${record.property_id}/evidence/${record.id}/edit`,
    });
  }

  // Maintenance issues: open ones only (never resolved or archived).
  // Dated issues use the same levels as everything else; issues with no
  // due date are listed neutrally as "Open issue".
  for (const issue of maintenance) {
    if (!openMaintenanceStatuses.has(issue.status)) continue;
    if (!issue.due_date) {
      entries.push({
        key: `maintenance-${issue.id}`,
        level: "open",
        serviceLabel: "Maintenance & repairs",
        title: issue.title,
        reason: null,
        dateLabel: null,
        date: null,
        href: `/properties/${issue.property_id}/maintenance/${issue.id}`,
      });
      continue;
    }
    const level = levelFor(issue.due_date, today);
    entries.push({
      key: `maintenance-${issue.id}`,
      level,
      serviceLabel: "Maintenance & repairs",
      title: issue.title,
      reason:
        level === "urgent"
          ? "Due date has passed — this issue may need attention."
          : null,
      dateLabel: "Due",
      date: issue.due_date,
      href: `/properties/${issue.property_id}/maintenance/${issue.id}`,
    });
  }

  entries.sort(
    (a, b) =>
      levelOrder[a.level] - levelOrder[b.level] ||
      (a.date ?? "").localeCompare(b.date ?? "") ||
      a.title.localeCompare(b.title),
  );
  return entries;
}

export function countByLevel(entries: AttentionEntry[]) {
  const counts: Record<AttentionLevel, number> = {
    urgent: 0,
    very_soon: 0,
    due_soon: 0,
    open: 0,
    later: 0,
  };
  for (const e of entries) counts[e.level] += 1;
  return counts;
}

export const attentionLevelLabel: Record<AttentionLevel, string> = {
  // "Date passed", not "Urgent": Letnook only knows the date, not how urgent it is.
  urgent: "Date passed",
  very_soon: "Due very soon",
  due_soon: "Due soon",
  open: "Open issue",
  later: "Later",
};

/**
 * Shared colours for every reminder list and badge: red for passed and very
 * soon, yellow for soon, clear for far-off and undated. Always shown with the
 * text label above, never colour alone.
 */
export const attentionLevelStyle: Record<AttentionLevel, { row: string; badge: string }> = {
  urgent: {
    row: "border-l-4 border-red-600 bg-red-50",
    badge: "bg-red-700 text-white",
  },
  very_soon: {
    row: "border-l-4 border-red-400 bg-red-50/60",
    badge: "bg-red-100 text-red-900 ring-1 ring-red-300",
  },
  due_soon: {
    row: "border-l-4 border-amber-400 bg-amber-50",
    badge: "bg-amber-200 text-amber-950",
  },
  open: {
    row: "border-l-4 border-slate-300 bg-white",
    badge: "bg-white text-slate-800 ring-1 ring-slate-300",
  },
  later: {
    row: "border-l-4 border-slate-200 bg-white",
    badge: "bg-white text-slate-700 ring-1 ring-slate-200",
  },
};

export const NOTHING_NEEDS_ATTENTION =
  "Nothing needs attention right now, based on the dates and records you have added.";

export const REMINDER_NOTICE =
  "Reminders come only from the dates you’ve entered. They won’t cover every requirement or deadline that applies to you.";

/** Formats a YYYY-MM-DD date for display without timezone shifting. */
export function formatDisplayDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
