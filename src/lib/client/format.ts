const RELATIVE_UNITS: Array<[limitSeconds: number, divisor: number, suffix: string]> = [
  [60, 1, "detik"],
  [3600, 60, "menit"],
  [86400, 3600, "jam"],
];

export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 10) return "baru saja";

  for (const [limit, divisor, suffix] of RELATIVE_UNITS) {
    if (seconds < limit) return `${Math.floor(seconds / divisor)} ${suffix} lalu`;
  }

  const days = Math.floor(seconds / 86400);
  if (days < 7) return `${days} hari lalu`;
  return formatDateTime(iso);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
