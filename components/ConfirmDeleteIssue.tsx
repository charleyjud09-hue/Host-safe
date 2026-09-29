"use client";

import { useState } from "react";

/**
 * Two-step permanent delete. The server action also refuses to delete
 * unless the confirm field is present, so this can't be skipped.
 */
export default function ConfirmDeleteIssue({
  action,
  issueTitle,
}: {
  action: (formData: FormData) => Promise<void>;
  issueTitle: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-200 bg-white px-5 py-2.5 font-medium text-red-700 hover:bg-red-50"
      >
        Delete issue
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-labelledby="confirm-delete-heading"
      className="w-full rounded-xl bg-red-50 p-4 ring-1 ring-red-200"
    >
      <p id="confirm-delete-heading" className="font-medium text-red-900">
        Permanently delete “{issueTitle}”?
      </p>
      <p className="mt-1 text-sm text-red-900">
        This can&apos;t be undone. If you just want it out of the way, archive it
        instead.
      </p>
      <form action={action} className="mt-3 flex flex-wrap gap-3">
        <input type="hidden" name="confirm" value="delete" />
        <button
          type="submit"
          className="rounded-lg bg-red-700 px-5 py-2.5 font-medium text-white hover:bg-red-800"
        >
          Delete permanently
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-navy hover:bg-slate-50"
        >
          Keep issue
        </button>
      </form>
    </div>
  );
}
