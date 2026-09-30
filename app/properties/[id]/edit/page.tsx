import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PropertyForm from "@/components/PropertyForm";
import PropertyImageForm from "@/components/PropertyImageForm";
import { updateProperty } from "@/app/properties/actions";
import { removePropertyImage, uploadPropertyImage } from "@/app/properties/images/actions";
import { propertyImageUrl } from "@/lib/property-images";
import { safePropertyReturnTo, type Property } from "@/lib/properties";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit property | HostSafe",
};

export default async function EditPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/sign-in");
  const { id } = await params;
  const { returnTo } = await searchParams;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle<Property>();

  if (!property) notFound();

  const action = updateProperty.bind(null, property.id);
  // Only "/" or this property's overview; anything else falls back to the overview.
  const safeReturnTo = safePropertyReturnTo(returnTo, property.id);

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-2xl px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">Edit property</h1>
          <p className="mt-3 mb-8 text-slate-700">
            Update the details for {property.name}.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <PropertyForm
              action={action}
              property={property}
              submitLabel="Save changes"
              returnTo={safeReturnTo ?? undefined}
              cancelHref={safeReturnTo ?? `/properties/${property.id}`}
            />
          </div>

          <section
            aria-labelledby="image-heading"
            className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 id="image-heading" className="text-xl font-semibold text-navy">
              Property image
            </h2>
            <p className="mt-1 mb-5 text-sm text-slate-600">
              Optional. Shown on your property card and overview.
            </p>
            <PropertyImageForm
              imageUrl={
                property.image_path
                  ? propertyImageUrl(property.id, property.image_updated_at ?? null)
                  : null
              }
              uploadAction={uploadPropertyImage.bind(null, property.id, safeReturnTo)}
              removeAction={removePropertyImage.bind(null, property.id, safeReturnTo)}
            />
          </section>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
