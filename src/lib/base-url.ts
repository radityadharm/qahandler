import "server-only";

import { headers } from "next/headers";

/**
 * URL dasar aplikasi, dipakai untuk membentuk link peserta dan kode QR.
 * Di Vercel host-nya datang dari header; set NEXT_PUBLIC_APP_URL kalau kamu
 * memakai domain kustom dan ingin link yang dibagikan selalu memakai domain itu.
 */
export async function getBaseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}
