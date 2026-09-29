import { NextResponse } from "next/server";
import { PROPERTY_IMAGES_BUCKET, PROPERTY_IMAGE_TYPES } from "@/lib/property-images";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Ownership-checked property image stream. No public or signed URL is ever
 * exposed: RLS scopes the property lookup to the signed-in user, and the
 * content type comes only from what was verified at upload time.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSupabaseConfigured) return notFound();
  const { id } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return notFound();

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const path = property?.image_path as string | null | undefined;
  const contentType = property?.image_content_type as string | null | undefined;
  if (
    !path ||
    !contentType ||
    !PROPERTY_IMAGE_TYPES.includes(contentType as (typeof PROPERTY_IMAGE_TYPES)[number])
  ) {
    return notFound();
  }

  const { data: file, error } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .download(path);
  if (error || !file) return notFound();

  return new NextResponse(file, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
