/**
 * Decorative stand-in where a property image will later appear. No image,
 * no URL, no upload — purely a soft paper panel with a house outline.
 */
export default function PropertyImagePlaceholder({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`grid place-items-center bg-paper-deep text-[#b7a98f] ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-1/2 max-h-14 w-auto"
      >
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M10 21v-6h4v6" />
      </svg>
    </div>
  );
}
