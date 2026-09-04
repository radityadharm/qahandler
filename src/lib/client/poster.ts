"use client";

import QRCode from "qrcode";

export type SharePosterInput = {
  /** Judul seminar, tampil besar di atas. */
  title: string;
  /** Deskripsi singkat opsional di bawah judul. */
  description?: string;
  /** URL lengkap (dengan protokol) — dipakai untuk QR dan teks link. */
  url: string;
  /** Label kecil di atas judul. Default: "SESI TANYA JAWAB". */
  kicker?: string;
  /** Label di atas alamat link. Default: "Scan QR atau buka link:". */
  linkLabel?: string;
  /** Nama file unduhan, mis. "qr-seminar-ai-2026.png". */
  fileName?: string;
};

const SIZE = 1080;
const SANS =
  '"Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif';
const MONO = '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace';

const INDIGO = "#4f46e5";
const INK = "#0f172a";
const SLATE = "#64748b";

/** Bikin gambar persegi 1080×1080 berisi QR + link, siap dibagikan. */
export async function buildSharePosterCanvas(
  input: SharePosterInput,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser ini tidak mendukung pembuatan gambar.");

  // QR digambar ke canvas terpisah dulu supaya tetap tajam saat ditempel.
  const qrSize = 430;
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, input.url, {
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: INK, light: "#ffffff" },
  });

  // Latar indigo + kartu putih membulat.
  ctx.fillStyle = INDIGO;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const inset = 48;
  roundRect(ctx, inset, inset, SIZE - inset * 2, SIZE - inset * 2, 56);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const centerX = SIZE / 2;
  const contentWidth = 812;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // --- Ukur tiap blok dulu supaya seluruh isi bisa ditata rata tengah vertikal.
  const kicker = (input.kicker ?? "SESI TANYA JAWAB").toUpperCase();
  const linkLabel = input.linkLabel ?? "Scan QR atau buka link:";
  const kickerHeight = 28;
  const gapAfterKicker = 18;

  ctx.font = `800 46px ${SANS}`;
  const titleLines = wrapByWord(ctx, input.title, contentWidth, 3);
  const titleLineHeight = 58;
  const titleHeight = titleLines.length * titleLineHeight;

  const description = (input.description ?? "").trim();
  ctx.font = `400 26px ${SANS}`;
  const descLines = description ? wrapByWord(ctx, description, contentWidth, 2) : [];
  const descLineHeight = 34;
  const gapAfterTitle = description ? 16 : 0;
  const descHeight = descLines.length * descLineHeight;

  const gapBeforeQr = 42;
  const qrPad = 20;
  const qrBox = qrSize + qrPad * 2;

  const gapAfterQr = 32;
  const labelHeight = 26;
  const gapAfterLabel = 10;

  const displayUrl = input.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const urlFont = fitMonoFont(ctx, displayUrl, contentWidth, 32, 20);
  const urlLineHeight = urlFont + 8;

  const totalHeight =
    kickerHeight +
    gapAfterKicker +
    titleHeight +
    gapAfterTitle +
    descHeight +
    gapBeforeQr +
    qrBox +
    gapAfterQr +
    labelHeight +
    gapAfterLabel +
    urlLineHeight;

  let y = Math.max(96, (SIZE - totalHeight) / 2);

  // --- Kicker
  ctx.fillStyle = INDIGO;
  ctx.font = `700 24px ${SANS}`;
  ctx.letterSpacing = "4px";
  ctx.fillText(kicker, centerX, y);
  ctx.letterSpacing = "0px";
  y += kickerHeight + gapAfterKicker;

  // --- Judul
  ctx.fillStyle = INK;
  ctx.font = `800 46px ${SANS}`;
  for (const line of titleLines) {
    ctx.fillText(line, centerX, y);
    y += titleLineHeight;
  }

  // --- Deskripsi (opsional)
  if (descLines.length) {
    y += gapAfterTitle;
    ctx.fillStyle = SLATE;
    ctx.font = `400 26px ${SANS}`;
    for (const line of descLines) {
      ctx.fillText(line, centerX, y);
      y += descLineHeight;
    }
  }

  // --- Kotak QR
  y += gapBeforeQr;
  const qrBoxX = centerX - qrBox / 2;
  roundRect(ctx, qrBoxX, y, qrBox, qrBox, 28);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#e2e8f0";
  ctx.stroke();
  ctx.drawImage(qrCanvas, centerX - qrSize / 2, y + qrPad, qrSize, qrSize);
  y += qrBox + gapAfterQr;

  // --- Label + link
  ctx.fillStyle = SLATE;
  ctx.font = `500 26px ${SANS}`;
  ctx.fillText(linkLabel, centerX, y);
  y += labelHeight + gapAfterLabel;

  ctx.fillStyle = INDIGO;
  ctx.font = `600 ${urlFont}px ${MONO}`;
  ctx.fillText(displayUrl, centerX, y);

  return canvas;
}

/** Bangun poster lalu picu unduhan file PNG. */
export async function downloadSharePoster(input: SharePosterInput): Promise<void> {
  const canvas = await buildSharePosterCanvas(input);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Gagal membuat gambar QR.");

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = input.fileName ?? "qr-seminar.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/** Pecah teks jadi beberapa baris berdasarkan kata; baris terakhir dipotong "…". */
function wrapByWord(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }

  // Sisa kata (termasuk yang belum sempat masuk) ditaruh di baris terakhir.
  const consumed = lines.join(" ").split(/\s+/).filter(Boolean).length;
  const rest = words.slice(consumed).join(" ") || current;
  lines.push(ellipsize(ctx, rest, maxWidth));
  return lines;
}

/** Perkecil font monospace sampai teks muat satu baris (dengan batas minimum). */
function fitMonoFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startPx: number,
  minPx: number,
): number {
  let px = startPx;
  ctx.font = `600 ${px}px ${MONO}`;
  while (px > minPx && ctx.measureText(text).width > maxWidth) {
    px -= 1;
    ctx.font = `600 ${px}px ${MONO}`;
  }
  return px;
}

function ellipsize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed.trimEnd()}…`;
}
