import type { Metadata } from "next";
import { SetupNotice } from "@/components/SetupNotice";
import { getBaseUrl } from "@/lib/base-url";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { listSeminarSummaries } from "@/lib/seminars";
import { AdminHome } from "./AdminHome";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Dashboard admin · QA Handler",
  robots: { index: false, follow: false },
};

// Isinya bergantung pada cookie sesi dan environment variable, jangan diprerender.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isDatabaseConfigured()) return <SetupNotice missing="database" />;
  if (!isAdminPasswordConfigured()) return <SetupNotice missing="password" />;
  if (!(await isAdminAuthenticated())) return <LoginForm />;

  const [seminars, baseUrl] = await Promise.all([listSeminarSummaries(), getBaseUrl()]);

  return <AdminHome seminars={seminars} baseUrl={baseUrl} />;
}
