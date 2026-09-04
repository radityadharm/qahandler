import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/SetupNotice";
import { isDatabaseConfigured } from "@/lib/db";
import { getSeminarBySlug } from "@/lib/seminars";

export const metadata: Metadata = {
  title: "Materi seminar",
  robots: { index: false, follow: false },
};

// Tujuan redirect bisa berubah kapan saja, jadi jangan diprerender/di-cache.
export const dynamic = "force-dynamic";

export default async function MaterialsRedirectPage({ params }: PageProps<"/m/[slug]">) {
  if (!isDatabaseConfigured()) return <SetupNotice missing="database" />;

  const { slug } = await params;
  const seminar = await getSeminarBySlug(slug).catch(() => null);
  // redirect() melempar khusus, jadi dipanggil di luar blok try/catch.
  if (seminar?.materialsUrl) redirect(seminar.materialsUrl);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Materi belum tersedia</h1>
        <p className="mt-2 text-sm text-slate-600">
          Panitia belum menautkan materi untuk seminar ini. Coba lagi nanti ya.
        </p>
        <Link href={`/s/${slug}`} className="btn-primary mt-5">
          Ke halaman seminar
        </Link>
      </div>
    </main>
  );
}
