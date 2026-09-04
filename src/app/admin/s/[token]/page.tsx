import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetupNotice } from "@/components/SetupNotice";
import { getBaseUrl } from "@/lib/base-url";
import { isDatabaseConfigured } from "@/lib/db";
import { buildModerationFeed } from "@/lib/feed";
import { getSeminarByAdminToken } from "@/lib/seminars";
import { ModerationDashboard } from "./ModerationDashboard";

export const metadata: Metadata = {
  title: "Moderasi · QA Handler",
  robots: { index: false, follow: false },
};

export default async function ModerationPage({ params }: PageProps<"/admin/s/[token]">) {
  if (!isDatabaseConfigured()) return <SetupNotice missing="database" />;

  const { token } = await params;
  const seminar = await getSeminarByAdminToken(token);
  if (!seminar) notFound();

  const [feed, baseUrl] = await Promise.all([buildModerationFeed(seminar), getBaseUrl()]);

  return (
    <ModerationDashboard
      token={token}
      initialFeed={feed}
      participantUrl={`${baseUrl}/s/${seminar.slug}`}
      materialsShareUrl={`${baseUrl}/m/${seminar.slug}`}
    />
  );
}
