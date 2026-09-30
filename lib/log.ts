/**
 * A short, safe identifier for a Supabase (database, auth or Storage) error,
 * for server logs. Never the error message or details: those can contain
 * row values, file paths or email addresses.
 */
export function errorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "unknown";
  const e = error as { code?: unknown; statusCode?: unknown; status?: unknown; name?: unknown };
  return String(e.code ?? e.statusCode ?? e.status ?? e.name ?? "unknown");
}
