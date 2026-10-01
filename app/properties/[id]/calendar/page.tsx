import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CalendarEntryList, { turnoverText, ZeroGapWarning } from "@/components/CalendarEntryList";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MembersOnlyLink from "@/components/MembersOnlyLink";
import { formatDisplayDate, ukToday } from "@/lib/attention";
import {
  buildTurnovers,
  CALENDAR_LIST_COLUMNS,
  groupByMonth,
  isCurrentStay,
  isPastEntry,
  isZeroGap,
  sortEntries,
  stayNights,
  TURNOVER_NOTICE,
  type CalendarListEntry,
} from "@/lib/calendar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Stays & calendar | Letnook",
};

export default async function CalendarPage({
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

  // Planned entries whose last day is today or later. List columns only —
  // no guest details or descriptions. Returns no rows (not an error page)
  // before the table exists.
  const { data } = await supabase
    .from("calendar_entries")
    .select(CALENDAR_LIST_COLUMNS)
    .eq("property_id", id)
    .eq("status", "planned")
    .gte("end_date", today)
    .returns<CalendarListEntry[]>();
  const entries = sortEntries((data ?? []).filter((e) => !isPastEntry(e, today)));

  const turnovers = buildTurnovers(entries);
  const current = entries.find((e) => isCurrentStay(e, today));
  const months = groupByMonth(entries.filter((e) => e.id !== current?.id));
  const currentTurnover = current ? turnovers[current.id] : undefined;
  const hasStays = entries.some((e) => e.entry_type === "guest_stay");

  const base = `/properties/${property.id}/calendar`;
  const card = "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card";

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-3xl px-5 py-10 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
            <Link href="/" className="hover:text-navy">
              All properties
            </Link>
            <span aria-hidden> / </span>
            <Link href={`/properties/${property.id}`} className="hover:text-navy">
              {property.name}
            </Link>
          </nav>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-navy">
              Stays &amp; calendar
            </h1>
            <MembersOnlyLink
              href={`${base}/new`}
              className="rounded-xl bg-action px-4 py-2.5 text-sm font-semibold text-white hover:bg-action-hover"
            >
              Add entry
            </MembersOnlyLink>
          </div>
          <p className="mt-2 text-slate-700">
            Organise when this property has guests, is blocked, has work planned or
            is due a cleanup.
          </p>

          {current && (
            <section aria-labelledby="current-heading" className={`mt-6 ${card}`}>
              <h2 id="current-heading" className="text-xl font-semibold text-navy">
                Current stay
              </h2>
              <p className="mt-3 font-medium text-navy">
                {formatDisplayDate(current.start_date)} –{" "}
                {formatDisplayDate(current.end_date)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Guest stay · {stayNights(current)}{" "}
                {stayNights(current) === 1 ? "night" : "nights"}
              </p>
              {currentTurnover && (
                <p className="mt-1 text-sm text-slate-600">
                  {turnoverText(currentTurnover)}
                </p>
              )}
              {isZeroGap(currentTurnover) && <ZeroGapWarning />}
              <Link
                href={`${base}/${current.id}`}
                className="mt-4 inline-block rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-navy hover:bg-slate-50"
              >
                Open current stay
              </Link>
            </section>
          )}

          <section aria-labelledby="schedule-heading" className={`mt-6 ${card}`}>
            <h2 id="schedule-heading" className="text-xl font-semibold text-navy">
              Upcoming schedule
            </h2>
            {hasStays && <p className="mt-1 text-sm text-slate-600">{TURNOVER_NOTICE}</p>}
            {months.length === 0 ? (
              <p className="mt-4 text-slate-700">
                Nothing upcoming recorded for this property.
              </p>
            ) : (
              months.map((month) => (
                <div key={month.key} className="mt-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                    {month.label}
                  </h3>
                  <div className="mt-3">
                    <CalendarEntryList
                      propertyId={property.id}
                      entries={month.entries}
                      turnovers={turnovers}
                    />
                  </div>
                </div>
              ))
            )}
          </section>

          <p className="mt-8 text-sm">
            <Link
              href={`${base}/past`}
              className="text-slate-700 underline underline-offset-4 hover:text-navy"
            >
              Past &amp; cancelled entries
            </Link>
          </p>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
