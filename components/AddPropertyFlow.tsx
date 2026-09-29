"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { createProperty } from "@/app/properties/actions";
import EligibilityChecker from "@/components/EligibilityChecker";
import PropertyForm from "@/components/PropertyForm";
import {
  mayNeedTailoredAdvice,
  suitableMessage,
  unsuitableMessage,
  type Answers,
} from "@/lib/eligibility";
import {
  clearPendingResult,
  parsePendingRaw,
  readPendingRaw,
} from "@/lib/pending-result";

// Answers held in this browser from the public /check page. There's no
// change event to listen for, so subscribe is a no-op; the server snapshot
// is null so server and first client render match.
const noSubscribe = () => () => {};
const serverSnapshot = () => null;

function ResultMessage({ answers }: { answers: Answers }) {
  const flagged = mayNeedTailoredAdvice(answers);
  return (
    <p
      className={`rounded-xl p-4 leading-relaxed ${
        flagged
          ? "bg-amber-50 text-amber-950 ring-1 ring-amber-200"
          : "bg-teal-50 text-slate-800 ring-1 ring-teal-200"
      }`}
    >
      {flagged ? unsuitableMessage : suitableMessage}
    </p>
  );
}

/**
 * Adding a property: first the one-time property questions, then the
 * property details. Both are saved together when the property is added.
 */
export default function AddPropertyFlow() {
  const pendingRaw = useSyncExternalStore(noSubscribe, readPendingRaw, serverSnapshot);
  const pending = useMemo(() => parsePendingRaw(pendingRaw), [pendingRaw]);
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [answerAgain, setAnswerAgain] = useState(false);

  function acceptAnswers(a: Answers) {
    // Used (or replaced) now, so it can't later be auto-saved again from
    // the dashboard as a newer check for this property.
    clearPendingResult();
    setAnswers(a);
  }

  const stepLabel = (n: 1 | 2, text: string) => (
    <p className="text-sm font-medium text-slate-600">
      Step {n} of 2 · {text}
    </p>
  );

  if (answers) {
    return (
      <div className="space-y-6">
        {stepLabel(2, "Property details")}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-navy">
              Your property questions
            </h2>
            <button
              type="button"
              onClick={() => setAnswers(null)}
              className="text-sm font-medium text-navy underline underline-offset-4"
            >
              Change answers
            </button>
          </div>
          <div className="mt-3">
            <ResultMessage answers={answers} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <PropertyForm
            action={createProperty}
            submitLabel="Add property"
            hiddenFields={{ eligibility_answers: JSON.stringify(answers) }}
          />
        </div>
      </div>
    );
  }

  if (pending && !answerAgain) {
    return (
      <div className="space-y-6">
        {stepLabel(1, "Property questions")}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-navy">
            Use your earlier answers?
          </h2>
          <p className="mt-2 text-slate-700">
            You answered the property questions before creating your account.
            You can use those answers for this property, or answer again.
          </p>
          <div className="mt-4">
            <ResultMessage answers={pending} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => acceptAnswers(pending)}
              className="rounded-lg bg-action px-5 py-2.5 font-medium text-white hover:bg-action-hover"
            >
              Use these answers
            </button>
            <button
              type="button"
              onClick={() => setAnswerAgain(true)}
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-navy hover:bg-slate-50"
            >
              Answer again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stepLabel(1, "Property questions")}
      <p className="text-slate-700">
        Six quick questions. This is not an assessment. It only helps you see
        whether HostSafe is designed for a property like yours.
      </p>
      <EligibilityChecker onComplete={acceptAnswers} />
    </div>
  );
}
