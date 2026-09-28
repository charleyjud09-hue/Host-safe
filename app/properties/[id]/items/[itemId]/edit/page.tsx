import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  archivePropertyItem,
  deletePropertyItem,
  reopenPropertyItem,
  updatePropertyItem,
} from "@/app/property-items/actions";
import PropertyItemForm from "@/components/PropertyItemForm";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { PropertyItem } from "@/lib/property-items";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit item | HostSafe",
};

export default async function EditPropertyItemPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { id, itemId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  const { data: item } = await supabase
    .from("property_items")
    .select("*")
    .eq("id", itemId)
    .eq("property_id", id)
    .maybeSingle<PropertyItem>();
  if (!item) notFound();

  const updateAction = updatePropertyItem.bind(null, property.id, item.id);
  const reopenAction = reopenPropertyItem.bind(null, property.id, item.id);
  const archiveAction = archivePropertyItem.bind(null, property.id, item.id);
  const deleteAction = deletePropertyItem.bind(null, property.id, item.id);
  const canReopen = item.status !== "not_started" && item.status !== "in_progress";

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-5 py-12">
          <p className="text-sm text-slate-600">{property.name}</p>
          <h1 className="text-3xl font-semibold text-navy">Edit item</h1>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <PropertyItemForm
              action={updateAction}
              item={item}
              submitLabel="Save changes"
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {canReopen && (
              <form action={reopenAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-navy hover:bg-slate-50"
                >
                  Reopen (set to Not started)
                </button>
              </form>
            )}
            {item.status !== "archived" && (
              <form action={archiveAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-navy hover:bg-slate-50"
                >
                  Archive item
                </button>
              </form>
            )}
            <form action={deleteAction}>
              <button
                type="submit"
                className="rounded-lg border border-red-200 px-5 py-2.5 font-medium text-red-700 hover:bg-red-50"
              >
                Delete item
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
