export function SetupNotice({ missing }: { missing: "database" | "password" }) {
  const isDatabase = missing === "database";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <div className="card p-6">
        <h1 className="text-lg font-semibold text-slate-900">
          {isDatabase ? "Database belum terhubung" : "Password admin belum diset"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isDatabase
            ? "Aplikasi butuh environment variable DATABASE_URL yang menunjuk ke Postgres (Neon)."
            : "Aplikasi butuh environment variable ADMIN_PASSWORD untuk membuka dashboard panitia."}
        </p>

        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium">Langkah singkat:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {isDatabase ? (
              <>
                <li>Buka proyek di Vercel → tab <strong>Storage</strong> → tambahkan <strong>Neon</strong>.</li>
                <li>
                  Jalankan isi <code className="rounded bg-white px-1 py-0.5">db/schema.sql</code> di SQL editor
                  Neon untuk membuat tabelnya.
                </li>
                <li>Deploy ulang supaya environment variable-nya kebaca.</li>
              </>
            ) : (
              <>
                <li>
                  Vercel → <strong>Settings</strong> → <strong>Environment Variables</strong> → tambahkan{" "}
                  <code className="rounded bg-white px-1 py-0.5">ADMIN_PASSWORD</code>.
                </li>
                <li>
                  Tambahkan juga <code className="rounded bg-white px-1 py-0.5">AUTH_SECRET</code> berisi string acak
                  yang panjang.
                </li>
                <li>Deploy ulang.</li>
              </>
            )}
          </ol>
          <p className="mt-3 text-xs text-slate-500">
            Untuk development lokal, isi nilai-nilai itu di file <code>.env.local</code>. Lihat{" "}
            <code>.env.example</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
