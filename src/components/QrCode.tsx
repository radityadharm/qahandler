"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  value: string;
  size?: number;
  className?: string;
  dark?: string;
  light?: string;
};

export function QrCode({ value, size = 160, className, dark = "#0f172a", light = "#ffffff" }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(value, { width: size * 2, margin: 1, color: { dark, light } })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size, dark, light]);

  if (!dataUrl) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  // Sengaja pakai <img>: sumbernya data URL yang dibuat di browser,
  // jadi tidak ada yang bisa dioptimasi oleh next/image.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="Kode QR untuk membuka halaman peserta"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
