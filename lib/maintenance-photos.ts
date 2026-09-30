import { sniffContentType } from "@/lib/evidence-attachments";

export const MAINTENANCE_PHOTOS_BUCKET = "maintenance-photos";
export const MAX_MAINTENANCE_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_PHOTOS_PER_ISSUE = 10;

export type MaintenancePhotoType = "image/jpeg" | "image/png" | "image/webp";

export const MAINTENANCE_PHOTO_TYPES: MaintenancePhotoType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const EXTENSION_BY_TYPE: Record<MaintenancePhotoType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAINTENANCE_PHOTO_NOTE =
  "Photos are stored privately and only shown to you. Please avoid photos that show people or personal information.";

export type MaintenancePhoto = {
  id: string;
  issue_id: string;
  storage_path: string;
  original_file_name: string;
  content_type: MaintenancePhotoType;
  size_bytes: number;
  created_at: string;
};

export type MaintenancePhotoValidation =
  | { ok: true; contentType: MaintenancePhotoType }
  | { ok: false; error: string };

/**
 * Server-side gate: checks size and sniffs the real file bytes. The
 * browser's claimed type and the original filename are never trusted.
 */
export async function validateMaintenancePhoto(
  file: File,
): Promise<MaintenancePhotoValidation> {
  if (file.size <= 0) {
    return { ok: false, error: `"${file.name}" is empty.` };
  }
  if (file.size > MAX_MAINTENANCE_PHOTO_BYTES) {
    return { ok: false, error: `"${file.name}" is larger than the 10MB limit.` };
  }
  const sniffed = await sniffContentType(file);
  if (
    sniffed === "image/jpeg" ||
    sniffed === "image/png" ||
    sniffed === "image/webp"
  ) {
    return { ok: true, contentType: sniffed };
  }
  return { ok: false, error: `"${file.name}" is not a JPG, PNG, or WebP photo.` };
}

/**
 * {user_id}/{property_id}/{issue_id}/{generated_id}.{ext} — built only on
 * the server, from the session user and an issue confirmed as theirs.
 */
export function buildMaintenancePhotoPath(
  userId: string,
  propertyId: string,
  issueId: string,
  contentType: MaintenancePhotoType,
): string {
  return `${userId}/${propertyId}/${issueId}/${crypto.randomUUID()}.${EXTENSION_BY_TYPE[contentType]}`;
}
