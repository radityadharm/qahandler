import {
  asOptionalBoolean,
  asString,
  badRequest,
  jsonOk,
  notFound,
  readJsonBody,
  serverError,
} from "@/lib/api";
import { buildModerationFeed } from "@/lib/feed";
import { getSeminarByAdminToken, updateSeminar } from "@/lib/seminars";
import { normalizeHttpUrl } from "@/lib/url";

export async function GET(_request: Request, context: RouteContext<"/api/moderate/[token]">) {
  try {
    const { token } = await context.params;
    const seminar = await getSeminarByAdminToken(token);
    if (!seminar) return notFound("Link dashboard tidak valid.");

    return jsonOk(await buildModerationFeed(seminar), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext<"/api/moderate/[token]">) {
  try {
    const { token } = await context.params;
    const seminar = await getSeminarByAdminToken(token);
    if (!seminar) return notFound("Link dashboard tidak valid.");

    const body = await readJsonBody(request);

    const title = "title" in body ? asString(body.title).trim() : undefined;
    if (title !== undefined && !title) return badRequest("Judul seminar tidak boleh kosong.");

    // Absen = biarkan apa adanya, `null` = matikan sorotan di layar.
    let spotlightQuestionId: string | null | undefined;
    if ("spotlightQuestionId" in body) {
      const raw = body.spotlightQuestionId;
      spotlightQuestionId = typeof raw === "string" && raw ? raw : null;
    }

    // Absen = biarkan apa adanya, string kosong = kosongkan, selain itu wajib URL valid.
    let materialsUrl: string | null | undefined;
    if ("materialsUrl" in body) {
      const raw = asString(body.materialsUrl).trim();
      if (!raw) {
        materialsUrl = null;
      } else {
        const normalized = normalizeHttpUrl(raw);
        if (!normalized) return badRequest("Link materi harus berupa URL yang valid (http/https).");
        materialsUrl = normalized;
      }
    }

    const updated = await updateSeminar(seminar.id, {
      title: title?.slice(0, 120),
      description:
        "description" in body ? asString(body.description).trim().slice(0, 500) : undefined,
      acceptingQuestions: asOptionalBoolean(body.acceptingQuestions),
      showQuestionsToParticipants: asOptionalBoolean(body.showQuestionsToParticipants),
      allowUpvotes: asOptionalBoolean(body.allowUpvotes),
      moderationRequired: asOptionalBoolean(body.moderationRequired),
      spotlightQuestionId,
      materialsUrl,
    });

    if (!updated) return notFound("Seminar tidak ditemukan.");
    return jsonOk({ seminar: updated });
  } catch (error) {
    return serverError(error);
  }
}
