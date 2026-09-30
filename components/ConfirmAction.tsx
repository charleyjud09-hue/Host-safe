"use client";

import { useId, useState } from "react";

/**
 * Two-step "are you sure?" for anything that deletes, cancels or removes.
 * The server action also refuses to run unless the confirm field is
 * present, so this step can't be skipped by posting the form directly.
 */
export default function ConfirmAction({
  action,
  confirmValue,
  triggerLabel,
  triggerAriaLabel,
  heading,
  body,
  confirmLabel,
  keepLabel,
  size = "md",
}: {
  action: (formData: FormData) => Promise<void>;
  /** Sent as the hidden "confirm" field the server action checks for. */
  confirmValue: string;
  triggerLabel: string;
  /** Fuller accessible name when the visible label is short (e.g. "Delete"). */
  triggerAriaLabel?: string;
  heading: string;
  body: string;
  confirmLabel: string;
  keepLabel: string;
  /** "sm" for compact rows such as attachment lists and photo cards. */
  size?: "md" | "sm";
}) {
  const [confirming, setConfirming] = useState(false);
  const headingId = useId();
  const pad = size === "sm" ? "px-3 py-1.5 text-sm" : "px-5 py-2.5";

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={triggerAriaLabel}
        className={`shrink-0 rounded-lg border border-red-200 bg-white font-medium text-red-700 hover:bg-red-50 ${pad}`}
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
          className={`rounded-lg bg-red-700 font-medium text-white hover:bg-red-800 ${pad}`}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={`rounded-lg border border-slate-300 bg-white font-medium text-navy hover:bg-slate-50 ${pad}`}
        >
          {keepLabel}
        </button>
      </form>
    </div>
  );
}
