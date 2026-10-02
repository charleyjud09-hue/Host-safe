import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import { getMembership } from "@/lib/membership-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Legal wording: keep identical in both versions (disclaimer audit row 3).
const disclaimer =
  "Letnook is an early-stage organisational tool. It doesn’t give legal, safety or compliance advice, and doesn’t check or approve any property. You remain responsible for your property and your legal obligations.";

export default async function Footer() {
  let signedIn = false;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  }

  // Signed-in pages use the warm paper theme; the signed-out footer (and so
  // the public homepage) keeps its original look.
  if (signedIn) {
    return (
      <footer className="border-t border-paper-line bg-paper-deep">
        <div className="mx-auto max-w-5xl px-5 py-8 text-sm text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-semibold text-navy">
              <LogoMark className="h-5 w-5" />
              Letnook
            </p>
            <nav aria-label="Footer" className="flex gap-4">
              <Link href="/" className="text-navy underline-offset-4 hover:underline">
                My properties
              </Link>
              <Link href="/account" className="text-navy underline-offset-4 hover:underline">
                Account settings
              </Link>
              <Link href="/membership" className="text-navy underline-offset-4 hover:underline">
                {/* Only accounts that haven't had a trial can still take one. */}
                {(await getMembership()).status === "none" ? "Free trial" : "Membership"}
              </Link>
            </nav>
          </div>
          <p className="mt-3 max-w-2xl">{disclaimer}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-5 py-8 text-sm text-slate-600">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-medium text-navy">
            <LogoMark className="h-5 w-5" />
            Letnook
          </p>
          <Link href="/membership" className="text-navy underline-offset-4 hover:underline">
            Free trial
          </Link>
        </div>
        <p className="mt-2 max-w-2xl">{disclaimer}</p>
      </div>
    </footer>
  );
}
