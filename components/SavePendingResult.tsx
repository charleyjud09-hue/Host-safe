"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { mayNeedTailoredAdvice } from "@/lib/eligibility";
import { clearPendingResult, readPendingResult } from "@/lib/pending-result";
import { createClient } from "@/lib/supabase/client";

/**
 * If the visitor completed the check before creating an account, save that
 * result to their own account once, then remove it from this browser.
 */
export default function SavePendingResult() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const answers = readPendingResult();
    if (!answers) return;

    // Cleared first so a repeat visit can never save it twice.
    clearPendingResult();

    createClient()
      .from("eligibility_results")
      .insert({
        answers,
        may_need_tailored_advice: mayNeedTailoredAdvice(answers),
      })
      .then(({ error }) => {
        if (!error) router.refresh();
      });
  }, [router]);

  return null;
}
