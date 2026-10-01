import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MaintenanceIssueList from "@/components/MaintenanceIssueList";
import MembersOnlyLink from "@/components/MembersOnlyLink";
import { OPEN_MAINTENANCE_STATUSES, type MaintenanceIssue } from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Maintenance & repairs | Letnook",
};

export default async function MaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ show?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { id } = await params;
  const { show } = await searchParams;
  const showArchived = show === "archived";

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  const { data } = await supabase
    .from("maintenance_issues")
    .select("*")
    .eq("property_id", id)
    .order("reported_date", { ascending: false })
    .returns<MaintenanceIssue[]>();
  const issues = data ?? [];

  const open = issues.filter((i) => OPEN_MAINTENANCE_STATUSES.has(i.status));
  const resolved = issues.filter((i) => i.status === "resolved");
  const archived = issues.filter((i) => i.status === "archived");
  const base = `/properties/${property.id}/maintenance`;

  const card = "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card";
  const viewLink = (active: boolean) =>
    `rounded-xl px-3.5 py-2 font-medium ${
      active
        ? "bg-action text-white"
        : "bg-white text-navy ring-1 ring-slate-200 hover:bg-slate-50"
    }`;

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
              Maintenance &amp; repairs
            </h1>
            <MembersOnlyLink
              href={`${base}/new`}
              className="rounded-xl bg-action px-4 py-2.5 text-sm font-semibold text-white hover:bg-action-hover"
            >
              Report an issue
            </MembersOnlyLink>
          </div>
          <p className="mt-2 text-slate-700">
            Keep faults, damage and repair tasks organised for this property.
          </p>

          <nav aria-label="Issue view" className="mt-6 flex gap-2 text-sm">
            <Link
              href={base}
              aria-current={!showArchived ? "page" : undefined}
              className={viewLink(!showArchived)}
            >
              Open &amp; resolved
            </Link>
            <Link
              href={`${base}?show=archived`}
              aria-current={showArchived ? "page" : undefined}
              className={viewLink(showArchived)}
            >
              Archived ({archived.length})
            </Link>
          </nav>

          {showArchived ? (
            <section aria-labelledby="archived-heading" className={`mt-4 ${card}`}>
              <h2 id="archived-heading" className="sr-only">
                Archived issues
              </h2>
              <MaintenanceIssueList
                propertyId={property.id}
                issues={archived}
                emptyText="No archived issues for this property."
              />
            </section>
          ) : (
            <>
              <section aria-labelledby="open-heading" className={`mt-4 ${card}`}>
                <h2 id="open-heading" className="text-xl font-semibold text-navy">
                  Open issues
                </h2>
                <div className="mt-4">
                  <MaintenanceIssueList
                    propertyId={property.id}
                    issues={open}
                    emptyText="No open issues recorded for this property."
                  />
                </div>
              </section>

              <section aria-labelledby="resolved-heading" className={`mt-6 ${card}`}>
                <h2 id="resolved-heading" className="text-xl font-semibold text-navy">
                  Resolved issues
                </h2>
                <div className="mt-4">
                  <MaintenanceIssueList
                    propertyId={property.id}
                    issues={resolved}
                    emptyText="No resolved issues yet."
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
