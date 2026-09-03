"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 30_000;

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

// Diisi saat modul dimuat di browser, jadi sudah siap begitu React selesai hydrate.
let snapshot: number | null = typeof window === "undefined" ? null : Date.now();

function tick(): void {
  snapshot = Date.now();
  for (const listener of Array.from(listeners)) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (!timer) {
    timer = setInterval(tick, TICK_MS);
    // Kalau timer sempat berhenti, nilainya bisa basi. Disegarkan lewat
    // microtask supaya React sudah selesai memasang listener-nya.
    queueMicrotask(tick);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/**
 * Jam dinding sebagai external store. Di server nilainya `null` supaya HTML
 * hasil render server dan hasil hydration persis sama — label waktunya terisi
 * begitu halaman aktif, lalu ikut segar sendiri tiap setengah menit.
 */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => null,
  );
}
