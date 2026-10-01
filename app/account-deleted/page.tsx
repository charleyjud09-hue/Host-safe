import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Account deleted | Letnook",
};

export default function AccountDeletedPage() {
  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-md px-5 py-12">
          <h1 className="text-3xl font-semibold text-navy">Your account has been deleted</h1>
          <p className="mt-3 text-slate-700">
            Your account, properties, records and uploaded files have been
            removed from Letnook.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-action px-5 py-2.5 font-medium text-white hover:bg-action-hover"
          >
            Go to the homepage
          </Link>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
