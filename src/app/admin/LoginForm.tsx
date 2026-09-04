"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/Logo";
import { apiFetch, errorMessage } from "@/lib/client/api";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/admin/login", { method: "POST", body: { password } });
      router.refresh();
    } catch (loginError) {
      setError(errorMessage(loginError));
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark className="h-14 w-14" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">Dashboard admin</h1>
          <p className="mt-1 text-sm text-slate-600">
            Masukkan password panitia untuk melanjutkan.
          </p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          <div>
            <label htmlFor="password" className="label">
              Password admin
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input"
              autoComplete="current-password"
            />
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Memeriksa..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700">
            Kembali ke halaman depan
          </Link>
        </p>
      </div>
    </main>
  );
}
