import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetupNotice } from "@/components/SetupNotice";
import { getBaseUrl } from "@/lib/base-url";
import { isDatabaseConfigured } from "@/lib/db";
import { buildPublicFeed } from "@/lib/feed";
import { getSeminarBySlug } from "@/lib/seminars";
import { LiveView } from "./LiveView";

export const metadata: Metadata = {
  title: "Layar presentasi · Q&A Seminar",
  robots: { index: false, follow: false },
};

export default async function LivePage({ params }: PageProps<"/s/[slug]/live">) {
  if (!isDatabaseConfigured()) return <SetupNotice missing="database" />;

  const { slug } = await params;
  const seminar = await getSeminarBySlug(slug);
  if (!seminar) notFound();

  const [feed, baseUrl] = await Promise.all([buildPublicFeed(seminar), getBaseUrl()]);

  return <LiveView initialFeed={feed} joinUrl={`${baseUrl}/s/${seminar.slug}`} />;
}
