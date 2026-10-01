import type { ReactNode } from "react";
import MembershipBanner from "@/components/MembershipBanner";

/**
 * Signed-in page wrapper: the warm paper background used by the property
 * selector and property pages. Content inside still sits on white cards.
 * Replaces the page's <main>, so Header and Footer are unaffected.
 * Starts with the membership banner (trial countdown or read-only notice).
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 bg-paper">
      <MembershipBanner />
      {children}
    </main>
  );
}
