import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-slate-600">
          Kode seminarnya mungkin salah ketik, atau seminarnya sudah dihapus panitia.
        </p>
        <Link href="/" className="btn-primary mt-5">
          Kembali ke halaman depan
        </Link>
      </div>
    </main>
  );
}
