import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/**
 * Server-only database client with the Supabase secret key. It bypasses the
 * row-level security rules, so it is used ONLY for the one thing users must
 * never do themselves: writing their membership after Stripe confirms a
 * payment change. Never import this from browser code.
 */
const secretKey = process.env.SUPABASE_SECRET_KEY;

export const isAdminConfigured = Boolean(supabaseUrl && secretKey);

export function createAdminClient() {
  if (!supabaseUrl || !secretKey) throw new Error("Supabase secret key is not configured");
  return createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
