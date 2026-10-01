import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/auth/actions";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { PLANS, type Membership } from "@/lib/membership";
import { getMembership } from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account settings | Letnook",
};

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0 text-slate-400"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function membershipSummary(m: Membership): string {
  if (m.status === "none") return "No membership yet";
  if (m.status === "ended") return "Membership ended (read-only)";
  const name = m.plan ? PLANS[m.plan].name : "";
  if (m.cancelAtPeriodEnd) return `${name}, cancelled`;
  return m.status === "trialing" ? `${name}, free trial` : name;
}

function SettingLink({
  href,
  title,
  description,
  detail,
  danger = false,
}: {
  href: string;
  title: string;
  description: string;
  detail?: ReactNode;
  danger?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center justify-between gap-4 rounded-2xl bg-white p-5 ring-1 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action sm:p-6 ${
          danger ? "ring-red-200" : "ring-slate-200"
        }`}
      >
        <div className="min-w-0">
          <p className={`font-semibold ${danger ? "text-red-800" : "text-navy"}`}>{title}</p>
          {detail && <p className="mt-1 break-words font-medium text-slate-800">{detail}</p>}
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <Chevron />
      </Link>
    </li>
  );
}

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { notice } = await searchParams;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { count } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true });
  const propertyCount = count ?? 0;
  const membership = await getMembership();

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-xl px-5 py-10 sm:py-12">
          <h1 className="text-3xl font-semibold tracking-tight text-navy">
            Account settings
          </h1>
          <p className="mt-2 text-slate-700">
            Manage how you sign in to Letnook and your account.
          </p>

          {notice === "email-confirmed" && (
            <p
              role="status"
              className="mt-6 rounded-lg bg-teal-50 p-3 text-slate-800 ring-1 ring-teal-200"
            >
              Confirmation received. If you were also sent a link at your
              other email address, click that one too. The email shown below
              is the one your account currently uses.
            </p>
          )}

          <ul className="mt-8 space-y-3">
            <SettingLink
              href="/account/email"
              title="Email address"
              detail={userData.user.email}
              description="The address you sign in with. Change it here; the change only happens once you confirm it by email."
            />
            <SettingLink
              href="/account/password"
              title="Password"
              description="Change the password you use to sign in. You will need your current password."
            />
            <SettingLink
              href="/"
              title="Your properties"
              detail={`${propertyCount} ${propertyCount === 1 ? "property" : "properties"}`}
              description="See and manage the properties on your account."
            />
            <SettingLink
              href="/account/billing"
              title="Subscription & billing"
              detail={membershipSummary(membership)}
              description="Your plan, payments and cancelling."
            />
            <li>
              <form
                action={signOut}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-navy">Sign out</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Sign out of Letnook on this device.
                  </p>
                </div>
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50"
                >
                  Sign out
                </button>
              </form>
            </li>
          </ul>

          <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Danger zone
          </h2>
          <ul className="mt-3">
            <SettingLink
              href="/account/delete"
              title="Delete your account"
              description="Permanently delete your account, every property and everything you have recorded or uploaded. This can’t be undone."
              danger
            />
          </ul>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
