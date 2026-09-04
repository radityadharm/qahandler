"use client";

import { useCallback, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { TimeAgo } from "@/components/TimeAgo";
import { apiFetch, errorMessage } from "@/lib/client/api";
import {
  ensureVoterId,
  rememberMyQuestion,
  saveName,
  setVoted,
  useMyQuestionIds,
  useSavedName,
  useVotedQuestionIds,
} from "@/lib/client/session";
import { useInterval } from "@/lib/client/useInterval";
import { QrCode } from "@/components/QrCode";
import type { PublicFeed } from "@/lib/feed";
import type { PublicQuestion } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;
const MAX_BODY_LENGTH = 2000;
const MAX_NAME_LENGTH = 60;

type SortMode = "recent" | "top";

export function ParticipantView({
  initialFeed,
  materialsUrl,
}: {
  initialFeed: PublicFeed;
  materialsUrl: string;
}) {
  const slug = initialFeed.seminar.slug;

  const [feed, setFeed] = useState(initialFeed);
  const [sort, setSort] = useState<SortMode>("top");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showMaterialsQr, setShowMaterialsQr] = useState(false);

  const [typedName, setTypedName] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);

  const savedName = useSavedName();
  const name = typedName ?? savedName;
  const votedIds = useVotedQuestionIds(slug);
  const myQuestionIds = useMyQuestionIds(slug);

  const { seminar, questions, spotlight } = feed;

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<PublicFeed>(`/api/s/${slug}/questions`);
      setFeed(data);
      setLoadError(null);
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, [slug]);

  useInterval(() => void load(), POLL_INTERVAL_MS);

  const sortedQuestions = useMemo(() => {
    if (sort === "recent") return questions;
    return [...questions].sort(
      (a, b) =>
        b.upvoteCount - a.upvoteCount ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [questions, sort]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      setSubmitError("Pertanyaannya belum diisi.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitNotice(null);

    try {
      const data = await apiFetch<{ question: PublicQuestion; moderated: boolean }>(
        `/api/s/${slug}/questions`,
        { method: "POST", body: { body: trimmed, authorName: name.trim(), voterId: ensureVoterId() } },
      );

      setBody("");
      saveName(name.trim());
      setTypedName(null);
      rememberMyQuestion(slug, data.question.id);
      setSubmitNotice(
        data.moderated
          ? "Pertanyaan terkirim. Akan tampil setelah dicek moderator."
          : "Pertanyaan terkirim. Terima kasih!",
      );
      await load();
    } catch (error) {
      setSubmitError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleVote(question: PublicQuestion) {
    if (!seminar.allowUpvotes) return;

    const wasVoted = votedIds.has(question.id);

    // Optimistis dulu supaya terasa responsif; nanti dikoreksi oleh jawaban server.
    setVoted(slug, question.id, !wasVoted);
    setFeed((current) => ({
      ...current,
      questions: current.questions.map((item) =>
        item.id === question.id
          ? { ...item, upvoteCount: Math.max(0, item.upvoteCount + (wasVoted ? -1 : 1)) }
          : item,
      ),
    }));

    try {
      const result = await apiFetch<{ voted: boolean; upvoteCount: number }>(
        `/api/s/${slug}/questions/${question.id}/vote`,
        { method: "POST", body: { voterId: ensureVoterId() } },
      );
      setVoted(slug, question.id, result.voted);
      setFeed((current) => ({
        ...current,
        questions: current.questions.map((item) =>
          item.id === question.id ? { ...item, upvoteCount: result.upvoteCount } : item,
        ),
      }));
    } catch {
      setVoted(slug, question.id, wasVoted);
      await load();
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6 pb-16">
      <header className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{seminar.title}</h1>
            {seminar.description ? (
              <p className="mt-1 text-sm text-slate-600">{seminar.description}</p>
            ) : null}
          </div>
          <span
            className={`badge ${
              seminar.acceptingQuestions
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {seminar.acceptingQuestions ? "Sesi dibuka" : "Sesi ditutup"}
          </span>
        </div>
      </header>

      {spotlight ? (
        <section className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-xs font-semibold tracking-wide text-indigo-700 uppercase">
            Sedang dibahas
          </p>
          <p className="mt-2 text-base font-medium whitespace-pre-wrap text-slate-900">
            {spotlight.body}
          </p>
          <p className="mt-2 text-xs text-indigo-700">
            {spotlight.authorName ? `oleh ${spotlight.authorName}` : "oleh peserta anonim"}
          </p>
        </section>
      ) : null}

      {seminar.hasMaterials ? (
        <section className="card mt-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900">Materi seminar</h2>
              <p className="hint mt-0.5">Slide/dokumen dari pembicara.</p>
            </div>
            <div className="flex items-center gap-2">
              <a href={materialsUrl} target="_blank" rel="noreferrer" className="btn-primary btn-sm">
                Buka materi
              </a>
              <button
                type="button"
                onClick={() => setShowMaterialsQr((value) => !value)}
                className="btn-secondary btn-sm"
              >
                {showMaterialsQr ? "Tutup QR" : "QR"}
              </button>
            </div>
          </div>

          {showMaterialsQr ? (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-slate-50 p-4">
              <QrCode value={materialsUrl} size={168} className="rounded-lg bg-white p-2" />
              <p className="hint">Scan untuk buka materi di perangkat lain.</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {seminar.acceptingQuestions ? (
        <section className="card mt-4 p-5">
          <h2 className="text-base font-semibold text-slate-900">Tulis pertanyaan</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Nama <span className="font-normal text-slate-400">(opsional)</span>
              </label>
              <input
                id="name"
                value={name}
                maxLength={MAX_NAME_LENGTH}
                onChange={(event) => setTypedName(event.target.value)}
                placeholder="Kosongkan kalau mau anonim"
                className="input"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="body" className="label">
                Pertanyaan
              </label>
              <textarea
                id="body"
                value={body}
                rows={4}
                maxLength={MAX_BODY_LENGTH}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Tulis pertanyaanmu di sini..."
                className="input resize-y"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="hint">
                  {body.length}/{MAX_BODY_LENGTH} karakter
                </span>
                {seminar.moderationRequired ? (
                  <span className="hint">Pertanyaan dicek moderator dulu</span>
                ) : null}
              </div>
            </div>

            {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}
            {submitNotice ? <p className="text-sm text-emerald-600">{submitNotice}</p> : null}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Mengirim..." : "Kirim pertanyaan"}
            </button>
          </form>
        </section>
      ) : (
        <section className="card mt-4 p-5 text-sm text-slate-600">
          Sesi tanya jawab untuk seminar ini sedang ditutup panitia.
        </section>
      )}

      <section className="mt-8">
        {!seminar.showQuestionsToParticipants ? (
          <p className="card p-5 text-sm text-slate-600">
            Panitia menyembunyikan daftar pertanyaan. Pertanyaanmu tetap masuk ke moderator.
          </p>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Pertanyaan masuk
                {questions.length > 0 ? (
                  <span className="ml-2 text-sm font-normal text-slate-500">{questions.length}</span>
                ) : null}
              </h2>

              <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs font-medium">
                {(
                  [
                    ["top", "Terpopuler"],
                    ["recent", "Terbaru"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSort(mode)}
                    className={`cursor-pointer rounded-md px-3 py-1.5 transition-colors ${
                      sort === mode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loadError ? <p className="card mb-3 p-4 text-sm text-rose-600">{loadError}</p> : null}

            {sortedQuestions.length === 0 ? (
              <p className="card p-6 text-center text-sm text-slate-500">
                Belum ada pertanyaan. Jadilah yang pertama!
              </p>
            ) : (
              <ul className="space-y-3">
                {sortedQuestions.map((question) => (
                  <li key={question.id} className="card p-4">
                    <div className="flex gap-3">
                      {seminar.allowUpvotes ? (
                        <button
                          type="button"
                          onClick={() => void toggleVote(question)}
                          aria-pressed={votedIds.has(question.id)}
                          aria-label={
                            votedIds.has(question.id)
                              ? "Batalkan dukungan"
                              : "Dukung pertanyaan ini"
                          }
                          className={`flex h-14 w-12 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border transition-colors ${
                            votedIds.has(question.id)
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
                          }`}
                        >
                          <span aria-hidden className="text-xs leading-none">
                            ▲
                          </span>
                          <span className="mt-1 text-sm leading-none font-semibold">
                            {question.upvoteCount}
                          </span>
                        </button>
                      ) : null}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm whitespace-pre-wrap text-slate-900">{question.body}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                          <span>{question.authorName || "Anonim"}</span>
                          <span aria-hidden>·</span>
                          <TimeAgo iso={question.createdAt} />
                          {myQuestionIds.has(question.id) ? (
                            <span className="badge bg-slate-100 text-slate-600">Pertanyaanmu</span>
                          ) : null}
                          {question.status !== "new" ? (
                            <StatusBadge status={question.status} />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </main>
  );
}
