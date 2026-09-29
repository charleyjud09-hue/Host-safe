import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createMaintenanceIssue } from "@/app/maintenance/actions";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MaintenanceIssueForm from "@/components/MaintenanceIssueForm";
import { ukToday } from "@/lib/attention";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Report an issue | HostSafe",
};

export default async function NewMaintenanceIssuePage({
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

  const listHref = `/properties/${property.id}/maintenance`;

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
            Report an issue
          </h1>
          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
            <MaintenanceIssueForm
              action={createMaintenanceIssue.bind(null, property.id)}
              propertyName={property.name}
              today={ukToday()}
              submitLabel="Save issue"
              cancelHref={listHref}
            />
          </div>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
