"use client";

import { useEffect, useRef } from "react";

/**
 * Jalankan callback tiap `delayMs`. Berhenti sementara kalau tab tidak aktif,
 * supaya tidak boros query ke database saat halaman dibiarkan terbuka.
 */
export function useInterval(callback: () => void, delayMs: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      savedCallback.current();
    };

    const id = window.setInterval(tick, delayMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") savedCallback.current();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [delayMs]);
}
