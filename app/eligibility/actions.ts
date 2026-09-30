"use server";

import { redirect } from "next/navigation";
import { mayNeedTailoredAdvice, type Answers } from "@/lib/eligibility";
import { errorCode } from "@/lib/log";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type SaveEligibilityState = { error?: string };

/**
 * Saves a completed check against one specific property the signed-in user
 * owns. Never guesses a property — the caller must already know which one.
 */
export async function saveEligibilityResult(
  propertyId: string,
  answers: Answers,
): Promise<SaveEligibilityState> {
  if (!isSupabaseConfigured) {
    return { error: "Accounts are not switched on yet. Please try again later." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .maybeSingle();
  if (!property) {
    return { error: "We could not find that property." };
  }

  const { error } = await supabase.from("eligibility_results").insert({
    property_id: propertyId,
    answers,
    may_need_tailored_advice: mayNeedTailoredAdvice(answers),
  });

  if (error) {
    console.error("Save eligibility result failed:", errorCode(error));
    return { error: "We could not save this result. Please try again." };
  }

  redirect(`/properties/${propertyId}`);
}
