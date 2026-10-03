"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ATTACHMENTS_BUCKET } from "@/lib/evidence-attachments";
import { errorCode } from "@/lib/log";
import { MAINTENANCE_PHOTOS_BUCKET } from "@/lib/maintenance-photos";
import { stripeIds } from "@/lib/membership-sync";
import { PROPERTY_IMAGES_BUCKET } from "@/lib/property-images";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AccountFormState = { error?: string; message?: string };

const notConfigured: AccountFormState = {
  error: "Accounts are not switched on yet. Please try again later.",
};

/**
 * Signed-in user plus a check of their current password. Used before any
 * change to sign-in details or deletion, so an unattended signed-in
 * browser can't be used to take over or delete the account.
 */
async function requireCurrentPassword(currentPassword: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.email) redirect("/sign-in");

  const { error } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: currentPassword,
  });
  return { supabase, user: userData.user, passwordOk: !error };
}

export async function changePassword(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const current = String(formData.get("current_password") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!current) return { error: "Please enter your current password." };
  if (password.length < 8) {
    return { error: "Please choose a new password of at least 8 characters." };
  }
  if (password !== confirm) return { error: "The two new passwords do not match." };

  const { supabase, passwordOk } = await requireCurrentPassword(current);
  if (!passwordOk) return { error: "Your current password is not correct." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("Change password failed:", error.code ?? error.status);
    switch (error.code) {
      case "weak_password":
        return {
          error:
            "That password is too weak. Please use at least 8 characters, including an uppercase letter, a lowercase letter, a number and a symbol.",
        };
      case "same_password":
        return { error: "Please choose a password you have not used for this account before." };
      default:
        return { error: "We could not change your password. Please try again." };
    }
  }

  return { message: "Your password has been changed." };
}

export async function changeEmail(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const email = String(formData.get("email") ?? "").trim();
  const current = String(formData.get("current_password") ?? "");
  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid new email address." };
  }
  if (!current) return { error: "Please enter your current password." };

  const { supabase, user, passwordOk } = await requireCurrentPassword(current);
  if (!passwordOk) return { error: "Your current password is not correct." };
  if (email.toLowerCase() === user.email?.toLowerCase()) {
    return { error: "That is already your email address." };
  }

  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host")}`;

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${origin}/auth/confirm?next=/account` },
  );
  if (error) {
    // Code only: the message could include an email address.
    console.error("Change email failed:", error.code ?? error.status);
    switch (error.code) {
      case "email_exists":
      case "email_address_invalid":
        return { error: "We could not use that email address. Please try a different one." };
      case "over_email_send_rate_limit":
        return { error: "Too many attempts. Please wait a few minutes and try again." };
      default:
        return { error: "We could not start the email change. Please try again." };
    }
  }

  return {
    message:
      "We have sent a confirmation link to your new email address. Your email only changes once you click it. You may also be sent a link at your current address; if so, click both.",
  };
}

/**
 * Permanently deletes the account: every uploaded file first (Storage can
 * only be cleared through its own API), then all database rows and the
 * login itself through the delete_my_account() database function.
 */
export async function deleteAccount(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  if (!isSupabaseConfigured) return notConfigured;

  const current = String(formData.get("current_password") ?? "");
  const typed = String(formData.get("confirm_text") ?? "").trim();
  if (typed !== "DELETE") {
    return { error: "Please type DELETE in capital letters to confirm." };
  }
  if (!current) return { error: "Please enter your current password." };

  const { supabase, passwordOk } = await requireCurrentPassword(current);
  if (!passwordOk) return { error: "Your current password is not correct." };

  // 0. Stop any Stripe subscription straight away, so nobody is ever
  //    charged after deleting their account.
  if (isStripeConfigured && isAdminConfigured) {
    const { data: userData } = await supabase.auth.getUser();
    const { subscription } = userData.user
      ? await stripeIds(userData.user.id)
      : { subscription: null };
    if (subscription) {
      try {
        const sub = await stripe().subscriptions.retrieve(subscription);
        if (sub.status !== "canceled" && sub.status !== "incomplete_expired") {
          await stripe().subscriptions.cancel(subscription);
        }
      } catch (error) {
        console.error("Account deletion subscription cancel failed:", errorCode(error));
        return {
          error:
            "We couldn’t cancel your membership payments, so your account has not been deleted. Please try again.",
        };
      }
    }
  }

  // 1. Files. RLS returns only this user's rows.
  const [attachments, photos, properties] = await Promise.all([
    supabase.from("evidence_attachments").select("storage_path"),
    supabase.from("maintenance_photos").select("storage_path"),
    supabase.from("properties").select("image_path"),
  ]);
  const buckets: [string, string[]][] = [
    [ATTACHMENTS_BUCKET, (attachments.data ?? []).map((r) => r.storage_path)],
    [MAINTENANCE_PHOTOS_BUCKET, (photos.data ?? []).map((r) => r.storage_path)],
    [
      PROPERTY_IMAGES_BUCKET,
      (properties.data ?? [])
        .map((r) => r.image_path as string | null)
        .filter((p): p is string => Boolean(p)),
    ],
  ];
  for (const [bucket, paths] of buckets) {
    if (paths.length === 0) continue;
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      console.error("Account deletion file cleanup failed:", bucket);
      return {
        error:
          "We could not delete your uploaded files, so your account has not been deleted. Please try again.",
      };
    }
  }

  // 2. Database rows and the login, in one transaction.
  const { error: rpcError } = await supabase.rpc("delete_my_account");
  if (rpcError) {
    console.error("Account deletion failed:", rpcError.code);
    return {
      error:
        "We could not finish deleting your account. Your uploaded files have been removed, but your account and records remain. Please try again.",
    };
  }

  // The login no longer exists; clear this browser's session cookies.
  await supabase.auth.signOut();
  redirect("/account-deleted");
}
