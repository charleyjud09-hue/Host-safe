import type { ReactNode } from "react";

/**
 * Signed-in page wrapper: the warm paper background used by the property
 * selector and property pages. Content inside still sits on white cards.
 * Replaces the page's <main>, so Header and Footer are unaffected.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return <main className="flex-1 bg-paper">{children}</main>;
}
