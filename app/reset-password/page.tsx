import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NewPasswordForm from "@/components/NewPasswordForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Choose a new password | Letnook",
};

/** Reached from the password-reset email, which signs the user in first. */
export default async function ResetPasswordPage() {
  if (!isSupabaseConfigured) redirect("/sign-in");

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-md px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">Choose a new password</h1>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {userData.user ? (
              <NewPasswordForm />
            ) : (
              <div className="space-y-4">
                <p className="text-slate-700">
                  This page only works from the link in a password-reset
                  email, and that link has expired or has not been opened yet.
                </p>
                <Link
                  href="/forgot-password"
                  className="block w-full rounded-lg bg-action px-6 py-3 text-center font-semibold text-white hover:bg-action-hover"
                >
                  Request a new link
                </Link>
              </div>
            )}
          </div>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
