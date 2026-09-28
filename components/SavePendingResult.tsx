"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { mayNeedTailoredAdvice } from "@/lib/eligibility";
import { clearPendingResult, readPendingResult } from "@/lib/pending-result";
import { createClient } from "@/lib/supabase/client";

type PropertyOption = { id: string; name: string };

/**
 * If the visitor completed the check before it was linked to a property,
 * this finds a safe home for it once they're signed in:
 *  - one property: saves to it automatically.
 *  - no properties: leaves it stashed and asks the user to add one first.
 *  - more than one: asks the user to choose, rather than guessing.
 * Never saves a result to a property the user didn't pick themselves.
 */
export default function SavePendingResult() {
  const router = useRouter();
  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "needs-property" }
    | { state: "choose"; properties: PropertyOption[] }
    | { state: "saving" }
  >({ state: "idle" });

  useEffect(() => {
    const answers = readPendingResult();
    if (!answers) return;

    const supabase = createClient();
    supabase
      .from("properties")
      .select("id, name")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const properties = (data ?? []) as PropertyOption[];

        if (properties.length === 0) {
          setStatus({ state: "needs-property" });
          return;
        }

        if (properties.length > 1) {
          setStatus({ state: "choose", properties });
          return;
        }

        // Exactly one property: unambiguous, safe to save automatically.
        setStatus({ state: "saving" });
        supabase
          .from("eligibility_results")
          .insert({
            property_id: properties[0].id,
            answers,
            may_need_tailored_advice: mayNeedTailoredAdvice(answers),
          })
          .then(({ error }) => {
            if (!error) {
              clearPendingResult();
              router.refresh();
            } else {
              setStatus({ state: "idle" });
            }
          });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveTo(propertyId: string) {
    const answers = readPendingResult();
    if (!answers) return;
    setStatus({ state: "saving" });
    createClient()
      .from("eligibility_results")
      .insert({
        property_id: propertyId,
        answers,
        may_need_tailored_advice: mayNeedTailoredAdvice(answers),
      })
      .then(({ error }) => {
        if (!error) {
          clearPendingResult();
          router.refresh();
        } else {
          setStatus({ state: "idle" });
        }
      });
  }

  if (status.state === "needs-property") {
    return (
      <div className="mx-auto mt-6 max-w-2xl px-5">
        <div className="rounded-xl bg-teal-50 p-4 text-sm text-slate-800 ring-1 ring-teal-200">
          You have a saved property check waiting.{" "}
          <Link
            href="/properties/new"
            className="font-medium text-navy underline underline-offset-4"
          >
            Add a property
          </Link>{" "}
          to save it there.
        </div>
      </div>
    );
  }

  if (status.state === "choose") {
    return (
      <div className="mx-auto mt-6 max-w-2xl px-5">
        <div className="rounded-xl bg-teal-50 p-4 text-sm text-slate-800 ring-1 ring-teal-200">
          <p>You have a saved property check. Which property is it for?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {status.properties.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => saveTo(p.id)}
                className="rounded-lg border border-teal-300 bg-white px-3 py-1.5 font-medium text-navy hover:bg-teal-100"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
