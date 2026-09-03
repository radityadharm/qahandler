import Link from "next/link";
import { JoinForm } from "./JoinForm";

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="badge bg-indigo-100 text-indigo-700">Tanya jawab langsung</span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Q&amp;A Seminar</h1>
          <p className="mt-2 text-sm text-slate-600">
            Masukkan kode seminar dari panitia untuk mulai mengirim pertanyaan.
          </p>
        </div>

        <div className="card p-6">
          <JoinForm />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Panitia acara?{" "}
          <Link href="/admin" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Buka dashboard admin
          </Link>
        </p>
      </div>
    </main>
  );
}
