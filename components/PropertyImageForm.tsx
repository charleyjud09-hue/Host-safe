"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import type { PropertyImageFormState } from "@/app/properties/images/actions";
import PropertyImagePlaceholder from "@/components/PropertyImagePlaceholder";
import { MAX_PROPERTY_IMAGE_BYTES, PROPERTY_IMAGE_TYPES } from "@/lib/property-images";

export default function PropertyImageForm({
  imageUrl,
  uploadAction,
  removeAction,
}: {
  /** Owner-checked route URL, or null when there's no image. */
  imageUrl: string | null;
  uploadAction: (
    prev: PropertyImageFormState,
    formData: FormData,
  ) => Promise<PropertyImageFormState>;
  removeAction: () => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState<PropertyImageFormState, FormData>(
    uploadAction,
    {},
  );
  const [clientError, setClientError] = useState<string | null>(null);

  // Quick browser-side feedback only; the server re-checks everything.
  function checkFile(e: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PROPERTY_IMAGE_BYTES) {
      setClientError("Images can be up to 5MB.");
      e.target.value = "";
    } else if (!PROPERTY_IMAGE_TYPES.includes(file.type as (typeof PROPERTY_IMAGE_TYPES)[number])) {
      setClientError("Please choose a JPG, PNG, or WebP image.");
      e.target.value = "";
    }
  }

  const error = clientError ?? state.error;

  return (
    <div className="space-y-5">
      <div className="relative h-44 w-full overflow-hidden rounded-xl ring-1 ring-slate-200 sm:h-52">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Current property image"
            fill
            unoptimized
            sizes="(min-width: 640px) 640px, 100vw"
            className="object-cover"
          />
        ) : (
          <PropertyImagePlaceholder className="h-full w-full" />
        )}
      </div>

      <form action={formAction} className="space-y-3">
        <div>
          <label htmlFor="image" className="font-medium text-navy">
            {imageUrl ? "Replace image" : "Add an image"}{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept={PROPERTY_IMAGE_TYPES.join(",")}
            onChange={checkFile}
            disabled={pending}
            className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-navy-light disabled:opacity-60"
          />
          <p className="mt-1 text-sm text-slate-600">
            JPG, PNG, or WebP, up to 5MB. Images are stored privately and are
            only shown to you. Please avoid photos that show people or
            personal information.
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

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-action px-6 py-3 font-semibold text-white hover:bg-action-hover disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Uploading..." : imageUrl ? "Replace image" : "Upload image"}
        </button>
      </form>

      {imageUrl && (
        <form action={removeAction}>
          <button
            type="submit"
            className="w-full rounded-lg border border-red-200 bg-white px-6 py-3 font-semibold text-red-700 hover:bg-red-50 sm:w-auto"
          >
            Remove image
          </button>
        </form>
      )}
    </div>
  );
}
