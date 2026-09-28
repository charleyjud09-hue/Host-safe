export const ATTACHMENTS_BUCKET = "evidence-attachments";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB product limit
export const MAX_ATTACHMENTS_PER_RECORD = 10;

export type AllowedContentType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf";

export const ALLOWED_CONTENT_TYPES: AllowedContentType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const EXTENSION_BY_TYPE: Record<AllowedContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export type EvidenceAttachment = {
  id: string;
  storage_path: string;
  original_file_name: string;
  content_type: AllowedContentType;
  size_bytes: number;
  created_at: string;
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Confirms the first few bytes of a file actually match the claimed type,
 * so a renamed/mislabelled file can't slip past a MIME-string-only check.
 * Never trust a client-supplied content type at face value.
 */
export async function sniffContentType(
  file: Blob,
): Promise<AllowedContentType | null> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  const matches = (bytes: number[], offset = 0) =>
    bytes.every((b, i) => head[offset + i] === b);

  if (matches([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (matches([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (
    matches([0x52, 0x49, 0x46, 0x46], 0) && // "RIFF"
    matches([0x57, 0x45, 0x42, 0x50], 8) // "WEBP"
  ) {
    return "image/webp";
  }
  if (matches([0x25, 0x50, 0x44, 0x46])) return "application/pdf"; // "%PDF"

  return null;
}

export type FileValidationResult =
  | { ok: true; contentType: AllowedContentType }
  | { ok: false; error: string };

/** Server-side gate: re-checks size and sniffs real content, ignoring the browser's claims. */
export async function validateAttachmentFile(
  file: File,
): Promise<FileValidationResult> {
  if (file.size <= 0) {
    return { ok: false, error: `"${file.name}" is empty.` };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return {
      ok: false,
      error: `"${file.name}" is larger than the 10MB limit per file.`,
    };
  }

  const sniffed = await sniffContentType(file);
  if (!sniffed) {
    return {
      ok: false,
      error: `"${file.name}" is not a JPG, PNG, WebP, or PDF file.`,
    };
  }

  return { ok: true, contentType: sniffed };
}

/**
 * {user_id}/{property_id}/{evidence_record_id}/{generated_id}.{ext}
 * The generated id — never the original filename — is what's stored on
 * disk, so nothing client-controlled ever reaches the storage path.
 */
export function buildStoragePath(
  userId: string,
  propertyId: string,
  evidenceRecordId: string,
  contentType: AllowedContentType,
): string {
  const generatedId = crypto.randomUUID();
  const ext = EXTENSION_BY_TYPE[contentType];
  return `${userId}/${propertyId}/${evidenceRecordId}/${generatedId}.${ext}`;
}

/** RFC 5987-style encoding so non-ASCII filenames survive Content-Disposition safely. */
export function safeContentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  const encoded = encodeURIComponent(filename);
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
