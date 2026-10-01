import Link from "next/link";
import type { ReactNode } from "react";
import { canEdit, JOIN_BACK_CTA, joinHref, TRIAL_CTA } from "@/lib/membership";
import { getMembership } from "@/lib/membership-server";

/**
 * An "Add …" link that only works with a trial or active membership.
 * Without one it keeps its place and look but points to joining instead.
 */
export default async function MembersOnlyLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const membership = await getMembership();
  if (canEdit(membership)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link href={joinHref(membership)} className={className}>
      {membership.status === "none" ? TRIAL_CTA : JOIN_BACK_CTA}
    </Link>
  );
}
