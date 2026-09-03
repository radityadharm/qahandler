"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { normalizeSlug } from "@/lib/slug";

export function JoinForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const slug = normalizeSlug(code);
    if (!slug) {
      setError("Kode seminarnya belum diisi.");
      return;
    }
    setError(null);
    router.push(`/s/${slug}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="code" className="label">
          Kode seminar
        </label>
        <input
          id="code"
          name="code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="contoh: seminar-ai-2026"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="input"
        />
        {error ? <p className="mt-1.5 text-xs text-rose-600">{error}</p> : null}
      </div>

      <button type="submit" className="btn-primary w-full">
        Masuk ke sesi
      </button>

      <p className="hint text-center">
        Biasanya panitia membagikan link langsung, jadi kamu tidak perlu mengetik kode.
      </p>
    </form>
  );
}
