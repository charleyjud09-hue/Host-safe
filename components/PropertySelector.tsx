import Image from "next/image";
import Link from "next/link";
import MembersOnlyLink from "@/components/MembersOnlyLink";
import PropertyImagePlaceholder from "@/components/PropertyImagePlaceholder";
import { attentionLevelStyle, type AttentionLevel } from "@/lib/attention";

export type SelectorProperty = {
  id: string;
  name: string;
  address: string;
  /** Owner-checked image route, or null to show the placeholder. */
  imageUrl: string | null;
  counts: Record<AttentionLevel, number>;
};

const buttonBase =
  "inline-flex items-center justify-center rounded-xl bg-action font-semibold text-white hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";
const primaryButton = `${buttonBase} px-5 py-2.5 text-sm`;
const openButton = `${buttonBase} w-full px-5 py-3 text-base`;

function PencilIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
    >
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
      <path d="m14.5 5.5 3 3" />
    </svg>
  );
}

function Summary({ counts }: { counts: Record<AttentionLevel, number> }) {
  const parts = [
    counts.urgent > 0 && {
      text: `${counts.urgent} date passed`,
      className: attentionLevelStyle.urgent.badge,
    },
    counts.very_soon > 0 && {
      text: `${counts.very_soon} due very soon`,
      className: attentionLevelStyle.very_soon.badge,
    },
    counts.due_soon > 0 && {
      text: `${counts.due_soon} due soon`,
      className: attentionLevelStyle.due_soon.badge,
    },
    counts.open > 0 && {
      text: `${counts.open} open issue${counts.open === 1 ? "" : "s"}`,
      className: attentionLevelStyle.open.badge,
    },
    counts.later > 0 && {
      text: `${counts.later} later`,
      className: attentionLevelStyle.later.badge,
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
  limit,
}: {
  properties: SelectorProperty[];
  /** The plan's property limit, or 0 without an active membership. */
  limit: number;
}) {
  if (properties.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-center shadow-card">
          <PropertyImagePlaceholder className="h-32" />
          <div className="p-8">
            <h1 className="text-2xl font-semibold text-navy">
              Add your first property to get started
            </h1>
            <MembersOnlyLink href="/properties/new" className={`mt-6 ${primaryButton}`}>
              Add property
            </MembersOnlyLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Your properties
          </h1>
          <p className="mt-2 text-slate-700">
            Choose a property to see what needs attention and open its
            services.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <MembersOnlyLink href="/properties/new" className={primaryButton}>
            Add property
          </MembersOnlyLink>
          {limit > 0 && (
            <p className="text-sm text-slate-600">
              {properties.length} of {limit} properties used
            </p>
          )}
        </div>
      </div>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {properties.map((p) => (
          <li
            key={p.id}
            className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card"
          >
            {p.imageUrl ? (
              <div className="relative h-32 bg-paper-deep sm:h-36">
                <Image
                  src={p.imageUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="(min-width: 640px) 480px, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <PropertyImagePlaceholder className="h-32 sm:h-36" />
            )}
            <Link
              href={`/properties/${p.id}/edit?returnTo=/`}
              aria-label={`Edit property: ${p.name}`}
              title="Edit property"
              className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-navy shadow-sm ring-1 ring-slate-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
            >
              <PencilIcon />
            </Link>
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-navy">{p.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.address}</p>
              <div className="mt-4 flex-1">
                <Summary counts={p.counts} />
              </div>
              <Link
                href={`/properties/${p.id}`}
                className={`mt-5 ${openButton}`}
              >
                Open property
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
