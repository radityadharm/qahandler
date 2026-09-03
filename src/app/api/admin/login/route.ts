import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  checkAdminPassword,
  createSessionValue,
  isAdminPasswordConfigured,
} from "@/lib/auth";
import { asString, jsonError, jsonOk, readJsonBody, serverError, unauthorized } from "@/lib/api";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    if (!isAdminPasswordConfigured()) {
      return jsonError(
        "ADMIN_PASSWORD belum diset di environment variable. Set dulu di Vercel (Settings → Environment Variables) atau di .env.local.",
        500,
      );
    }

    const body = await readJsonBody(request);
    if (!checkAdminPassword(asString(body.password))) {
      return unauthorized("Password salah.");
    }

    const store = await cookies();
    store.set(ADMIN_COOKIE, createSessionValue(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return jsonOk({ authenticated: true });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return jsonOk({ authenticated: false });
}
