import { asString, badRequest, jsonError, jsonOk, notFound, readJsonBody, serverError } from "@/lib/api";
import { toggleVote } from "@/lib/questions";
import { getSeminarBySlug } from "@/lib/seminars";

export async function POST(
  request: Request,
  context: RouteContext<"/api/s/[slug]/questions/[id]/vote">,
) {
  try {
    const { slug, id } = await context.params;
    const seminar = await getSeminarBySlug(slug);
    if (!seminar) return notFound("Seminar tidak ditemukan.");
    if (!seminar.allowUpvotes) return jsonError("Upvote dimatikan untuk seminar ini.", 409);

    const body = await readJsonBody(request);
    const voterId = asString(body.voterId).trim();
    if (!voterId) return badRequest("Sesi peserta tidak dikenali. Coba muat ulang halamannya.");

    const result = await toggleVote(seminar.id, id, voterId);
    if (!result.ok) return notFound("Pertanyaan tidak ditemukan.");

    return jsonOk({ voted: result.voted, upvoteCount: result.upvoteCount });
  } catch (error) {
    return serverError(error);
  }
}
