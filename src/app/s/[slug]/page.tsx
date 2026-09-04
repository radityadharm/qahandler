import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetupNotice } from "@/components/SetupNotice";
import { getBaseUrl } from "@/lib/base-url";
import { isDatabaseConfigured } from "@/lib/db";
import { buildPublicFeed } from "@/lib/feed";
import { getSeminarBySlug } from "@/lib/seminars";
import { ParticipantView } from "./ParticipantView";

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  if (!isDatabaseConfigured()) return { title: "Q&A Seminar" };

  const { slug } = await params;
  const seminar = await getSeminarBySlug(slug).catch(() => null);

  return {
    title: seminar ? `${seminar.title} · Q&A` : "Seminar tidak ditemukan",
    description: seminar?.description || "Kirim pertanyaanmu untuk sesi tanya jawab.",
  };
}

export default async function SeminarPage({ params }: PageProps<"/s/[slug]">) {
  if (!isDatabaseConfigured()) return <SetupNotice missing="database" />;

  const { slug } = await params;
  const seminar = await getSeminarBySlug(slug);
  if (!seminar) notFound();

  const [feed, baseUrl] = await Promise.all([buildPublicFeed(seminar), getBaseUrl()]);

  return (
    <ParticipantView initialFeed={feed} materialsUrl={`${baseUrl}/m/${seminar.slug}`} />
  );
}
