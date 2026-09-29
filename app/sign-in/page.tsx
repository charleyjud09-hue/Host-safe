import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Sign in | HostSafe",
};

export default async function SignInPage({
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
          <h1 className="text-3xl font-semibold text-navy">Sign in</h1>
          {notice === "confirm-failed" && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-950 ring-1 ring-amber-200"
            >
              We could not confirm that link. If you have already confirmed
              your email, please sign in below. Otherwise, try creating your
              account again.
            </p>
          )}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <AuthForm mode="sign-in" />
          </div>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
