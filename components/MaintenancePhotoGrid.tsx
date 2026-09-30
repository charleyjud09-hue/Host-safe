import Image from "next/image";
import { deleteMaintenancePhoto } from "@/app/maintenance/photos/actions";
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
            <div className="flex items-center justify-between gap-3 p-3">
              <p className="min-w-0 truncate text-sm text-slate-600">
                {photo.original_file_name} · {formatFileSize(photo.size_bytes)}
              </p>
              <form
                action={deleteMaintenancePhoto.bind(null, propertyId, issueId, photo.id)}
              >
                <button
                  type="submit"
                  aria-label={`Delete photo ${photo.original_file_name}`}
                  className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
