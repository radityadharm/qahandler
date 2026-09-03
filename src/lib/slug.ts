/** Helper slug murni (tanpa API Node) supaya aman dipakai di komponen client. */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

/** Normalisasi kode yang diketik peserta di halaman depan. */
export function normalizeSlug(input: string): string {
  return slugify(input.trim());
}
