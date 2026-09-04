export const QUESTION_STATUSES = ["new", "answered", "held"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export function isQuestionStatus(value: unknown): value is QuestionStatus {
  return typeof value === "string" && (QUESTION_STATUSES as readonly string[]).includes(value);
}

export type Seminar = {
  id: string;
  slug: string;
  title: string;
  description: string;
  adminToken: string;
  acceptingQuestions: boolean;
  showQuestionsToParticipants: boolean;
  allowUpvotes: boolean;
  moderationRequired: boolean;
  spotlightQuestionId: string | null;
  /** Link materi (slide/dokumen) tujuan redirect /m/<slug>. Null kalau belum diisi. */
  materialsUrl: string | null;
  createdAt: string;
};

/**
 * Bentuk seminar yang aman dikirim ke peserta: tanpa admin_token, dan URL materi
 * mentah diganti penanda `hasMaterials` (peserta cukup lewat redirect /m/<slug>).
 */
export type PublicSeminar = Omit<Seminar, "adminToken" | "materialsUrl"> & {
  hasMaterials: boolean;
};

export type Question = {
  id: string;
  seminarId: string;
  authorName: string | null;
  body: string;
  status: QuestionStatus;
  isVisible: boolean;
  upvoteCount: number;
  createdAt: string;
  answeredAt: string | null;
};

/** Pertanyaan sebagaimana dilihat peserta: tanpa data internal moderasi. */
export type PublicQuestion = Omit<Question, "seminarId" | "isVisible">;

export type SeminarStats = {
  total: number;
  new: number;
  answered: number;
  held: number;
  hidden: number;
};

/** Ringkasan untuk dashboard admin (terautentikasi), jadi boleh bawa data penuh. */
export type SeminarSummary = Seminar & {
  stats: SeminarStats;
};

type Row = Record<string, unknown>;

export function mapSeminar(row: Row): Seminar {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description ?? ""),
    adminToken: String(row.admin_token),
    acceptingQuestions: Boolean(row.accepting_questions),
    showQuestionsToParticipants: Boolean(row.show_questions_to_participants),
    allowUpvotes: Boolean(row.allow_upvotes),
    moderationRequired: Boolean(row.moderation_required),
    spotlightQuestionId: row.spotlight_question_id ? String(row.spotlight_question_id) : null,
    materialsUrl: row.materials_url ? String(row.materials_url) : null,
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

export function toPublicSeminar(seminar: Seminar): PublicSeminar {
  const { adminToken: _adminToken, materialsUrl, ...rest } = seminar;
  void _adminToken;
  return { ...rest, hasMaterials: Boolean(materialsUrl) };
}

export function mapQuestion(row: Row): Question {
  return {
    id: String(row.id),
    seminarId: String(row.seminar_id),
    authorName: row.author_name ? String(row.author_name) : null,
    body: String(row.body),
    status: (isQuestionStatus(row.status) ? row.status : "new") as QuestionStatus,
    isVisible: Boolean(row.is_visible),
    upvoteCount: Number(row.upvote_count ?? 0),
    createdAt: new Date(row.created_at as string).toISOString(),
    answeredAt: row.answered_at ? new Date(row.answered_at as string).toISOString() : null,
  };
}

export function toPublicQuestion(question: Question): PublicQuestion {
  return {
    id: question.id,
    authorName: question.authorName,
    body: question.body,
    status: question.status,
    upvoteCount: question.upvoteCount,
    createdAt: question.createdAt,
    answeredAt: question.answeredAt,
  };
}

export function mapPublicQuestion(row: Row): PublicQuestion {
  return toPublicQuestion(mapQuestion(row));
}
