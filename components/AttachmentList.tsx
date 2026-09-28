import { deleteAttachment } from "@/app/evidence/attachments/actions";
import { formatFileSize, type EvidenceAttachment } from "@/lib/evidence-attachments";

export default function AttachmentList({
  propertyId,
  recordId,
  attachments,
}: {
  propertyId: string;
  recordId: string;
  attachments: EvidenceAttachment[];
}) {
  if (attachments.length === 0) {
    return <p className="text-sm text-slate-600">No attachments added yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {attachments.map((a) => {
        const removeAction = deleteAttachment.bind(null, propertyId, recordId, a.id);
        return (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <a
                href={`/attachments/${a.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-navy underline underline-offset-4"
              >
                {a.original_file_name}
              </a>
              <p className="text-sm text-slate-600">
                {a.content_type} · {formatFileSize(a.size_bytes)} · uploaded{" "}
                {new Date(a.created_at).toLocaleDateString("en-GB")}
              </p>
            </div>
            <form action={removeAction}>
              <button
                type="submit"
                className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
