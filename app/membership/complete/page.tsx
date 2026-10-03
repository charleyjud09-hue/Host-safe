import { redirect } from "next/navigation";
import { errorCode } from "@/lib/log";
import { syncSubscription, type SyncResult } from "@/lib/membership-sync";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Stripe's embedded checkout returns here. We check the checkout belongs to
 * the signed-in account, record the membership straight away (so it doesn't
 * depend on Stripe's notifications arriving), then show the billing page.
 */
export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  if (!isSupabaseConfigured || !isStripeConfigured) redirect("/account/billing");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");

  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect("/account/billing");

  let notice = "checkout-problem";
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id === data.user.id && session.status === "complete") {
      const subscription =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (subscription) {
        const result: SyncResult = await syncSubscription(data.user.id, subscription);
        notice =
          result === "not_uk"
            ? "not-uk"
            : result === "founding_full"
              ? "founding-full"
              : session.amount_total
                ? "rejoined" // paid today: a returning member, no trial
                : "trial-started";
      }
    } else if (session.status === "open") {
      notice = "checkout-unfinished";
    }
  } catch (error) {
    console.error("Checkout return failed:", errorCode(error));
  }
  redirect(`/account/billing?notice=${notice}`);
}
