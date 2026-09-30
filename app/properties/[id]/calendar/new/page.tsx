import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createCalendarEntry, createGuestStay } from "@/app/calendar/actions";
import AppShell from "@/components/AppShell";
import CalendarEntryForm from "@/components/CalendarEntryForm";
import Footer from "@/components/Footer";
import GuestStayForm from "@/components/GuestStayForm";
import Header from "@/components/Header";
import {
  calendarEntryTypeLabel,
  calendarEntryTypes,
  isCalendarEntryType,
} from "@/lib/calendar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add calendar entry | HostSafe",
};

export default async function NewCalendarEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { id } = await params;
  const { type } = await searchParams;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  const listHref = `/properties/${property.id}/calendar`;
  const newHref = `${listHref}/new`;
  const entryType = isCalendarEntryType(type) ? type : null;

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

          {!entryType ? (
            <>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy">
                Add an entry
              </h1>
              <p className="mt-2 text-slate-700">What would you like to add?</p>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {calendarEntryTypes.map((t) => (
                  <li key={t.value}>
                    <Link
                      href={`${newHref}?type=${t.value}`}
                      className="block h-full rounded-2xl bg-white p-5 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                    >
                      <span className="block font-semibold text-navy">{t.label}</span>
                      <span className="mt-1 block text-sm text-slate-600">
                        {t.description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy">
                Add {calendarEntryTypeLabel(entryType).toLowerCase()}
              </h1>
              <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
                {entryType === "guest_stay" ? (
                  <GuestStayForm
                    action={createGuestStay.bind(null, property.id)}
                    propertyName={property.name}
                    submitLabel="Save stay"
                    cancelHref={newHref}
                  />
                ) : (
                  <CalendarEntryForm
                    action={createCalendarEntry.bind(null, property.id, entryType)}
                    entryType={entryType}
                    propertyName={property.name}
                    submitLabel="Save entry"
                    cancelHref={newHref}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
