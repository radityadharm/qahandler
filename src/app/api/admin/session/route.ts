import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/auth";
import { jsonOk, serverError } from "@/lib/api";

export async function GET() {
  try {
    return jsonOk({
      authenticated: await isAdminAuthenticated(),
      passwordConfigured: isAdminPasswordConfigured(),
    });
  } catch (error) {
    return serverError(error);
  }
}
