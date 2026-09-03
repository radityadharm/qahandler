import { notFound, serverError } from "@/lib/api";
import { getSeminarByAdminToken } from "@/lib/seminars";
import { listAllQuestions } from "@/lib/questions";

const STATUS_LABEL: Record<string, string> = {
  new: "Belum dijawab",
  answered: "Sudah dijawab",
  held: "Ditahan",
};

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatJakarta(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

export async function GET(
  _request: Request,
  context: RouteContext<"/api/moderate/[token]/export">,
) {
  try {
    const { token } = await context.params;
    const seminar = await getSeminarByAdminToken(token);
    if (!seminar) return notFound("Link dashboard tidak valid.");

    const questions = await listAllQuestions(seminar.id);

    const header = [
      "Waktu kirim",
      "Nama",
      "Pertanyaan",
      "Status",
      "Upvote",
      "Tampil ke peserta",
      "Waktu dijawab",
    ];

    const lines = [
      header.map(csvCell).join(","),
      ...questions.map((question) =>
        [
          csvCell(formatJakarta(question.createdAt)),
          csvCell(question.authorName ?? "Anonim"),
          csvCell(question.body),
          csvCell(STATUS_LABEL[question.status] ?? question.status),
          csvCell(question.upvoteCount),
          csvCell(question.isVisible ? "Ya" : "Tidak"),
          csvCell(formatJakarta(question.answeredAt)),
        ].join(","),
      ),
    ];

    // BOM supaya Excel membaca UTF-8 dengan benar.
    const csv = `﻿${lines.join("\r\n")}\r\n`;
    const filename = `pertanyaan-${seminar.slug}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
