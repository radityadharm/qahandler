import type { QuestionStatus } from "@/lib/types";

const STATUS_STYLES: Record<QuestionStatus, { label: string; className: string }> = {
  new: { label: "Belum dijawab", className: "bg-slate-100 text-slate-600" },
  answered: { label: "Sudah dijawab", className: "bg-emerald-100 text-emerald-700" },
  held: { label: "Ditahan", className: "bg-amber-100 text-amber-700" },
};

export function StatusBadge({ status }: { status: QuestionStatus }) {
  const style = STATUS_STYLES[status];
  return <span className={`badge ${style.className}`}>{style.label}</span>;
}

export function HiddenBadge() {
  return <span className="badge bg-rose-100 text-rose-700">Disembunyikan</span>;
}

export function SpotlightBadge() {
  return <span className="badge bg-indigo-100 text-indigo-700">Tampil di layar</span>;
}
