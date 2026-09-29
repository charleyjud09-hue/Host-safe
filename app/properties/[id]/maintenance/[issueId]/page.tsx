import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  archiveMaintenanceIssue,
  deleteMaintenanceIssue,
  resolveMaintenanceIssue,
  updateMaintenanceIssue,
} from "@/app/maintenance/actions";
import AppShell from "@/components/AppShell";
import ConfirmDeleteIssue from "@/components/ConfirmDeleteIssue";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MaintenanceIssueForm from "@/components/MaintenanceIssueForm";
import { formatDisplayDate, ukToday } from "@/lib/attention";
import {
  maintenanceStatusLabel,
  OPEN_MAINTENANCE_STATUSES,
  RESOLVED_NOTICE,
  type MaintenanceIssue,
} from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Maintenance issue | HostSafe",
};

export default async function MaintenanceIssuePage({
  params,
}: {
  params: Promise<{ id: string; issueId: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { id, issueId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  // RLS scopes this to the user's own issues; the property filter makes
  // sure an issue ID can't be viewed under a different property's URL.
  const { data: issue } = await supabase
    .from("maintenance_issues")
    .select("*")
    .eq("id", issueId)
    .eq("property_id", id)
    .maybeSingle<MaintenanceIssue>();
  if (!issue) notFound();

  const listHref = `/properties/${property.id}/maintenance`;
  const isOpen = OPEN_MAINTENANCE_STATUSES.has(issue.status);

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
              Maintenance &amp; repairs
            </Link>
          </nav>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy">
            {issue.title}
          </h1>
          <p className="mt-2 text-slate-700">
            {maintenanceStatusLabel(issue.status)}
            {issue.status === "resolved" && issue.resolved_date &&
              ` on ${formatDisplayDate(issue.resolved_date)}`}
          </p>
          {issue.status === "resolved" && (
            <p className="mt-2 text-sm text-slate-600">{RESOLVED_NOTICE}</p>
          )}

          {(isOpen || issue.status === "resolved") && (
            <div className="mt-6 flex flex-wrap gap-3">
              {isOpen && (
                <form action={resolveMaintenanceIssue.bind(null, property.id, issue.id)}>
                  <button
                    type="submit"
                    className="rounded-lg bg-action px-5 py-2.5 font-medium text-white hover:bg-action-hover"
                  >
                    Mark resolved today
                  </button>
                </form>
              )}
              <form action={archiveMaintenanceIssue.bind(null, property.id, issue.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-navy hover:bg-slate-50"
                >
                  Archive issue
                </button>
              </form>
            </div>
          )}

          <section
            aria-labelledby="edit-heading"
            className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8"
          >
            <h2 id="edit-heading" className="text-xl font-semibold text-navy">
              Issue details
            </h2>
            <div className="mt-5">
              <MaintenanceIssueForm
                action={updateMaintenanceIssue.bind(null, property.id, issue.id)}
                issue={issue}
                propertyName={property.name}
                today={ukToday()}
                submitLabel="Save changes"
                cancelHref={listHref}
              />
            </div>
          </section>

          <div className="mt-8">
            <ConfirmDeleteIssue
              action={deleteMaintenanceIssue.bind(null, property.id, issue.id)}
              issueTitle={issue.title}
            />
          </div>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
