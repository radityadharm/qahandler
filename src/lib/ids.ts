import "server-only";

import { randomBytes } from "node:crypto";

// Tanpa huruf/angka yang gampang ketuker (0/o, 1/l/i) supaya enak dibaca peserta.
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function randomCode(length = 5): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/** Token rahasia untuk link dashboard moderator. */
export function randomToken(byteLength = 24): string {
  return randomBytes(byteLength).toString("base64url");
}
