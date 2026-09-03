import "server-only";

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data as unknown as Record<string, unknown>, init);
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export function badRequest(message = "Permintaan tidak valid."): Response {
  return jsonError(message, 400);
}

export function unauthorized(message = "Tidak punya akses."): Response {
  return jsonError(message, 401);
}

export function notFound(message = "Data tidak ditemukan."): Response {
  return jsonError(message, 404);
}

/**
 * Error tak terduga (paling sering: DATABASE_URL belum diset atau tabel belum dibuat).
 * Pesannya sengaja ditampilkan supaya gampang di-debug waktu setup awal.
 */
export function serverError(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Terjadi kesalahan di server.";
  console.error("[qa-handler]", error);
  return jsonError(message, 500);
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function asOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}
