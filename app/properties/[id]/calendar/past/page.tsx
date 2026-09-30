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
  type CalendarListEntry,
} from "@/lib/calendar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Past & cancelled stays | HostSafe",
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

  // Cancelled stays, plus planned stays whose departure date has been
  // reached. List columns only — no guest details.
  const { data } = await supabase
    .from("calendar_entries")
    .select(CALENDAR_LIST_COLUMNS)
    .eq("property_id", id)
    .eq("entry_type", "guest_stay")
    .or(`status.eq.cancelled,end_date.lte.${ukToday()}`)
    .order("start_date", { ascending: false })
    .returns<CalendarListEntry[]>();
  const months = groupByMonth(data ?? []);
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
            Past &amp; cancelled guest stays
          </h1>

          <section
            aria-label="Past and cancelled guest stays"
            className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
          >
            {months.length === 0 ? (
              <p className="text-slate-700">
                No past or cancelled guest stays for this property.
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
