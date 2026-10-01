import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import HeaderNavLink from "@/components/HeaderNavLink";
import LogoMark from "@/components/LogoMark";
import { canEdit, membershipCta } from "@/lib/membership";
import { getMembership } from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function Header() {
  let signedIn = false;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  }
  const membership = signedIn ? await getMembership() : null;
  const cta = membership ? membershipCta(membership) : null;
  const subscribed = membership ? canEdit(membership) : false;
  const neverJoined = membership?.status === "none";

  // Signed-in pages use the warm paper theme. The signed-out header (and so
  // the public homepage) keeps its original look.
  if (signedIn) {
    return (
      <header className="border-b border-paper-line bg-paper-deep/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-4">
          <Link
            href="/"
            aria-label="Letnook home"
            className="flex items-center gap-2 text-lg font-semibold text-navy"
          >
            <LogoMark />
            {/* Just the mark on very narrow phones, so the menu keeps its margin. */}
            <span aria-hidden className="hidden min-[420px]:inline">
              Letnook
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-0.5 sm:gap-2" aria-label="Main">
            <HeaderNavLink href="/" match="properties">
              <span className="sm:hidden">Properties</span>
              <span className="hidden sm:inline">My properties</span>
            </HeaderNavLink>
            <HeaderNavLink href="/account" match="account">
              Account
            </HeaderNavLink>
            {cta &&
              (subscribed ? (
                // Subscribed: a quiet link, hidden on phones where Account covers it.
                <Link
                  href={cta.href}
                  className="hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-navy hover:bg-paper-line/60 sm:inline"
                >
                  {cta.label}
                </Link>
              ) : (
                <Link
                  href={cta.href}
                  className="ml-1 whitespace-nowrap rounded-lg bg-action px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-action-hover sm:px-3"
                >
                  {neverJoined ? (
                    <>
                      <span className="md:hidden">Free trial</span>
                      <span className="hidden md:inline">{cta.label}</span>
                    </>
                  ) : (
                    cta.label
                  )}
                </Link>
              ))}
            <form action={signOut}>
              <button
                type="submit"
                className="ml-1 whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-sm font-medium text-navy ring-1 ring-paper-line hover:bg-paper sm:px-3"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
    );
  }

  const linkClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-navy hover:bg-slate-100";

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-navy">
          <LogoMark />
          Letnook
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <Link href="/membership" className={linkClass}>
            Pricing
          </Link>
          {isSupabaseConfigured && (
            <Link href="/sign-in" className={linkClass}>
              Sign in
            </Link>
          )}
          <Link
            href="/sign-up"
            className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light"
          >
            Create an account
          </Link>
        </nav>
      </div>
    </header>
  );
}
