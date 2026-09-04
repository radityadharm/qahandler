import Link from "next/link";
import { LogoFull } from "@/components/Logo";
import { JoinForm } from "./JoinForm";

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="sr-only">QA Handler</h1>
          <LogoFull className="h-36 w-auto" />
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
