import Image from "next/image";
import { deleteMaintenancePhoto } from "@/app/maintenance/photos/actions";
import ConfirmAction from "@/components/ConfirmAction";
import { formatFileSize } from "@/lib/evidence-attachments";
import type { MaintenancePhoto } from "@/lib/maintenance-photos";

export default function MaintenancePhotoGrid({
  propertyId,
  issueId,
  photos,
}: {
  propertyId: string;
  issueId: string;
  photos: MaintenancePhoto[];
}) {
  if (photos.length === 0) {
    return <p className="text-sm text-slate-600">No photos added yet.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {photos.map((photo) => {
        const url = `/maintenance-photos/${photo.id}`;
        return (
          <li
            key={photo.id}
            className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200"
          >
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block h-40 bg-paper-deep"
            >
              <Image
                src={url}
                alt={`Photo: ${photo.original_file_name}`}
                fill
                unoptimized
                sizes="(min-width: 640px) 320px, 100vw"
                className="object-cover"
              />
            </a>
            <div className="flex flex-wrap items-center justify-between gap-3 p-3">
              <p className="min-w-0 truncate text-sm text-slate-600">
                {photo.original_file_name} · {formatFileSize(photo.size_bytes)}
              </p>
              <ConfirmAction
                action={deleteMaintenancePhoto.bind(null, propertyId, issueId, photo.id)}
                confirmValue="delete"
                size="sm"
                triggerLabel="Delete"
                triggerAriaLabel={`Delete photo ${photo.original_file_name}`}
                heading="Delete this photo?"
                body="The photo will be permanently removed. This can’t be undone."
                confirmLabel="Delete permanently"
                keepLabel="Keep photo"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
