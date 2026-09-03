import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "qa_admin_session";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function getSecret(): string | null {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || null;
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

export function createSessionValue(): string {
  const secret = getSecret();
  if (!secret) throw new Error("ADMIN_PASSWORD belum diset.");
  const payload = `${Date.now() + SESSION_TTL_MS}.${randomUUID()}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionValue(value: string | undefined | null): boolean {
  if (!value) return false;
  const secret = getSecret();
  if (!secret) return false;

  const lastDot = value.lastIndexOf(".");
  if (lastDot <= 0) return false;

  const payload = value.slice(0, lastDot);
  const signature = value.slice(lastDot + 1);
  if (!safeEqual(signature, sign(payload, secret))) return false;

  const expiresAt = Number(payload.split(".")[0]);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionValue(store.get(ADMIN_COOKIE)?.value);
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
