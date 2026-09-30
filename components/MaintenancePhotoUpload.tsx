"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { PhotoUploadResult } from "@/app/maintenance/photos/actions";
import {
  MAINTENANCE_PHOTO_NOTE,
  MAINTENANCE_PHOTO_TYPES,
  MAX_MAINTENANCE_PHOTO_BYTES,
} from "@/lib/maintenance-photos";

export default function MaintenancePhotoUpload({
  uploadAction,
  remaining,
}: {
  /** Uploads one photo; called once per selected file. */
  uploadAction: (formData: FormData) => Promise<PhotoUploadResult>;
  /** How many more photos this issue can take. */
  remaining: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const files = Array.from(inputRef.current?.files ?? []);
    if (files.length === 0) {
      setError("Please choose at least one photo.");
      return;
    }
    if (files.length > remaining) {
      setError(
        `You can add ${remaining} more photo${remaining === 1 ? "" : "s"} to this issue.`,
      );
      return;
    }
    // Quick browser-side feedback only; the server re-checks everything.
    for (const file of files) {
      if (file.size > MAX_MAINTENANCE_PHOTO_BYTES) {
        setError(`"${file.name}" is larger than the 10MB limit.`);
        return;
      }
      if (!MAINTENANCE_PHOTO_TYPES.includes(file.type as (typeof MAINTENANCE_PHOTO_TYPES)[number])) {
        setError(`"${file.name}" is not a JPG, PNG, or WebP photo.`);
        return;
      }
    }

    startTransition(async () => {
      // One request per photo, so several photos never exceed the
      // request size limit together.
      for (let i = 0; i < files.length; i++) {
        setProgress(`Uploading ${i + 1} of ${files.length}...`);
        const fd = new FormData();
        fd.set("photo", files[i]);
        const result = await uploadAction(fd);
        if (result?.error) {
          setError(result.error);
          break;
        }
      }
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label htmlFor="photos" className="font-medium text-navy">
          Add photos <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input
          ref={inputRef}
          id="photos"
          name="photos"
          type="file"
          multiple
          accept={MAINTENANCE_PHOTO_TYPES.join(",")}
          disabled={pending}
          className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-navy-light disabled:opacity-60"
        />
        <p className="mt-1 text-sm text-slate-600">
          JPG, PNG, or WebP, up to 10MB each. {MAINTENANCE_PHOTO_NOTE}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 p-3 text-amber-950 ring-1 ring-amber-200"
        >
          {error}
        </p>
      )}
      {progress && (
        <p role="status" className="text-sm text-slate-600">
          {progress}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-action px-6 py-3 font-semibold text-white hover:bg-action-hover disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Uploading..." : "Upload photos"}
      </button>
    </form>
  );
}
