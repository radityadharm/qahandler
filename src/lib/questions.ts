import "server-only";

import { getSql } from "@/lib/db";
import {
  mapPublicQuestion,
  mapQuestion,
  type PublicQuestion,
  type Question,
  type QuestionStatus,
} from "@/lib/types";

export const MAX_BODY_LENGTH = 500;
export const MAX_NAME_LENGTH = 60;

/** Berapa pertanyaan boleh dikirim satu orang dalam satu menit. */
const SUBMIT_LIMIT_PER_MINUTE = 5;

/** Urutan default: terbaru dulu. Pengurutan lain dikerjakan di sisi klien. */
export async function listPublicQuestions(seminarId: string): Promise<PublicQuestion[]> {
  const sql = getSql();
  const rows = await sql`
    select * from questions
    where seminar_id = ${seminarId} and is_visible
    order by created_at desc
  `;
  return rows.map(mapPublicQuestion);
}

export async function listAllQuestions(seminarId: string): Promise<Question[]> {
  const sql = getSql();
  const rows = await sql`
    select * from questions
    where seminar_id = ${seminarId}
    order by created_at desc
  `;
  return rows.map(mapQuestion);
}

export type CreateQuestionInput = {
  seminarId: string;
  body: string;
  authorName?: string | null;
  authorKey: string;
  /** Kalau seminar pakai moderasi, pertanyaan disembunyikan sampai di-loloskan admin. */
  moderationRequired: boolean;
};

export type CreateQuestionResult =
  | { ok: true; question: Question }
  | { ok: false; reason: "rate_limited" };

export async function createQuestion(
  input: CreateQuestionInput,
): Promise<CreateQuestionResult> {
  const sql = getSql();

  const recent = await sql`
    select count(*)::int as count
    from questions
    where seminar_id = ${input.seminarId}
      and author_key = ${input.authorKey}
      and created_at > now() - interval '1 minute'
  `;
  if (Number(recent[0]?.count ?? 0) >= SUBMIT_LIMIT_PER_MINUTE) {
    return { ok: false, reason: "rate_limited" };
  }

  const name = (input.authorName ?? "").trim().slice(0, MAX_NAME_LENGTH);

  const rows = await sql`
    insert into questions (seminar_id, author_name, author_key, body, is_visible)
    values (
      ${input.seminarId},
      ${name || null},
      ${input.authorKey},
      ${input.body.trim().slice(0, MAX_BODY_LENGTH)},
      ${!input.moderationRequired}
    )
    returning *
  `;

  return { ok: true, question: mapQuestion(rows[0]) };
}

export type UpdateQuestionInput = {
  status?: QuestionStatus;
  isVisible?: boolean;
};

export async function updateQuestion(
  seminarId: string,
  questionId: string,
  patch: UpdateQuestionInput,
): Promise<Question | null> {
  const sql = getSql();
  const status = patch.status ?? null;

  const rows = await sql`
    update questions set
      status = coalesce(${status}::text, status),
      is_visible = coalesce(${patch.isVisible ?? null}::boolean, is_visible),
      answered_at = case
        when ${status}::text = 'answered' then coalesce(answered_at, now())
        when ${status}::text is null then answered_at
        else null
      end
    where id = ${questionId} and seminar_id = ${seminarId}
    returning *
  `;

  return rows[0] ? mapQuestion(rows[0]) : null;
}

export async function deleteQuestion(
  seminarId: string,
  questionId: string,
): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    delete from questions
    where id = ${questionId} and seminar_id = ${seminarId}
    returning id
  `;
  return rows.length > 0;
}

export type ToggleVoteResult =
  | { ok: true; voted: boolean; upvoteCount: number }
  | { ok: false; reason: "not_found" };

export async function toggleVote(
  seminarId: string,
  questionId: string,
  voterId: string,
): Promise<ToggleVoteResult> {
  const sql = getSql();

  const existing = await sql`
    select id from questions
    where id = ${questionId} and seminar_id = ${seminarId} and is_visible
    limit 1
  `;
  if (!existing[0]) return { ok: false, reason: "not_found" };

  const inserted = await sql`
    insert into question_votes (question_id, voter_id)
    values (${questionId}, ${voterId})
    on conflict (question_id, voter_id) do nothing
    returning question_id
  `;

  const voted = inserted.length > 0;
  if (!voted) {
    await sql`
      delete from question_votes
      where question_id = ${questionId} and voter_id = ${voterId}
    `;
  }

  // Hitung ulang dari tabel vote, bukan increment/decrement, supaya angkanya
  // tidak pernah melenceng kalau ada request bertabrakan.
  const updated = await sql`
    update questions q
    set upvote_count = (select count(*) from question_votes v where v.question_id = q.id)
    where q.id = ${questionId} and q.seminar_id = ${seminarId}
    returning upvote_count
  `;

  return { ok: true, voted, upvoteCount: Number(updated[0]?.upvote_count ?? 0) };
}

export async function clearSpotlightIfMatches(
  seminarId: string,
  questionId: string,
): Promise<void> {
  const sql = getSql();
  await sql`
    update seminars set spotlight_question_id = null
    where id = ${seminarId} and spotlight_question_id = ${questionId}
  `;
}

export async function getVisiblePublicQuestion(
  seminarId: string,
  questionId: string,
): Promise<PublicQuestion | null> {
  const sql = getSql();
  const rows = await sql`
    select * from questions
    where seminar_id = ${seminarId} and id = ${questionId} and is_visible
    limit 1
  `;
  return rows[0] ? mapPublicQuestion(rows[0]) : null;
}
