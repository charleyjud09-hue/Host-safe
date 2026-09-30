import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function Header() {
  let signedIn = false;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  }

  const linkClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-navy hover:bg-slate-100";

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-navy">
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-lg bg-navy text-sm text-white"
          >
            H
          </span>
          HostSafe
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          {signedIn ? (
            <>
              <Link href="/" className={linkClass}>
                My properties
              </Link>
              <form action={signOut}>
                <button type="submit" className={linkClass}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            isSupabaseConfigured && (
              <Link href="/sign-in" className={linkClass}>
                Sign in
              </Link>
            )
          )}
          <Link
            href="/check"
            className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light"
          >
            Check suitability
          </Link>
        </nav>
      </div>
    </header>
  );
}
