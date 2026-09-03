import { asOptionalBoolean, badRequest, jsonOk, notFound, readJsonBody, serverError } from "@/lib/api";
import { clearSpotlightIfMatches, deleteQuestion, updateQuestion } from "@/lib/questions";
import { getSeminarByAdminToken } from "@/lib/seminars";
import { isQuestionStatus } from "@/lib/types";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/moderate/[token]/questions/[id]">,
) {
  try {
    const { token, id } = await context.params;
    const seminar = await getSeminarByAdminToken(token);
    if (!seminar) return notFound("Link dashboard tidak valid.");

    const body = await readJsonBody(request);
    const isVisible = asOptionalBoolean(body.isVisible);

    let status: "new" | "answered" | "held" | undefined;
    if ("status" in body) {
      if (!isQuestionStatus(body.status)) return badRequest("Status pertanyaan tidak dikenal.");
      status = body.status;
    }

    if (status === undefined && isVisible === undefined) {
      return badRequest("Tidak ada perubahan yang dikirim.");
    }

    const question = await updateQuestion(seminar.id, id, { status, isVisible });
    if (!question) return notFound("Pertanyaan tidak ditemukan.");

    // Pertanyaan yang disembunyikan tidak boleh nyangkut di layar presentasi.
    if (question.isVisible === false) {
      await clearSpotlightIfMatches(seminar.id, question.id);
    }

    return jsonOk({ question });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/moderate/[token]/questions/[id]">,
) {
  try {
    const { token, id } = await context.params;
    const seminar = await getSeminarByAdminToken(token);
    if (!seminar) return notFound("Link dashboard tidak valid.");

    const deleted = await deleteQuestion(seminar.id, id);
    if (!deleted) return notFound("Pertanyaan tidak ditemukan.");

    return jsonOk({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
