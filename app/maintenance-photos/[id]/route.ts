import { NextResponse } from "next/server";
import {
  MAINTENANCE_PHOTOS_BUCKET,
  MAINTENANCE_PHOTO_TYPES,
  type MaintenancePhoto,
} from "@/lib/maintenance-photos";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Ownership-checked photo stream. No public or signed URL is ever exposed:
 * RLS scopes the lookup to the signed-in user's own photos, and the content
 * type comes only from what was verified at upload time.
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

  const { data: photo } = await supabase
    .from("maintenance_photos")
    .select("storage_path, content_type")
    .eq("id", id)
    .maybeSingle<Pick<MaintenancePhoto, "storage_path" | "content_type">>();

  if (!photo || !MAINTENANCE_PHOTO_TYPES.includes(photo.content_type)) {
    return notFound();
  }

  const { data: file, error } = await supabase.storage
    .from(MAINTENANCE_PHOTOS_BUCKET)
    .download(photo.storage_path);
  if (error || !file) return notFound();

  return new NextResponse(file, {
    headers: {
      "Content-Type": photo.content_type,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
