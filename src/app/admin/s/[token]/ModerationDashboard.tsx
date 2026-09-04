"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { QrCode } from "@/components/QrCode";
import { HiddenBadge, SpotlightBadge, StatusBadge } from "@/components/StatusBadge";
import { TimeAgo } from "@/components/TimeAgo";
import { Toggle } from "@/components/Toggle";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { downloadSharePoster } from "@/lib/client/poster";
import { useInterval } from "@/lib/client/useInterval";
import type { ModerationFeed } from "@/lib/feed";
import type { Question, QuestionStatus, Seminar } from "@/lib/types";
import { normalizeHttpUrl } from "@/lib/url";

const POLL_INTERVAL_MS = 4000;

type SortMode = "recent" | "top";
type FilterKey = "all" | "new" | "held" | "answered" | "hidden";

const FILTERS: Array<{ key: FilterKey; label: string; match: (question: Question) => boolean }> = [
  { key: "all", label: "Semua", match: () => true },
  { key: "new", label: "Baru", match: (q) => q.isVisible && q.status === "new" },
  { key: "held", label: "Ditahan", match: (q) => q.isVisible && q.status === "held" },
  { key: "answered", label: "Dijawab", match: (q) => q.isVisible && q.status === "answered" },
  { key: "hidden", label: "Disembunyikan", match: (q) => !q.isVisible },
];

export function ModerationDashboard({
  token,
  initialFeed,
  participantUrl,
  materialsShareUrl,
}: {
  token: string;
  initialFeed: ModerationFeed;
  participantUrl: string;
  materialsShareUrl: string;
}) {
  const [feed, setFeed] = useState(initialFeed);
  const [sort, setSort] = useState<SortMode>("recent");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [error, setError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [downloadingPoster, setDownloadingPoster] = useState<"qa" | "materials" | null>(null);

  const { seminar, questions } = feed;

  async function downloadPoster(kind: "qa" | "materials") {
    setDownloadingPoster(kind);
    try {
      await downloadSharePoster(
        kind === "materials"
          ? {
              title: seminar.title,
              description: seminar.description,
              url: materialsShareUrl,
              kicker: "MATERI SEMINAR",
              linkLabel: "Scan QR atau buka materi:",
              fileName: `materi-${seminar.slug}.png`,
            }
          : {
              title: seminar.title,
              description: seminar.description,
              url: participantUrl,
              fileName: `qr-${seminar.slug}.png`,
            },
      );
      setError(null);
    } catch (posterError) {
      setError(errorMessage(posterError));
    } finally {
      setDownloadingPoster(null);
    }
  }

  const load = useCallback(async () => {
    try {
      setFeed(await apiFetch<ModerationFeed>(`/api/moderate/${token}`));
      setError(null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, [token]);

  useInterval(() => void load(), POLL_INTERVAL_MS);

  const patchSeminar = useCallback(
    async (patch: Partial<Seminar>) => {
      setFeed((current) => ({ ...current, seminar: { ...current.seminar, ...patch } }));
      try {
        const data = await apiFetch<{ seminar: Seminar }>(`/api/moderate/${token}`, {
          method: "PATCH",
          body: patch,
        });
        setFeed((current) => ({ ...current, seminar: data.seminar }));
        setError(null);
      } catch (patchError) {
        setError(errorMessage(patchError));
        await load();
      }
    },
    [token, load],
  );

  const patchQuestion = useCallback(
    async (id: string, patch: { status?: QuestionStatus; isVisible?: boolean }) => {
      try {
        const data = await apiFetch<{ question: Question }>(
          `/api/moderate/${token}/questions/${id}`,
          { method: "PATCH", body: patch },
        );
        setFeed((current) => ({
          ...current,
          seminar:
            !data.question.isVisible && current.seminar.spotlightQuestionId === id
              ? { ...current.seminar, spotlightQuestionId: null }
              : current.seminar,
          questions: current.questions.map((item) => (item.id === id ? data.question : item)),
        }));
        setError(null);
      } catch (updateError) {
        setError(errorMessage(updateError));
        await load();
      }
    },
    [token, load],
  );

  const removeQuestion = useCallback(
    async (id: string) => {
      if (!window.confirm("Hapus pertanyaan ini secara permanen?")) return;
      try {
        await apiFetch(`/api/moderate/${token}/questions/${id}`, { method: "DELETE" });
        setFeed((current) => ({
          ...current,
          questions: current.questions.filter((item) => item.id !== id),
        }));
        setError(null);
      } catch (deleteError) {
        setError(errorMessage(deleteError));
      }
    },
    [token],
  );

  const counts = useMemo(() => {
    const result = {} as Record<FilterKey, number>;
    for (const entry of FILTERS) result[entry.key] = questions.filter(entry.match).length;
    return result;
  }, [questions]);

  const visibleQuestions = useMemo(() => {
    const activeFilter = FILTERS.find((entry) => entry.key === filter) ?? FILTERS[0];
    const list = questions.filter(activeFilter.match);
    if (sort === "recent") return list;
    return list.sort(
      (a, b) =>
        b.upvoteCount - a.upvoteCount ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [questions, filter, sort]);

  const liveUrl = `${participantUrl}/live`;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-16">
      <header className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href="/admin" className="hint hover:text-slate-700">
              ← Semua seminar
            </Link>
            <h1 className="mt-1 text-xl font-bold text-slate-900">{seminar.title}</h1>
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
            {seminar.acceptingQuestions ? "Menerima pertanyaan" : "Ditutup"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a href={participantUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
            Halaman peserta
          </a>
          <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
            Layar presentasi
          </a>
          <CopyButton value={participantUrl} label="Salin link peserta" />
          <button
            type="button"
            onClick={() => setShowQr((value) => !value)}
            className="btn-secondary btn-sm"
          >
            {showQr ? "Sembunyikan QR" : "Tampilkan QR"}
          </button>
          <button
            type="button"
            onClick={() => void downloadPoster("qa")}
            disabled={downloadingPoster !== null}
            className="btn-primary btn-sm"
          >
            {downloadingPoster === "qa" ? "Menyiapkan..." : "Unduh gambar QR + link"}
          </button>
          <a href={`/api/moderate/${token}/export`} className="btn-secondary btn-sm ml-auto">
            Unduh CSV
          </a>
        </div>

        {showQr ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-slate-50 p-4">
            <QrCode value={participantUrl} size={200} className="rounded-lg bg-white p-2" />
            <p className="hint font-mono">{participantUrl}</p>
            <button
              type="button"
              onClick={() => void downloadPoster("qa")}
              disabled={downloadingPoster !== null}
              className="btn-secondary btn-sm"
            >
              {downloadingPoster === "qa" ? "Menyiapkan..." : "Unduh sebagai gambar (siap share WA)"}
            </button>
          </div>
        ) : null}

        <MaterialsPanel
          materialsUrl={seminar.materialsUrl}
          shareUrl={materialsShareUrl}
          downloading={downloadingPoster === "materials"}
          onSave={(url) => patchSeminar({ materialsUrl: url })}
          onDownloadPoster={() => void downloadPoster("materials")}
        />

        <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2">
          <Toggle
            checked={seminar.acceptingQuestions}
            onChange={(value) => void patchSeminar({ acceptingQuestions: value })}
            label="Terima pertanyaan baru"
            description="Matikan saat sesi tanya jawab selesai."
          />
          <Toggle
            checked={seminar.showQuestionsToParticipants}
            onChange={(value) => void patchSeminar({ showQuestionsToParticipants: value })}
            label="Peserta lihat daftar pertanyaan"
            description="Kalau dimatikan, peserta hanya bisa mengirim."
          />
          <Toggle
            checked={seminar.allowUpvotes}
            onChange={(value) => void patchSeminar({ allowUpvotes: value })}
            label="Upvote aktif"
            description="Peserta bisa mendukung pertanyaan orang lain."
          />
          <Toggle
            checked={seminar.moderationRequired}
            onChange={(value) => void patchSeminar({ moderationRequired: value })}
            label="Moderasi dulu"
            description="Pertanyaan baru disembunyikan sampai kamu loloskan."
          />
        </div>
      </header>

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setFilter(entry.key)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === entry.key
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              {entry.label}
              <span className="ml-1.5 opacity-70">{counts[entry.key]}</span>
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs font-medium">
          {(
            [
              ["recent", "Terbaru"],
              ["top", "Terpopuler"],
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

      <section className="mt-4">
        {visibleQuestions.length === 0 ? (
          <p className="card p-6 text-center text-sm text-slate-500">
            Tidak ada pertanyaan di kategori ini.
          </p>
        ) : (
          <ul className="space-y-3">
            {visibleQuestions.map((question) => (
              <QuestionRow
                key={question.id}
                question={question}
                isSpotlight={seminar.spotlightQuestionId === question.id}
                onPatch={(patch) => void patchQuestion(question.id, patch)}
                onSpotlight={(active) =>
                  void patchSeminar({ spotlightQuestionId: active ? question.id : null })
                }
                onDelete={() => void removeQuestion(question.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function QuestionRow({
  question,
  isSpotlight,
  onPatch,
  onSpotlight,
  onDelete,
}: {
  question: Question;
  isSpotlight: boolean;
  onPatch: (patch: { status?: QuestionStatus; isVisible?: boolean }) => void;
  onSpotlight: (active: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <li className={`card p-4 ${isSpotlight ? "ring-2 ring-indigo-500" : ""}`}>
      <p className="text-sm whitespace-pre-wrap text-slate-900">{question.body}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{question.authorName || "Anonim"}</span>
        <span aria-hidden>·</span>
        <TimeAgo iso={question.createdAt} />
        <span aria-hidden>·</span>
        <span>{question.upvoteCount} dukungan</span>
        <StatusBadge status={question.status} />
        {question.isVisible ? null : <HiddenBadge />}
        {isSpotlight ? <SpotlightBadge /> : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {question.status !== "answered" ? (
          <button
            type="button"
            onClick={() => onPatch({ status: "answered" })}
            className="btn-secondary btn-sm"
          >
            Tandai dijawab
          </button>
        ) : null}

        {question.status !== "held" ? (
          <button
            type="button"
            onClick={() => onPatch({ status: "held" })}
            className="btn-secondary btn-sm"
          >
            Tahan
          </button>
        ) : null}

        {question.status !== "new" ? (
          <button
            type="button"
            onClick={() => onPatch({ status: "new" })}
            className="btn-secondary btn-sm"
          >
            Kembalikan ke antrean
          </button>
        ) : null}

        {question.isVisible ? (
          <>
            <button
              type="button"
              onClick={() => onSpotlight(!isSpotlight)}
              className={isSpotlight ? "btn-secondary btn-sm" : "btn-primary btn-sm"}
            >
              {isSpotlight ? "Hentikan sorotan" : "Sorot di layar"}
            </button>
            <button
              type="button"
              onClick={() => onPatch({ isVisible: false })}
              className="btn-secondary btn-sm"
            >
              Sembunyikan
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onPatch({ isVisible: true })}
            className="btn-primary btn-sm"
          >
            Loloskan
          </button>
        )}

        <button type="button" onClick={onDelete} className="btn-danger btn-sm ml-auto">
          Hapus
        </button>
      </div>
    </li>
  );
}

function MaterialsPanel({
  materialsUrl,
  shareUrl,
  downloading,
  onSave,
  onDownloadPoster,
}: {
  materialsUrl: string | null;
  shareUrl: string;
  downloading: boolean;
  onSave: (url: string | null) => Promise<void>;
  onDownloadPoster: () => void;
}) {
  const [input, setInput] = useState(materialsUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const dirty = input.trim() !== (materialsUrl ?? "");

  async function save() {
    const trimmed = input.trim();
    const normalized = trimmed ? normalizeHttpUrl(trimmed) : null;
    if (trimmed && !normalized) {
      setLocalError("Link materi harus berupa URL yang valid, mis. https://drive.google.com/...");
      return;
    }

    setSaving(true);
    setLocalError(null);
    try {
      await onSave(normalized);
      if (normalized) setInput(normalized);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch {
      // Pesan error ditampilkan lewat banner di dashboard induk.
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    setInput("");
    setLocalError(null);
    setSaving(true);
    try {
      await onSave(null);
    } catch {
      // idem
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 border-t border-slate-200 pt-5">
      <h2 className="text-sm font-semibold text-slate-800">Materi seminar</h2>
      <p className="hint mt-0.5">
        Peserta membuka link pendek dari app ini yang otomatis diteruskan ke materimu. Link dan
        QR-nya tetap sama walau kamu ganti tautan materinya.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-[240px] flex-1">
          <label htmlFor="materials-url" className="label">
            Tautan materi (slide, Drive, PDF, dll.)
          </label>
          <input
            id="materials-url"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://drive.google.com/..."
            className="input"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="url"
          />
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !dirty}
          className="btn-primary btn-sm"
        >
          {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan"}
        </button>
        {materialsUrl ? (
          <button type="button" onClick={() => void clear()} disabled={saving} className="btn-danger btn-sm">
            Hapus
          </button>
        ) : null}
      </div>

      {localError ? <p className="mt-2 text-sm text-rose-600">{localError}</p> : null}

      {materialsUrl ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="hint">Link peserta untuk materi (dari app, aman dibagikan):</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-sm break-all text-indigo-600 hover:text-indigo-500"
            >
              {shareUrl.replace(/^https?:\/\//, "")}
            </a>
            <CopyButton value={shareUrl} label="Salin link materi" />
            <button
              type="button"
              onClick={() => setShowQr((value) => !value)}
              className="btn-secondary btn-sm"
            >
              {showQr ? "Sembunyikan QR" : "Tampilkan QR"}
            </button>
            <button
              type="button"
              onClick={onDownloadPoster}
              disabled={downloading}
              className="btn-primary btn-sm"
            >
              {downloading ? "Menyiapkan..." : "Unduh gambar QR materi"}
            </button>
          </div>

          {showQr ? (
            <div className="mt-4 flex flex-col items-center gap-2">
              <QrCode value={shareUrl} size={180} className="rounded-lg bg-white p-2" />
              <p className="hint break-all">Diteruskan ke: {materialsUrl}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
