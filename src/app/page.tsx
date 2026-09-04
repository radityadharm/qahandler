import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { JoinForm } from "./JoinForm";

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="h-20 w-20" />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">QA Handler</h1>
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
