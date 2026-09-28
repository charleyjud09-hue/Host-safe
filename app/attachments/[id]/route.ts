import { NextResponse } from "next/server";
import {
  ATTACHMENTS_BUCKET,
  safeContentDisposition,
  type EvidenceAttachment,
} from "@/lib/evidence-attachments";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Ownership-checked file stream. The client never sees a storage URL —
 * only ever this route, which re-checks (via RLS-scoped queries) that the
 * signed-in user owns the attachment before touching Storage, then serves
 * the bytes with a content type and filename taken only from what was
 * verified at upload time, never from anything the request supplies.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const { id } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // RLS scopes this to the signed-in user's own attachments; a row for
  // someone else's attachment simply doesn't come back, so this doubles
  // as the ownership check.
  const { data: attachment } = await supabase
    .from("evidence_attachments")
    .select("storage_path, original_file_name, content_type")
    .eq("id", id)
    .maybeSingle<
      Pick<EvidenceAttachment, "storage_path" | "original_file_name" | "content_type">
    >();

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: file, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .download(attachment.storage_path);

  if (error || !file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(file, {
    headers: {
      "Content-Type": attachment.content_type,
      "Content-Disposition": safeContentDisposition(attachment.original_file_name),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
