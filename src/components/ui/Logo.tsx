/**
 * A fork in the film: one strip splits into two frames, and the second take
 * is the one in leader orange. The trunk is the history, the frames are the
 * variants. The left frame inherits currentColor so it sits on any surface;
 * the right one carries the single accent.
 */
export function Mark({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.75" y="2.75" width="7.5" height="8.5" rx="1.75" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.75" y="2.75" width="7.5" height="8.5" rx="1.75" fill="var(--color-leader)" />
      <path
        d="M6.5 11.5v.5c0 2.6 5.5 2 5.5 5.2v4.3M17.5 11.5v.5c0 2.6-5.5 2-5.5 5.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <Mark size={20} className="text-ink" />
      <span className="font-mono text-[13px] font-medium uppercase leading-none tracking-[.14em] text-ink">
        fork<span className="text-leader">cut</span>
      </span>
    </span>
  );
}
