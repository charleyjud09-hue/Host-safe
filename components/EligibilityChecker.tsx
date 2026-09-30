"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveEligibilityResult } from "@/app/eligibility/actions";
import { stashPendingResult } from "@/lib/pending-result";
import {
  type Answer,
  type Answers,
  mayNeedTailoredAdvice,
  questions,
  suitableMessage,
  unsuitableMessage,
} from "@/lib/eligibility";

const options: { value: Answer; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

export default function EligibilityChecker({
  accountsEnabled = false,
  signedIn = false,
  propertyId,
  propertyName,
  hasExistingResult = false,
  onComplete,
}: {
  accountsEnabled?: boolean;
  signedIn?: boolean;
  /** When set, this is a property-scoped check: saving goes straight to this property, unambiguously. */
  propertyId?: string;
  propertyName?: string;
  hasExistingResult?: boolean;
  /**
   * Onboarding mode (adding a new property): instead of saving, hand the
   * finished answers back so they're saved together with the new property.
   */
  onComplete?: (answers: Answers) => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const done = step >= questions.length;
  const headingRef = useRef<HTMLLegendElement>(null);
  const hasInteracted = useRef(false);
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Move focus to the new question so keyboard and screen-reader users
  // know it has changed. Skipped on first load.
  useEffect(() => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  function choose(id: string, value: Answer) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setSaveError(null);
    setSaved(false);
  }

  function saveToProperty() {
    if (!propertyId) return;
    setSaveError(null);
    startSaving(async () => {
      const result = await saveEligibilityResult(propertyId, answers);
      // A successful save redirects server-side and never returns here.
      if (result?.error) setSaveError(result.error);
    });
  }

  if (done && onComplete) {
    const flagged = mayNeedTailoredAdvice(answers);
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        role="status"
      >
        <h2 className="text-2xl font-semibold text-navy">
          {flagged ? "You may need more tailored advice" : "Your result"}
        </h2>
        <p
          className={`mt-4 rounded-xl p-4 leading-relaxed ${
            flagged
              ? "bg-amber-50 text-amber-950 ring-1 ring-amber-200"
              : "bg-slate-50 text-slate-800 ring-1 ring-slate-200"
          }`}
        >
          {flagged ? unsuitableMessage : suitableMessage}
        </p>
        <p className="mt-4 text-sm text-slate-600">
          This is a simple guide based only on what you told us. Your answers
          will be saved with this property when you add it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onComplete(answers)}
            className="rounded-lg bg-action px-5 py-2.5 font-medium text-white hover:bg-action-hover"
          >
            Continue to property details
          </button>
          <button
            type="button"
            onClick={restart}
            className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-navy hover:bg-slate-50"
          >
            Start again
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    const flagged = mayNeedTailoredAdvice(answers);
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        role="status"
      >
        <h2 className="text-2xl font-semibold text-navy">
          {flagged ? "You may need more tailored advice" : "Your result"}
        </h2>
        <p
          className={`mt-4 rounded-xl p-4 leading-relaxed ${
            flagged
              ? "bg-amber-50 text-amber-950 ring-1 ring-amber-200"
              : "bg-slate-50 text-slate-800 ring-1 ring-slate-200"
          }`}
        >
          {flagged ? unsuitableMessage : suitableMessage}
        </p>
        <p className="mt-4 text-sm text-slate-600">
          This is a simple guide based only on what you told us. Your answers
          are not saved or sent anywhere unless you choose to create an
          account.
        </p>

        {saveError && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-950 ring-1 ring-amber-200"
          >
            {saveError}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {propertyId && accountsEnabled && (
            <button
              type="button"
              onClick={saveToProperty}
              disabled={isSaving}
              className="rounded-lg bg-navy px-5 py-2.5 font-medium text-white hover:bg-navy-light disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : hasExistingResult
                  ? `Update check for ${propertyName ?? "this property"}`
                  : `Save check for ${propertyName ?? "this property"}`}
            </button>
          )}
          {!propertyId && accountsEnabled && signedIn && (
            <Link
              href="/"
              onClick={() => {
                stashPendingResult(answers);
                setSaved(true);
              }}
              className="rounded-lg bg-navy px-5 py-2.5 font-medium text-white hover:bg-navy-light"
            >
              Save this result
            </Link>
          )}
          {!propertyId && accountsEnabled && !signedIn && (
            <Link
              href="/sign-up"
              onClick={() => stashPendingResult(answers)}
              className="rounded-lg bg-navy px-5 py-2.5 font-medium text-white hover:bg-navy-light"
            >
              Create free account to save your progress
            </Link>
          )}
          <button
            type="button"
            onClick={restart}
            className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-navy hover:bg-slate-50"
          >
            Start again
          </button>
          <Link
            href={propertyId ? `/properties/${propertyId}/edit` : "/"}
            className="rounded-lg px-5 py-2.5 font-medium text-navy underline underline-offset-4"
          >
            {propertyId ? "Back to property" : "Back to home"}
          </Link>
        </div>
        {saved && (
          <p className="mt-3 text-sm text-slate-600">
            Saved for your next dashboard visit.
          </p>
        )}
      </div>
    );
  }

  const q = questions[step];
  const current = answers[q.id];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Question {step + 1} of {questions.length}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-valuenow={step + 1}
      >
        <div
          className="h-full rounded-full bg-teal-600 transition-all"
          style={{ width: `${((step + 1) / questions.length) * 100}%` }}
        />
      </div>

      <fieldset className="mt-6">
        <legend
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-semibold text-navy focus:outline-none"
        >
          {q.text}
        </legend>
        <p className="mt-2 text-slate-600">{q.hint}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {options.map((o) => (
            <label
              key={o.value}
              className={`cursor-pointer rounded-xl border px-4 py-3 text-center font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600 has-[:focus-visible]:ring-offset-2 ${
                current === o.value
                  ? "border-navy bg-navy text-white"
                  : "border-slate-300 text-navy hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name={q.id}
                value={o.value}
                aria-label={o.label}
                checked={current === o.value}
                onChange={() => choose(q.id, o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="rounded-lg px-4 py-2.5 font-medium text-navy hover:bg-slate-50 disabled:invisible"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setStep((s) => s + 1)}
          disabled={!current}
          className="rounded-lg bg-navy px-6 py-2.5 font-medium text-white hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === questions.length - 1 ? "See result" : "Next"}
        </button>
      </div>
    </div>
  );
}
