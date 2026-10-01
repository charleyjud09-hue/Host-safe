/**
 * The Letnook mark: an "L" under a roof. Keep in sync with app/icon.svg.
 * The roof uses a brighter teal than `action` so it stays visible on navy.
 */
export default function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden className={`shrink-0 ${className}`}>
      <rect width="36" height="36" rx="8" fill="#0f2a47" />
      <path
        d="M11 14 L18 8 L25 14"
        fill="none"
        stroke="#14b8a6"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 16 V27 H24"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
