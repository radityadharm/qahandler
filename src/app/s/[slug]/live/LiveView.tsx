"use client";

import { useCallback, useState } from "react";
import { QrCode } from "@/components/QrCode";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { useInterval } from "@/lib/client/useInterval";
import type { PublicFeed } from "@/lib/feed";

const POLL_INTERVAL_MS = 4000;
const QUEUE_LIMIT = 5;

export function LiveView({
  initialFeed,
  joinUrl,
}: {
  initialFeed: PublicFeed;
  joinUrl: string;
}) {
  const slug = initialFeed.seminar.slug;

  const [feed, setFeed] = useState(initialFeed);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setFeed(await apiFetch<PublicFeed>(`/api/s/${slug}/questions`));
      setError(null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, [slug]);

  useInterval(() => void load(), POLL_INTERVAL_MS);

  const { seminar, questions, spotlight } = feed;

  const queue = [...questions]
    .filter((question) => question.status === "new" && question.id !== spotlight?.id)
    .sort(
      (a, b) =>
        b.upvoteCount - a.upvoteCount ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, QUEUE_LIMIT);

  return (
    <div className="projector flex min-h-screen flex-1 flex-col bg-slate-950 text-white">
      <header className="flex items-start justify-between gap-6 border-b border-white/10 px-8 py-6">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold lg:text-3xl">{seminar.title}</h1>
          {seminar.description ? (
            <p className="mt-1 truncate text-sm text-slate-400 lg:text-base">
              {seminar.description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <div className="hidden text-right sm:block">
            <p className="text-xs tracking-wide text-slate-400 uppercase">Kirim pertanyaan di</p>
            <p className="max-w-xs truncate font-mono text-sm text-indigo-300 lg:text-base">
              {joinUrl.replace(/^https?:\/\//, "")}
            </p>
          </div>
          <QrCode value={joinUrl} size={96} className="rounded-lg bg-white p-1" />
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center px-8 py-10">
        {error ? (
          <p className="text-center text-lg text-rose-300">{error}</p>
        ) : spotlight ? (
          <div className="mx-auto w-full max-w-5xl text-center">
            <p className="text-sm font-semibold tracking-[0.2em] text-indigo-400 uppercase">
              Sedang dibahas
            </p>
            <p className="mt-8 text-3xl leading-snug font-semibold text-balance whitespace-pre-wrap sm:text-4xl lg:text-6xl">
              {spotlight.body}
            </p>
            <p className="mt-8 text-lg text-slate-400 lg:text-2xl">
              {spotlight.authorName || "Peserta anonim"}
            </p>
          </div>
        ) : queue.length > 0 ? (
          <div className="mx-auto w-full max-w-5xl">
            <p className="text-sm font-semibold tracking-[0.2em] text-indigo-400 uppercase">
              Antrean pertanyaan
            </p>
            <ol className="mt-6 space-y-5">
              {queue.map((question, index) => (
                <li key={question.id} className="flex gap-5">
                  <span className="w-10 shrink-0 text-right text-2xl font-bold text-slate-600 lg:text-3xl">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl leading-snug whitespace-pre-wrap lg:text-3xl">
                      {question.body}
                    </p>
                    <p className="mt-1.5 text-sm text-slate-400 lg:text-base">
                      {question.authorName || "Anonim"}
                      {seminar.allowUpvotes && question.upvoteCount > 0
                        ? ` · ${question.upvoteCount} dukungan`
                        : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-2xl font-semibold text-slate-300 lg:text-4xl">Belum ada pertanyaan</p>
            <p className="mt-4 text-base text-slate-500 lg:text-xl">
              Scan kode QR di pojok kanan atas untuk mengirim pertanyaan.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 px-8 py-3 text-center text-xs text-slate-500">
        Layar ini memperbarui sendiri setiap beberapa detik.
      </footer>
    </div>
  );
}
