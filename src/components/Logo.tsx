import type { CSSProperties } from "react";

/**
 * Ikon merek: speech bubble gradien dengan monogram QA (lingkaran + centang + huruf A).
 * Gradien memakai id tetap; kalau dirender berkali-kali di satu halaman, semua
 * instance identik sehingga referensi id yang sama tetap aman.
 */
export function LogoMark({
  className,
  style,
  title = "QA Handler",
}: {
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      style={style}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="qa-bubble" x1="96" y1="66" x2="416" y2="404" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5cead0" />
          <stop offset="0.38" stopColor="#22b1ef" />
          <stop offset="0.68" stopColor="#2f5be6" />
          <stop offset="1" stopColor="#3a33c6" />
        </linearGradient>
        <radialGradient id="qa-gloss" cx="0.33" cy="0.26" r="0.72">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path
        id="qa-bubble-shape"
        fill="url(#qa-bubble)"
        d="M256 60 C367 60 452 143 452 250 C452 357 367 440 256 440 C232 440 210 436 189 428 C177 452 159 470 151 476 C141 482 132 476 135 464 C140 444 145 425 143 413 C102 378 60 320 60 250 C60 143 145 60 256 60 Z"
      />
      <use href="#qa-bubble-shape" fill="url(#qa-gloss)" />

      <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
        <path d="M258 220 L206 330 M258 220 L310 330" strokeWidth="28" />
        <path d="M232 285 L284 285" strokeWidth="25" />
        <circle cx="216" cy="212" r="49" strokeWidth="18" />
        <path d="M194 214 L214 236 L330 132" strokeWidth="18" />
      </g>
    </svg>
  );
}

/** Lockup: ikon + wordmark "QA Handler" (dengan subjudul opsional). */
export function Logo({
  markClassName = "h-9 w-9",
  subtitle,
  className = "",
}: {
  markClassName?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-slate-900">QA Handler</span>
        {subtitle ? <span className="mt-1 text-xs font-medium text-slate-500">{subtitle}</span> : null}
      </span>
    </span>
  );
}
