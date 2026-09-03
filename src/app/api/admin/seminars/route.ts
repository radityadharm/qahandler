import {
  asOptionalBoolean,
  asString,
  badRequest,
  jsonOk,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";
import { isAdminAuthenticated } from "@/lib/auth";
import { createSeminar, listSeminarSummaries } from "@/lib/seminars";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) return unauthorized();
    return jsonOk({ seminars: await listSeminarSummaries() });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) return unauthorized();

    const body = await readJsonBody(request);
    const title = asString(body.title).trim();
    if (!title) return badRequest("Judul seminar wajib diisi.");
    if (title.length > 120) return badRequest("Judul seminar maksimal 120 karakter.");

    const seminar = await createSeminar({
      title,
      description: asString(body.description).trim().slice(0, 500),
      slug: asString(body.slug).trim(),
      showQuestionsToParticipants: asOptionalBoolean(body.showQuestionsToParticipants),
      allowUpvotes: asOptionalBoolean(body.allowUpvotes),
      moderationRequired: asOptionalBoolean(body.moderationRequired),
    });

    return jsonOk({ seminar }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
