"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string };

const notConfigured: FormState = {
  error: "Accounts are not switched on yet. Please try again later.",
};

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const { email, password } = readCredentials(formData);
  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Please choose a password of at least 8 characters." };
  }

  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    console.error("Sign-up failed:", error.code ?? error.status, error.message);

    switch (error.code) {
      case "weak_password":
        return {
          error:
            "That password is too weak. Please use at least 8 characters, including an uppercase letter, a lowercase letter, a number and a symbol.",
        };
      case "email_address_invalid":
        return { error: "Please enter a valid email address." };
      case "user_already_exists":
      case "email_exists":
        return {
          error:
            "An account with that email may already exist. Try signing in, or use \"Forgot password\" if you need to reset it.",
        };
      case "email_provider_disabled":
      case "signup_disabled":
        return {
          error:
            "Account creation is temporarily unavailable. Please try again later.",
        };
      case "over_email_send_rate_limit":
        return {
          error: "Too many attempts. Please wait a few minutes and try again.",
        };
      default:
        return { error: "We could not create your account. Please try again." };
    }
  }

  // Same message whether or not the email is already registered.
  return {
    message:
      "Check your email. We have sent a link to confirm your address. You can sign in once you have confirmed it.",
  };
}

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Please confirm your email first. Check your inbox for the confirmation link.",
      };
    }
    return { error: "Your email or password did not match. Please try again." };
  }

  redirect("/");
}

/**
 * Sends Supabase's password-reset email. The reply is the same whether or
 * not an account exists, so this can't be used to discover who has one.
 */
export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  if (error?.code === "over_email_send_rate_limit") {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }
  // Code only: the message could include the email address.
  if (error) console.error("Password reset request failed:", error.code ?? error.status);

  return {
    message:
      "If an account exists for that email, we have sent a link to reset your password. The link works once and expires after a short time.",
  };
}

/** Sets a new password for the user signed in by the reset link. */
export async function updatePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  if (password.length < 8) {
    return { error: "Please choose a password of at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "The two passwords do not match." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return {
      error: "Your reset link has expired. Please request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("Password update failed:", error.code ?? error.status);
    switch (error.code) {
      case "weak_password":
        return {
          error:
            "That password is too weak. Please use at least 8 characters, including an uppercase letter, a lowercase letter, a number and a symbol.",
        };
      case "same_password":
        return { error: "Please choose a password you have not used for this account before." };
      default:
        return { error: "We could not update your password. Please try again." };
    }
  }

  return { message: "Your password has been updated." };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
