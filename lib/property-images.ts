import { sniffContentType } from "@/lib/evidence-attachments";

export const PROPERTY_IMAGES_BUCKET = "property-images";
export const MAX_PROPERTY_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export type PropertyImageType = "image/jpeg" | "image/png" | "image/webp";

export const PROPERTY_IMAGE_TYPES: PropertyImageType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const EXTENSION_BY_TYPE: Record<PropertyImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type PropertyImageValidation =
  | { ok: true; contentType: PropertyImageType }
  | { ok: false; error: string };

/**
 * Server-side gate: checks size and sniffs the real file bytes. The
 * browser's claimed type and the original filename are never trusted.
 */
export async function validatePropertyImage(
  file: File,
): Promise<PropertyImageValidation> {
  if (file.size <= 0) {
    return { ok: false, error: "That image file is empty." };
  }
  if (file.size > MAX_PROPERTY_IMAGE_BYTES) {
    return { ok: false, error: "Images can be up to 5MB." };
  }
  const sniffed = await sniffContentType(file);
  if (
    sniffed === "image/jpeg" ||
    sniffed === "image/png" ||
    sniffed === "image/webp"
  ) {
    return { ok: true, contentType: sniffed };
  }
  return { ok: false, error: "Please choose a JPG, PNG, or WebP image." };
}

/**
 * {user_id}/{property_id}/{generated_id}.{ext} — built only on the server
 * from the session user and a property already confirmed as theirs.
 */
export function buildPropertyImagePath(
  userId: string,
  propertyId: string,
  contentType: PropertyImageType,
): string {
  return `${userId}/${propertyId}/${crypto.randomUUID()}.${EXTENSION_BY_TYPE[contentType]}`;
}

/** Cache-busting image URL; only ever served by the owner-checked route. */
export function propertyImageUrl(propertyId: string, version: string | null) {
  return `/properties/${propertyId}/image${version ? `?v=${encodeURIComponent(version)}` : ""}`;
}
