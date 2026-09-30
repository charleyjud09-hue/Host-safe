"use client";

import { useState } from "react";

/**
 * Two-step confirmation for cancelling or permanently deleting a calendar
 * entry. The server action also refuses to run unless the confirm field
 * is present, so this can't be skipped.
 */
export default function ConfirmCalendarAction({
  action,
  confirmValue,
  triggerLabel,
  heading,
  body,
  confirmLabel,
  keepLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  /** Sent as the hidden "confirm" field the server action checks for. */
  confirmValue: string;
  triggerLabel: string;
  heading: string;
  body: string;
  confirmLabel: string;
  keepLabel: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const headingId = `confirm-${confirmValue}-heading`;

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-200 bg-white px-5 py-2.5 font-medium text-red-700 hover:bg-red-50"
      >
        {triggerLabel}
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-labelledby={headingId}
      className="w-full rounded-xl bg-red-50 p-4 ring-1 ring-red-200"
    >
      <p id={headingId} className="font-medium text-red-900">
        {heading}
      </p>
      <p className="mt-1 text-sm text-red-900">{body}</p>
      <form action={action} className="mt-3 flex flex-wrap gap-3">
        <input type="hidden" name="confirm" value={confirmValue} />
        <button
          type="submit"
          className="rounded-lg bg-red-700 px-5 py-2.5 font-medium text-white hover:bg-red-800"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-navy hover:bg-slate-50"
        >
          {keepLabel}
        </button>
      </form>
    </div>
  );
}
