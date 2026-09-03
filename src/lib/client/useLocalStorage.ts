"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Tab yang sama tidak menerima event `storage`, jadi kita beritahu manual. */
function emitChange(): void {
  for (const listener of Array.from(listeners)) listener();
}

export function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private mode / storage diblokir.
    return null;
  }
}

export function writeLocalStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Abaikan: semua fitur yang memakainya bersifat pelengkap.
  }
  emitChange();
}

/**
 * localStorage adalah external store, jadi dibaca lewat useSyncExternalStore —
 * bukan lewat useEffect + setState yang memicu render berantai.
 */
export function useStoredValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readLocalStorage(key),
    () => null,
  );
}
