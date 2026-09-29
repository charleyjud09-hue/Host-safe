import Link from "next/link";
import type { ReactNode } from "react";

const tones = {
  teal: "bg-teal-50 ring-teal-200/80",
  paper: "bg-paper-deep ring-paper-line",
  white: "bg-white ring-slate-200",
} as const;

/** One HostSafe property service. Only rendered for services with a working route. */
export default function ServiceCard({
  title,
  description,
  href,
  actionLabel,
  icon,
  tone = "teal",
  className = "",
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  icon: ReactNode;
  tone?: keyof typeof tones;
  /** Extra layout classes, e.g. to span the full grid width. */
  className?: string;
}) {
  return (
    <div className={`flex flex-col rounded-2xl p-6 ring-1 sm:p-7 ${tones[tone]} ${className}`}>
      <div
        aria-hidden
        className="grid h-12 w-12 place-items-center rounded-xl bg-white text-action shadow-sm ring-1 ring-slate-200/70"
      >
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-semibold text-navy">{title}</h3>
      <p className="mt-2 flex-1 text-slate-700">{description}</p>
      <Link
        href={href}
        className="mt-6 block w-full rounded-xl bg-action px-5 py-3 text-center font-semibold text-white hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
