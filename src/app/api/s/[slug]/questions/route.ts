import { asString, badRequest, jsonError, jsonOk, notFound, readJsonBody, serverError } from "@/lib/api";
import { buildPublicFeed } from "@/lib/feed";
import { MAX_BODY_LENGTH, createQuestion } from "@/lib/questions";
import { getSeminarBySlug } from "@/lib/seminars";
import { toPublicQuestion } from "@/lib/types";

export async function GET(_request: Request, context: RouteContext<"/api/s/[slug]/questions">) {
  try {
    const { slug } = await context.params;
    const seminar = await getSeminarBySlug(slug);
    if (!seminar) return notFound("Seminar tidak ditemukan.");

    return jsonOk(await buildPublicFeed(seminar), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request, context: RouteContext<"/api/s/[slug]/questions">) {
  try {
    const { slug } = await context.params;
    const seminar = await getSeminarBySlug(slug);
    if (!seminar) return notFound("Seminar tidak ditemukan.");

    if (!seminar.acceptingQuestions) {
      return jsonError("Sesi tanya jawab untuk seminar ini sedang ditutup.", 409);
    }

    const payload = await readJsonBody(request);
    const body = asString(payload.body).trim();
    const voterId = asString(payload.voterId).trim();

    if (!body) return badRequest("Pertanyaannya belum diisi.");
    if (body.length > MAX_BODY_LENGTH) {
      return badRequest(`Pertanyaan maksimal ${MAX_BODY_LENGTH} karakter.`);
    }
    if (!voterId) return badRequest("Sesi peserta tidak dikenali. Coba muat ulang halamannya.");

    const result = await createQuestion({
      seminarId: seminar.id,
      body,
      authorName: asString(payload.authorName),
      authorKey: voterId,
      moderationRequired: seminar.moderationRequired,
    });

    if (!result.ok) {
      return jsonError("Terlalu banyak pertanyaan dalam waktu singkat. Tunggu sebentar ya.", 429);
    }

    return jsonOk(
      { question: toPublicQuestion(result.question), moderated: seminar.moderationRequired },
      { status: 201 },
    );
  } catch (error) {
    return serverError(error);
  }
}
