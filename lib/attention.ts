/**
 * Property-specific "Needs your attention", built only from dates and
 * statuses the user has recorded. Never claims anything is overdue in a
 * legal sense, non-compliant, unsafe, or "all clear".
 *
 * Used by the property selector and property overview. The older
 * getAttentionReason() in lib/property-items.ts still drives /dashboard and
 * the items pages, unchanged.
 */

export type AttentionLevel = "urgent" | "due_soon" | "upcoming";

export type AttentionEntry = {
  key: string;
  level: AttentionLevel;
  /** Which property service this belongs to, or "Action" when unclassified. */
  serviceLabel: string;
  title: string;
  /** Extra neutral explanation, only where a date has already passed. */
  reason: string | null;
  dateLabel: "Due" | "Review";
  date: string;
  href: string;
};

export type AttentionItemInput = {
  id: string;
  property_id: string;
  title: string;
  item_type: string;
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

const DUE_SOON_DAYS = 7;
const UPCOMING_DAYS = 30;
const openItemStatuses = new Set(["not_started", "in_progress", "needs_review"]);
const levelOrder: Record<AttentionLevel, number> = {
  urgent: 0,
  due_soon: 1,
  upcoming: 2,
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

function levelFor(date: string, today: string): AttentionLevel | null {
  if (date < today) return "urgent";
  if (date <= addDays(today, DUE_SOON_DAYS)) return "due_soon";
  if (date <= addDays(today, UPCOMING_DAYS)) return "upcoming";
  return null;
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
    if (!level) continue;
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

export function buildAttention(
  items: AttentionItemInput[],
  evidence: AttentionEvidenceInput[],
  today: string = ukToday(),
): AttentionEntry[] {
  const entries: AttentionEntry[] = [];

  for (const item of items) {
    if (!openItemStatuses.has(item.status)) continue;
    const c = bestCandidate(
      [
        { dateLabel: "Due", date: item.due_date },
        { dateLabel: "Review", date: item.review_date },
      ],
      today,
    );
    if (!c) continue;

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

    entries.push({
      key: `item-${item.id}`,
      level: c.level,
      // No service classification exists on items yet — never guess one.
      serviceLabel: "Action",
      title: item.title,
      reason,
      dateLabel: c.dateLabel,
      date: c.date,
      href: `/properties/${item.property_id}/items/${item.id}/edit`,
    });
  }

  for (const record of evidence) {
    if (record.status === "archived" || !record.review_date) continue;
    const level = levelFor(record.review_date, today);
    if (!level) continue;
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

  entries.sort(
    (a, b) =>
      levelOrder[a.level] - levelOrder[b.level] || a.date.localeCompare(b.date),
  );
  return entries;
}

export function countByLevel(entries: AttentionEntry[]) {
  const counts: Record<AttentionLevel, number> = {
    urgent: 0,
    due_soon: 0,
    upcoming: 0,
  };
  for (const e of entries) counts[e.level] += 1;
  return counts;
}

export const attentionLevelLabel: Record<AttentionLevel, string> = {
  urgent: "Urgent",
  due_soon: "Due soon",
  upcoming: "Upcoming",
};

export const NOTHING_NEEDS_ATTENTION =
  "Nothing needs attention right now, based on the dates and records you have added.";

export const REMINDER_NOTICE =
  "Reminders are based on the dates and statuses recorded in HostSafe. They are organisational prompts only and may not identify every requirement or deadline that applies to you.";

/** Formats a YYYY-MM-DD date for display without timezone shifting. */
export function formatDisplayDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
