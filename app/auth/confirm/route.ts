import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Only these in-app pages may be continued to after an email link.
const allowedNext = new Set(["/reset-password", "/account"]);

// The links in the confirmation and password-reset emails land here.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  const next = nextParam && allowedNext.has(nextParam) ? nextParam : null;
  const isReset = next === "/reset-password" || type === "recovery";
  const isEmailChange = next === "/account" || type === "email_change";

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    let error: unknown = new Error("No confirmation details in link");

    if (code) {
      ({ error } = await supabase.auth.exchangeCodeForSession(code));
    } else if (tokenHash && type) {
      ({ error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      }));
    }

    if (!error) {
      const to = isReset
        ? "/reset-password"
        : isEmailChange
          ? "/account?notice=email-confirmed"
          : "/";
      return NextResponse.redirect(`${origin}${to}`);
    }
  }

  return NextResponse.redirect(
    isReset
      ? `${origin}/forgot-password?notice=link-failed`
      : isEmailChange
        ? `${origin}/account/email?notice=link-failed`
        : `${origin}/sign-in?notice=confirm-failed`,
  );
}
