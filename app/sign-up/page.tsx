import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Create a free account | Letnook",
};

export default function SignUpPage() {
  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-md px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">
            Create a free account
          </h1>
          <p className="mt-3 mb-8 text-slate-700">
            Save your progress and come back to it later. We will email you a
            link to confirm your address.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <AuthForm mode="sign-up" />
          </div>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
