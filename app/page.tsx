import { Fraunces } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import Disclaimer from "@/components/Disclaimer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PropertySelector, { type SelectorProperty } from "@/components/PropertySelector";
import SavePendingResult from "@/components/SavePendingResult";
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
    title: "Property profiles",
    body: "Keep the basic details of each holiday let in one place, even if you manage more than one.",
    icon: (
      <svg {...iconProps}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M10 21v-6h4v6" />
      </svg>
    ),
  },
  {
    title: "Property checks",
    body: "Answer six short questions for each property to see whether HostSafe's simplified approach is designed for it.",
    icon: (
      <svg {...iconProps}>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4V3h6v1" />
        <path d="m9 13 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Evidence & private attachments",
    body: "Record checks and keep photos or PDF certificates alongside them, stored privately to your account.",
    icon: (
      <svg {...iconProps}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M12 17v-5" />
        <path d="m9.5 14.5 2.5 2.5 2.5-2.5" />
      </svg>
    ),
  },
  {
    title: "Actions & reminders",
    body: "Track things to keep, arrange or send, with in-app reminders based on the dates you set.",
    icon: (
      <svg {...iconProps}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
      </svg>
    ),
  },
];

const steps = [
  {
    title: "Add your property",
    body: "Create a profile with the basics: name, address, type and size.",
  },
  {
    title: "Check it and organise evidence",
    body: "Take the short property check, then add records and supporting files.",
  },
  {
    title: "Keep track of actions",
    body: "Add actions with due or review dates and see what needs attention.",
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
          {/* Saves a result from the public check, now that sign-in lands here. */}
          <SavePendingResult />
          <PropertySelector properties={selectorProperties} />
          {/* Moved unchanged from the retired /dashboard page. */}
          <div className="mx-auto max-w-5xl space-y-2 px-5 pb-12 text-sm text-slate-600">
            <p>
              HostSafe is an organisational and educational tool for
              properties in England. It does not provide legal advice,
              fire-risk assessments, or compliance certification, and it does
              not confirm that a property is safe or legally compliant.
              Keeping records here does not by itself demonstrate legal
              compliance.
            </p>
            <p>
              HostSafe&apos;s simplified guidance is intended for smaller,
              straightforward accommodation in England. Larger, more complex,
              shared, converted, or unusual properties may need different
              guidance or advice from a competent fire-risk assessor.
            </p>
            <p>
              HostSafe helps you organise property information, evidence,
              documents, actions, and reminders. It is not an official
              records repository. You remain responsible for keeping original
              documents and appropriate backups, checking applicable
              requirements and deadlines, and submitting information directly
              to the relevant organisation where required.
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
              Early access for self-catering hosts in England
            </p>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
              A clearer starting point for holiday-let fire-safety paperwork
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">
              HostSafe helps owners of small, simple holiday lets organise
              property details, keep fire-safety evidence together and keep
              track of actions, in plain English.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="/check"
                className="rounded-lg bg-teal-400 px-6 py-3 font-semibold text-navy shadow-sm hover:bg-teal-300"
              >
                Check if your property is suitable
              </Link>
              <a
                href="#limitations"
                className="text-slate-200 underline underline-offset-4 hover:text-white"
              >
                What HostSafe is not
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <p className={eyebrow}>Features</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-navy sm:text-4xl">
            What HostSafe does
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-slate-700">
            An organisational and educational tool that helps you keep track
            of the information you provide.
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
              Small, simple holiday lets in England
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-700">
              HostSafe is designed for owners of small, simple self-catering
              holiday lets in England, especially if you feel unsure where to
              start.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                "Two floors or fewer",
                "Up to 10 overnight guests",
                "A simple layout with a clear escape route",
              ].map((t) => (
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
            <p className="mt-6 max-w-2xl text-slate-700">
              Larger, more complex or unusual properties may need more tailored
              advice from a competent fire-risk assessor.
            </p>
          </div>
        </section>

        <Disclaimer />

        <section className="mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
          <h2 className="font-display text-3xl font-medium tracking-tight text-navy sm:text-4xl">
            See if HostSafe fits your property
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-700">
            It takes about a minute, and nothing you enter is saved or sent.
          </p>
          <Link
            href="/check"
            className="mt-8 inline-block rounded-lg bg-navy px-6 py-3 font-semibold text-white shadow-sm hover:bg-navy-light"
          >
            Check if your property is suitable
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
