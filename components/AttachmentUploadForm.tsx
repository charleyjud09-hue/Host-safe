"use client";

import { useActionState, useState } from "react";
import type { AttachmentFormState } from "@/app/evidence/attachments/actions";
import { ALLOWED_CONTENT_TYPES, MAX_ATTACHMENT_BYTES } from "@/lib/evidence-attachments";

const ACCEPT = ALLOWED_CONTENT_TYPES.join(",");

export default function AttachmentUploadForm({
  action,
  disabled,
}: {
  action: (
    prev: AttachmentFormState,
    formData: FormData,
  ) => Promise<AttachmentFormState>;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState<AttachmentFormState, FormData>(
    action,
    {},
  );
  const [clientError, setClientError] = useState<string | null>(null);

  function checkFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    for (const file of e.target.files ?? []) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setClientError(`"${file.name}" is larger than the 10MB limit per file.`);
        e.target.value = "";
        return;
      }
    }
  }

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="files" className="font-medium text-navy">
          Add photos or PDF certificates
        </label>
        <input
          id="files"
          name="files"
          type="file"
          accept={ACCEPT}
          multiple
          disabled={disabled || pending}
          onChange={checkFiles}
          className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-navy-light disabled:opacity-60"
        />
        <p className="mt-1 text-sm text-slate-600">
          JPG, PNG, WebP, or PDF. Up to 10MB per file.
        </p>
      </div>

      {(clientError || state.error) && (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 p-3 text-amber-950 ring-1 ring-amber-200"
        >
          {clientError ?? state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={disabled || pending}
        className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-navy hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
