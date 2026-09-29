import Link from "next/link";
import { type AttentionLevel } from "@/lib/attention";

export type SelectorProperty = {
  id: string;
  name: string;
  counts: Record<AttentionLevel, number>;
};

const primaryButton =
  "inline-block rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-light";

function Summary({ counts }: { counts: Record<AttentionLevel, number> }) {
  const parts = [
    counts.urgent > 0 && { text: `${counts.urgent} urgent`, className: "bg-red-700 text-white" },
    counts.due_soon > 0 && {
      text: `${counts.due_soon} due soon`,
      className: "bg-amber-200 text-amber-950",
    },
    counts.upcoming > 0 && {
      text: `${counts.upcoming} upcoming`,
      className: "bg-slate-100 text-navy ring-1 ring-slate-200",
    },
  ].filter((p): p is { text: string; className: string } => Boolean(p));

  if (parts.length === 0) {
    return (
      <p className="text-sm text-slate-600">Nothing needs attention right now</p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Needs your attention">
      {parts.map((p) => (
        <li
          key={p.text}
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.className}`}
        >
          {p.text}
        </li>
      ))}
    </ul>
  );
}

export default function PropertySelector({
  properties,
}: {
  properties: SelectorProperty[];
}) {
  if (properties.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-navy">
            Add your first property to get started
          </h1>
          <Link href="/properties/new" className={`mt-6 ${primaryButton}`}>
            Add property
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-navy">
          Your properties
        </h1>
        <Link href="/properties/new" className={primaryButton}>
          Add property
        </Link>
      </div>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {properties.map((p) => (
          <li
            key={p.id}
            className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-navy">{p.name}</h2>
            <div className="mt-3 flex-1">
              <Summary counts={p.counts} />
            </div>
            <Link
              href={`/properties/${p.id}`}
              className="mt-5 self-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50"
            >
              Open property
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
