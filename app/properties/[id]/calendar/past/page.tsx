import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CalendarEntryList from "@/components/CalendarEntryList";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ukToday } from "@/lib/attention";
import {
  CALENDAR_LIST_COLUMNS,
  groupByMonth,
  isPastEntry,
  sortEntries,
  type CalendarListEntry,
} from "@/lib/calendar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Past & cancelled entries | Letnook",
};

export default async function PastCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { id } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  const today = ukToday();

  // Cancelled stays, plus entries that have finished. List columns only —
  // no guest details or descriptions.
  const { data } = await supabase
    .from("calendar_entries")
    .select(CALENDAR_LIST_COLUMNS)
    .eq("property_id", id)
    .or(`status.eq.cancelled,end_date.lte.${today}`)
    .returns<CalendarListEntry[]>();
  const entries = sortEntries(
    (data ?? []).filter((e) => e.status === "cancelled" || isPastEntry(e, today)),
    true,
  );
  const months = groupByMonth(entries);
  const listHref = `/properties/${property.id}/calendar`;

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-3xl px-5 py-10 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
            <Link href={`/properties/${property.id}`} className="hover:text-navy">
              {property.name}
            </Link>
            <span aria-hidden> / </span>
            <Link href={listHref} className="hover:text-navy">
              Stays &amp; calendar
            </Link>
          </nav>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy">
            Past &amp; cancelled entries
          </h1>
          <p className="mt-2 text-slate-700">
            Cancelled guest stays are kept here as read-only records until you delete them.
          </p>

          <section
            aria-label="Past and cancelled entries"
            className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
          >
            {months.length === 0 ? (
              <p className="text-slate-700">
                No past or cancelled entries for this property.
              </p>
            ) : (
              months.map((month) => (
                <div key={month.key} className="mt-5 first:mt-0">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                    {month.label}
                  </h2>
                  <div className="mt-3">
                    <CalendarEntryList propertyId={property.id} entries={month.entries} />
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
