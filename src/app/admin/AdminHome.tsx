"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Logo } from "@/components/Logo";
import { Toggle } from "@/components/Toggle";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { formatDate } from "@/lib/client/format";
import { slugify } from "@/lib/slug";
import type { SeminarSummary } from "@/lib/types";

export function AdminHome({
  seminars,
  baseUrl,
}: {
  seminars: SeminarSummary[];
  baseUrl: string;
}) {
  const router = useRouter();

  async function logout() {
    await apiFetch("/api/admin/login", { method: "DELETE" }).catch(() => undefined);
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-16">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Logo markClassName="h-10 w-10" subtitle="Dashboard admin" />
        <button type="button" onClick={() => void logout()} className="btn-secondary btn-sm">
          Keluar
        </button>
      </header>

      <CreateSeminarForm onCreated={() => router.refresh()} />

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Seminar{" "}
          {seminars.length > 0 ? <span className="text-slate-500">({seminars.length})</span> : null}
        </h2>

        {seminars.length === 0 ? (
          <p className="card p-6 text-center text-sm text-slate-500">
            Belum ada seminar. Buat yang pertama lewat form di atas.
          </p>
        ) : (
          <ul className="space-y-3">
            {seminars.map((seminar) => (
              <SeminarCard
                key={seminar.id}
                seminar={seminar}
                baseUrl={baseUrl}
                onDeleted={() => router.refresh()}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function CreateSeminarForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [materialsUrl, setMaterialsUrl] = useState("");
  const [showQuestions, setShowQuestions] = useState(true);
  const [allowUpvotes, setAllowUpvotes] = useState(true);
  const [moderationRequired, setModerationRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewSlug = slugify(customSlug || title);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Judul seminar wajib diisi.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/admin/seminars", {
        method: "POST",
        body: {
          title: title.trim(),
          description: description.trim(),
          slug: customSlug.trim(),
          materialsUrl: materialsUrl.trim(),
          showQuestionsToParticipants: showQuestions,
          allowUpvotes,
          moderationRequired,
        },
      });
      setTitle("");
      setDescription("");
      setCustomSlug("");
      setMaterialsUrl("");
      onCreated();
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold text-slate-900">Buat seminar baru</h2>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="title" className="label">
              Judul seminar
            </label>
            <input
              id="title"
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Seminar Nasional AI 2026"
              className="input"
            />
          </div>

          <div>
            <label htmlFor="slug" className="label">
              Kode seminar <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <input
              id="slug"
              value={customSlug}
              onChange={(event) => setCustomSlug(event.target.value)}
              placeholder="otomatis dari judul"
              className="input"
              autoCapitalize="none"
              spellCheck={false}
            />
            {previewSlug ? <p className="hint mt-1.5">Link peserta: /s/{previewSlug}</p> : null}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="label">
            Deskripsi <span className="font-normal text-slate-400">(opsional)</span>
          </label>
          <input
            id="description"
            value={description}
            maxLength={500}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Sesi tanya jawab bersama Dr. Ani, 12 Maret 2026"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="materials" className="label">
            Link materi <span className="font-normal text-slate-400">(opsional)</span>
          </label>
          <input
            id="materials"
            value={materialsUrl}
            onChange={(event) => setMaterialsUrl(event.target.value)}
            placeholder="https://drive.google.com/... (bisa diisi/diganti nanti)"
            className="input"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="url"
          />
        </div>

        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
          <Toggle
            checked={showQuestions}
            onChange={setShowQuestions}
            label="Peserta lihat pertanyaan"
            description="Daftar pertanyaan tampil di halaman peserta."
          />
          <Toggle
            checked={allowUpvotes}
            onChange={setAllowUpvotes}
            label="Upvote aktif"
            description="Peserta bisa mendukung pertanyaan orang lain."
          />
          <Toggle
            checked={moderationRequired}
            onChange={setModerationRequired}
            label="Moderasi dulu"
            description="Pertanyaan baru tampil setelah diloloskan."
          />
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Membuat..." : "Buat seminar"}
        </button>
      </form>
    </section>
  );
}

function SeminarCard({
  seminar,
  baseUrl,
  onDeleted,
}: {
  seminar: SeminarSummary;
  baseUrl: string;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const participantUrl = `${baseUrl}/s/${seminar.slug}`;
  const liveUrl = `${participantUrl}/live`;

  async function remove() {
    const confirmed = window.confirm(
      `Hapus "${seminar.title}" beserta semua pertanyaannya? Tindakan ini tidak bisa dibatalkan.`,
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await apiFetch(`/api/admin/seminars/${seminar.id}`, { method: "DELETE" });
      onDeleted();
    } catch (error) {
      window.alert(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{seminar.title}</h3>
          <p className="hint mt-0.5">
            <code>/s/{seminar.slug}</code> · dibuat {formatDate(seminar.createdAt)}
          </p>
        </div>
        <span
          className={`badge ${
            seminar.acceptingQuestions
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {seminar.acceptingQuestions ? "Dibuka" : "Ditutup"}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
        {(
          [
            ["Total", seminar.stats.total],
            ["Baru", seminar.stats.new],
            ["Dijawab", seminar.stats.answered],
            ["Ditahan", seminar.stats.held],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-50 py-2">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="text-base font-semibold text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={`/admin/s/${seminar.adminToken}`} className="btn-primary btn-sm">
          Buka moderasi
        </Link>
        <a href={participantUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
          Halaman peserta
        </a>
        <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
          Layar presentasi
        </a>
        <CopyButton value={participantUrl} label="Salin link peserta" />
        <button
          type="button"
          onClick={() => void remove()}
          disabled={busy}
          className="btn-danger btn-sm ml-auto"
        >
          Hapus
        </button>
      </div>
    </li>
  );
}
