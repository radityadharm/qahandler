"use client";

import { useEffect, useState } from "react";

type Props = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyButton({ value, label = "Salin", className = "btn-secondary btn-sm" }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Beberapa browser menolak clipboard tanpa HTTPS — biarkan pengguna menyalin manual.
      window.prompt("Salin link ini:", value);
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? "Tersalin!" : label}
    </button>
  );
}
