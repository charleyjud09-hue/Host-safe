import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  cancelGuestStay,
  deleteCalendarEntry,
  removeGuestName,
  updateCalendarEntry,
  updateGuestStay,
} from "@/app/calendar/actions";
import AppShell from "@/components/AppShell";
import CalendarEntryForm from "@/components/CalendarEntryForm";
import ConfirmCalendarAction from "@/components/ConfirmCalendarAction";
import Footer from "@/components/Footer";
import GuestStayForm from "@/components/GuestStayForm";
import Header from "@/components/Header";
import { formatDisplayDate } from "@/lib/attention";
import {
  CALENDAR_DETAIL_COLUMNS,
  calendarEntryTypeLabel,
  CANCEL_STAY_NOTICE,
  REMOVE_GUEST_NAME_NOTICE,
  stayNights,
  type CalendarEntry,
} from "@/lib/calendar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Static on purpose: never a guest name, title, dates or booking reference.
export const metadata: Metadata = {
  title: "Calendar entry | HostSafe",
};

export default async function CalendarEntryPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { id, entryId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  // RLS scopes this to the user's own entries; the property filter makes
  // sure an entry ID can't be viewed under a different property's URL.
  const { data: entry } = await supabase
    .from("calendar_entries")
    .select(CALENDAR_DETAIL_COLUMNS)
    .eq("id", entryId)
    .eq("property_id", id)
    .maybeSingle<CalendarEntry>();
  if (!entry) notFound();

  const listHref = `/properties/${property.id}/calendar`;
  const isStay = entry.entry_type === "guest_stay";
  const isCancelled = entry.status === "cancelled";
  const label = calendarEntryTypeLabel(entry.entry_type);
  const card = "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8";
  const formKey = JSON.stringify([
    entry.start_date,
    entry.end_date,
    entry.title,
    entry.description,
    entry.blocks_guest_stays,
    entry.guest_first_name,
    entry.guest_count,
    entry.booking_reference,
  ]);

  let summary: string;
  if (isStay) {
    const nights = stayNights(entry);
    summary = `${formatDisplayDate(entry.start_date)} – ${formatDisplayDate(entry.end_date)} · ${nights} ${
      nights === 1 ? "night" : "nights"
    } · ${isCancelled ? "Cancelled" : "Planned"}`;
  } else if (entry.start_date === entry.end_date) {
    summary = formatDisplayDate(entry.start_date);
  } else {
    summary = `${formatDisplayDate(entry.start_date)} – ${formatDisplayDate(entry.end_date)}`;
  }

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-2xl px-5 py-10 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
            <Link href={`/properties/${property.id}`} className="hover:text-navy">
              {property.name}
            </Link>
            <span aria-hidden> / </span>
            <Link href={listHref} className="hover:text-navy">
              Stays &amp; calendar
            </Link>
          </nav>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy">{label}</h1>
          <p className="mt-2 text-slate-700">{summary}</p>

          {isStay && isCancelled && (
            <section aria-labelledby="details-heading" className={`mt-8 ${card}`}>
              <h2 id="details-heading" className="text-xl font-semibold text-navy">
                Stay details
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                This stay is cancelled and is kept as a read-only record.
              </p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-slate-600">Arrival date</dt>
                  <dd className="font-medium text-navy">
                    {formatDisplayDate(entry.start_date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-600">Departure date</dt>
                  <dd className="font-medium text-navy">
                    {formatDisplayDate(entry.end_date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-600">Number of guests</dt>
                  <dd className="font-medium text-navy">
                    {entry.guest_count ?? "Not recorded"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-600">Booking reference</dt>
                  <dd className="break-words font-medium text-navy">
                    {entry.booking_reference ?? "Not recorded"}
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {isStay && !isCancelled && (
            <>
              <section aria-labelledby="edit-heading" className={`mt-8 ${card}`}>
                <h2 id="edit-heading" className="text-xl font-semibold text-navy">
                  Stay details
                </h2>
                <div className="mt-5">
                  <GuestStayForm
                    // Remount when the saved values change (e.g. after "Remove
                    // guest name"), so the form never shows or re-saves stale data.
                    key={formKey}
                    action={updateGuestStay.bind(null, property.id, entry.id)}
                    stay={entry}
                    propertyName={property.name}
                    submitLabel="Save changes"
                    cancelHref={listHref}
                  />
                </div>
              </section>

              {entry.guest_first_name && (
                <section aria-labelledby="remove-name-heading" className={`mt-8 ${card}`}>
                  <h2
                    id="remove-name-heading"
                    className="text-xl font-semibold text-navy"
                  >
                    Remove guest name
                  </h2>
                  <p className="mt-2 text-slate-700">{REMOVE_GUEST_NAME_NOTICE}</p>
                  <form
                    action={removeGuestName.bind(null, property.id, entry.id)}
                    className="mt-4"
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-navy hover:bg-slate-50"
                    >
                      Remove guest name
                    </button>
                  </form>
                </section>
              )}

              <div className="mt-8">
                <ConfirmCalendarAction
                  action={cancelGuestStay.bind(null, property.id, entry.id)}
                  confirmValue="cancel"
                  triggerLabel="Cancel stay"
                  heading="Cancel this guest stay?"
                  body={CANCEL_STAY_NOTICE}
                  confirmLabel="Cancel stay"
                  keepLabel="Keep stay"
                />
              </div>
            </>
          )}

          {entry.entry_type !== "guest_stay" && (
            <section aria-labelledby="edit-heading" className={`mt-8 ${card}`}>
              <h2 id="edit-heading" className="text-xl font-semibold text-navy">
                Entry details
              </h2>
              <div className="mt-5">
                <CalendarEntryForm
                  key={formKey}
                  action={updateCalendarEntry.bind(
                    null,
                    property.id,
                    entry.id,
                    entry.entry_type,
                  )}
                  entryType={entry.entry_type}
                  entry={entry}
                  propertyName={property.name}
                  submitLabel="Save changes"
                  cancelHref={listHref}
                />
              </div>
            </section>
          )}

          <div className="mt-4">
            <ConfirmCalendarAction
              action={deleteCalendarEntry.bind(null, property.id, entry.id)}
              confirmValue="delete"
              triggerLabel={isStay ? "Delete stay" : "Delete entry"}
              heading={
                isStay
                  ? "Permanently delete this guest stay?"
                  : "Permanently delete this entry?"
              }
              body="This removes it and everything recorded on it. This can’t be undone."
              confirmLabel="Delete permanently"
              keepLabel={isStay ? "Keep stay" : "Keep entry"}
            />
          </div>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
