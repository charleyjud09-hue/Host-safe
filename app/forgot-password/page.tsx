import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Reset your password | Letnook",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-md px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">Reset your password</h1>
          <p className="mt-3 text-slate-700">
            Enter the email address you use for Letnook and we will send you a
            link to choose a new password.
          </p>
          {notice === "link-failed" && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-950 ring-1 ring-amber-200"
            >
              That reset link did not work. It may have expired or already been
              used, or been opened in a different browser from the one you
              requested it in. Please request a new link below.
            </p>
          )}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <ForgotPasswordForm />
          </div>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
