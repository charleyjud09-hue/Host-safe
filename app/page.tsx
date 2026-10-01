import { Fraunces } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import Disclaimer from "@/components/Disclaimer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PropertySelector, { type SelectorProperty } from "@/components/PropertySelector";
import {
  buildAttention,
  countByLevel,
  ukToday,
  type AttentionEvidenceInput,
  type AttentionItemInput,
  type AttentionMaintenanceInput,
} from "@/lib/attention";
import { propertyImageUrl } from "@/lib/property-images";
import type { Property } from "@/lib/properties";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Headings font for the signed-out public homepage only. Its CSS variable is
// set on that branch's <main>, so nothing else in the app picks it up.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const features: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Maintenance & repairs",
    body: "Record issues and repair photos for each property, and keep track of what’s open.",
    icon: (
      <svg {...iconProps}>
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.4 2.4-2.1-.4-.4-2.1z" />
      </svg>
    ),
  },
  {
    title: "Actions & reminders",
    body: "Track what needs doing, with reminders based on the dates you set.",
    icon: (
      <svg {...iconProps}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
      </svg>
    ),
  },
  {
    title: "Stays & calendar",
    body: "Organise guest arrivals and departures, see turnovers and same-day turnovers, and schedule planned work, cleanups and blocks.",
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M4 10h16" />
      </svg>
    ),
  },
  {
    title: "Documents & renewals",
    body: "Keep certificates and documents together, with review dates you choose.",
    icon: (
      <svg {...iconProps}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    ),
  },
];

const bestFit = [
  "Holiday lets and short-term rentals",
  "Airbnb, Booking.com, Vrbo or direct-booking properties",
  "Cottages, flats, apartments, houses, annexes, lodges and cabins",
  "Your own occasional-use or owner-occupied rental",
  "A small portfolio of privately managed properties",
];

const steps = [
  {
    title: "Add your properties",
    body: "Create a private profile for each property you look after.",
  },
  {
    title: "Record what matters",
    body: "Log maintenance issues, documents and the actions you need to remember.",
  },
  {
    title: "Plan stays and work",
    body: "Keep guest dates, turnovers, planned work and cleanups in one schedule.",
  },
];

const eyebrow =
  "text-xs font-semibold uppercase tracking-[0.18em] text-teal-700";

export default async function Home() {
  let signedIn = false;
  let selectorProperties: SelectorProperty[] = [];

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      signedIn = true;
      // Read-only; RLS scopes every query to the signed-in user's own rows.
      const [propertiesRes, itemsRes, evidenceRes, maintenanceRes] = await Promise.all([
        // "*" (not named image columns) so this keeps working whether or
        // not the optional image columns have been added yet.
        supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: true })
          .returns<Property[]>(),
        supabase
          .from("property_items")
          .select("id, property_id, title, item_type, service, status, due_date, review_date"),
        supabase
          .from("evidence_records")
          .select("id, property_id, title, status, review_date")
          .neq("status", "archived")
          .not("review_date", "is", null),
        // Before the maintenance_issues table exists this simply returns
        // no rows, so the selector keeps working.
        supabase
          .from("maintenance_issues")
          .select("id, property_id, title, status, due_date")
          .in("status", ["open", "in_progress", "waiting"]),
      ]);
      const items = (itemsRes.data ?? []) as AttentionItemInput[];
      const evidence = (evidenceRes.data ?? []) as AttentionEvidenceInput[];
      const maintenance = (maintenanceRes.data ?? []) as AttentionMaintenanceInput[];
      const today = ukToday();

      selectorProperties = (propertiesRes.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        imageUrl: p.image_path
          ? propertyImageUrl(p.id, p.image_updated_at ?? null)
          : null,
        counts: countByLevel(
          buildAttention(
            items.filter((i) => i.property_id === p.id),
            evidence.filter((e) => e.property_id === p.id),
            today,
            maintenance.filter((m) => m.property_id === p.id),
          ),
        ),
      }));
    }
  }

  if (signedIn) {
    return (
      <>
        <Header />
        <AppShell>
          <PropertySelector properties={selectorProperties} />
          <div className="mx-auto max-w-5xl space-y-2 px-5 pb-12 text-sm text-slate-600">
            <p>
              Letnook is an organisational tool. It doesn&apos;t give legal,
              safety or compliance advice, and doesn&apos;t check or approve
              any property. Keeping records here doesn&apos;t by itself show
              that any requirement is met.
            </p>
            <p>
              It isn&apos;t an official records store. Keep your original
              documents and backups, and check the requirements and deadlines
              that apply to you.
            </p>
          </div>
        </AppShell>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={`${fraunces.variable} flex-1`}>
        <section className="relative isolate overflow-hidden bg-navy text-white">
          <div aria-hidden className="hero-glow absolute inset-0 -z-10" />
          <div aria-hidden className="hero-dots absolute inset-0 -z-10" />
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <p className="inline-block rounded-full bg-white/10 px-3 py-1 text-sm text-teal-100 ring-1 ring-white/15">
              Early access for holiday-let and short-term rental hosts
            </p>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
              The private organiser for holiday lets and short-term rentals
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">
              Keep maintenance, reminders, documents and guest dates for every
              property you look after in one private place.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="/sign-up"
                className="rounded-lg bg-teal-400 px-6 py-3 font-semibold text-navy shadow-sm hover:bg-teal-300"
              >
                Create an account
              </Link>
              <a
                href="#limitations"
                className="text-slate-200 underline underline-offset-4 hover:text-white"
              >
                What Letnook doesn&apos;t do
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <p className={eyebrow}>Features</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-navy sm:text-4xl">
            What it helps with
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-slate-700">
            Everything is private to your account. Other Letnook users
            can&apos;t see your properties, records or schedule.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,42,71,0.04),0_8px_24px_-12px_rgba(15,42,71,0.12)]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                  {f.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-navy">
                  {f.title}
                </h3>
                <p className="mt-2 leading-relaxed text-slate-700">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-paper">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <p className={eyebrow}>How it works</p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-navy sm:text-4xl">
              Three simple steps
            </h2>
            <ol className="mt-10 grid gap-5 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li
                  key={s.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6"
                >
                  <span
                    aria-hidden
                    className="grid h-9 w-9 place-items-center rounded-full bg-navy font-display text-base font-medium text-white"
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-navy">
                    {s.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-slate-700">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <p className={eyebrow}>Who it is for</p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-navy sm:text-4xl">
              Built for hosts who manage their own properties
            </h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bestFit.map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-paper p-5 font-medium text-navy"
                >
                  <svg
                    {...iconProps}
                    width={20}
                    height={20}
                    className="mt-0.5 shrink-0 text-teal-600"
                  >
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-2xl text-sm text-slate-600">
              Letnook isn&apos;t affiliated with Airbnb, Booking.com or Vrbo,
              and doesn&apos;t connect to them. You enter your own dates and
              details.
            </p>
          </div>
        </section>

        <Disclaimer />

        <section className="mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
          <h2 className="font-display text-3xl font-medium tracking-tight text-navy sm:text-4xl">
            Get your properties organised
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-700">
            Create an account and add your first property in a couple of
            minutes.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block rounded-lg bg-navy px-6 py-3 font-semibold text-white shadow-sm hover:bg-navy-light"
          >
            Create an account
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
