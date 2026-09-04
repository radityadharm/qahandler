/** Validasi/normalisasi URL materi. Pure (tanpa API Node), aman di client & server. */

/**
 * Mengembalikan URL http/https yang sudah rapi, atau `null` kalau tidak valid.
 * Kalau protokol tidak ditulis (mis. "drive.google.com/..."), diasumsikan https.
 */
export function normalizeHttpUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname.includes(".")) return null; // tolak host tanpa domain, mis. "https://localhost-ish"

  return url.toString();
}

export function isValidHttpUrl(input: string): boolean {
  return normalizeHttpUrl(input) !== null;
}
