import Link from "next/link";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

/** Shared frame for the individual account pages. */
export default function AccountPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <Header />
      <AppShell>
        <div className="mx-auto max-w-xl px-5 py-10 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
            <Link href="/account" className="hover:text-navy">
              Account settings
            </Link>
          </nav>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy">{title}</h1>
          {intro && <div className="mt-3 text-slate-700">{intro}</div>}
          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
            {children}
          </div>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}
