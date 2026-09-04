import mark from "@/assets/logo/mark.png";
import wordmark from "@/assets/logo/wordmark.png";

/** Ikon merek saja (bubble QA), persegi. Aset PNG asli. */
export function LogoMark({
  className = "h-10 w-10",
  title = "QA Handler",
}: {
  className?: string;
  title?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- aset statis kecil, ukuran tetap
    <img
      src={mark.src}
      alt={title}
      width={mark.width}
      height={mark.height}
      className={className}
    />
  );
}

/** Logo lengkap dengan tulisan "QA HANDLER APP" — untuk halaman depan. */
export function LogoFull({
  className = "h-40 w-auto",
  title = "QA Handler App",
}: {
  className?: string;
  title?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- aset statis, ukuran tetap
    <img
      src={wordmark.src}
      alt={title}
      width={wordmark.width}
      height={wordmark.height}
      className={className}
    />
  );
}

/** Lockup: ikon + wordmark "QA Handler" (dengan subjudul opsional). */
export function Logo({
  markClassName = "h-10 w-10",
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
