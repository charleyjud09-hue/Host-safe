import Link from "next/link";

/** One HostSafe property service. Only rendered for services with a working route. */
export default function ServiceCard({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-1 flex-1 text-slate-700">{description}</p>
      <Link
        href={href}
        className="mt-5 self-start rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
