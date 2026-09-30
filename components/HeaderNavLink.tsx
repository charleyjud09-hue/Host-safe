"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Signed-in header link that marks the section you're in: a teal underline
 * plus aria-current, so it isn't shown by colour alone.
 */
export default function HeaderNavLink({
  href,
  children,
  match,
}: {
  href: string;
  children: ReactNode;
  /** Whether a given path belongs to this link's section. */
  match: "properties" | "account";
}) {
  const pathname = usePathname() ?? "";
  const active =
    match === "account"
      ? pathname.startsWith("/account")
      : pathname === "/" || pathname.startsWith("/properties");

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-navy underline-offset-[6px] hover:bg-paper-line/60 sm:px-3 ${
        active ? "underline decoration-action decoration-2" : ""
      }`}
    >
      {children}
    </Link>
  );
}
