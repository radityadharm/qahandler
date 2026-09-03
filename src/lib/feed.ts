import "server-only";

import { getVisiblePublicQuestion, listAllQuestions, listPublicQuestions } from "@/lib/questions";
import {
  toPublicSeminar,
  type PublicQuestion,
  type PublicSeminar,
  type Question,
  type Seminar,
} from "@/lib/types";

export type PublicFeed = {
  seminar: PublicSeminar;
  questions: PublicQuestion[];
  spotlight: PublicQuestion | null;
};

/**
 * Dipakai bareng oleh halaman peserta (render awal di server) dan endpoint
 * polling, supaya bentuk datanya persis sama.
 */
export async function buildPublicFeed(seminar: Seminar): Promise<PublicFeed> {
  // Daftar pertanyaan mengikuti pengaturan seminar, tapi pertanyaan yang sengaja
  // disorot admin selalu ikut supaya layar presentasi tetap jalan.
  const questions: PublicQuestion[] = seminar.showQuestionsToParticipants
    ? await listPublicQuestions(seminar.id)
    : [];

  const spotlight: PublicQuestion | null = seminar.spotlightQuestionId
    ? await getVisiblePublicQuestion(seminar.id, seminar.spotlightQuestionId)
    : null;

  return { seminar: toPublicSeminar(seminar), questions, spotlight };
}

export type ModerationFeed = {
  seminar: Seminar;
  questions: Question[];
};

/** Dipanggil tiap beberapa detik oleh dashboard, jadi sengaja cuma satu query. */
export async function buildModerationFeed(seminar: Seminar): Promise<ModerationFeed> {
  return { seminar, questions: await listAllQuestions(seminar.id) };
}
