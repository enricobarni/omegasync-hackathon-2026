/**
 * Marca OmegaSync — símbolo Omega linear (DESIGN.md §11).
 * Reaproveitado conceitualmente do repo anterior (OmegaMark.tsx).
 */
export function OmegaMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="none"
      width="28"
      height="28"
      className={className}
    >
      <path
        d="M8 42h13V31.5c-6.5-1.4-11-7.1-11-14C10 8.9 16.3 3 24 3s14 5.9 14 14.5c0 6.9-4.5 12.6-11 14V42h13"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="42" r="2" fill="currentColor" />
      <circle cx="40" cy="42" r="2" fill="currentColor" />
    </svg>
  );
}
