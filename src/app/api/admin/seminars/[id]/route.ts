import { jsonOk, notFound, serverError, unauthorized } from "@/lib/api";
import { isAdminAuthenticated } from "@/lib/auth";
import { deleteSeminar } from "@/lib/seminars";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/seminars/[id]">,
) {
  try {
    if (!(await isAdminAuthenticated())) return unauthorized();
    const { id } = await context.params;
    const deleted = await deleteSeminar(id);
    if (!deleted) return notFound("Seminar tidak ditemukan.");
    return jsonOk({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
