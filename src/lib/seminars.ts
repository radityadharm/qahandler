import "server-only";

import { getSql } from "@/lib/db";
import { randomCode, randomToken } from "@/lib/ids";
import { slugify } from "@/lib/slug";
import { mapSeminar, type Seminar, type SeminarStats, type SeminarSummary } from "@/lib/types";

export async function getSeminarBySlug(slug: string): Promise<Seminar | null> {
  const sql = getSql();
  const rows = await sql`select * from seminars where slug = ${slug} limit 1`;
  return rows[0] ? mapSeminar(rows[0]) : null;
}

export async function getSeminarByAdminToken(token: string): Promise<Seminar | null> {
  const sql = getSql();
  const rows = await sql`select * from seminars where admin_token = ${token} limit 1`;
  return rows[0] ? mapSeminar(rows[0]) : null;
}

export type CreateSeminarInput = {
  title: string;
  description?: string;
  slug?: string;
  showQuestionsToParticipants?: boolean;
  allowUpvotes?: boolean;
  moderationRequired?: boolean;
  materialsUrl?: string | null;
};

export async function createSeminar(input: CreateSeminarInput): Promise<Seminar> {
  const sql = getSql();
  const base = slugify(input.slug || input.title) || "seminar";
  const adminToken = randomToken();

  // Slug harus unik. Percobaan pertama pakai slug apa adanya, sisanya diberi akhiran acak.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${randomCode(4)}`;
    const rows = await sql`
      insert into seminars (
        slug, title, description, admin_token,
        show_questions_to_participants, allow_upvotes, moderation_required, materials_url
      )
      values (
        ${slug},
        ${input.title.trim()},
        ${(input.description ?? "").trim()},
        ${adminToken},
        ${input.showQuestionsToParticipants ?? true},
        ${input.allowUpvotes ?? true},
        ${input.moderationRequired ?? false},
        ${input.materialsUrl ?? null}
      )
      on conflict (slug) do nothing
      returning *
    `;
    if (rows[0]) return mapSeminar(rows[0]);
  }

  throw new Error("Gagal membuat slug unik untuk seminar ini. Coba ganti judul atau kode seminarnya.");
}

export type UpdateSeminarInput = {
  title?: string;
  description?: string;
  acceptingQuestions?: boolean;
  showQuestionsToParticipants?: boolean;
  allowUpvotes?: boolean;
  moderationRequired?: boolean;
  /** `null` mematikan sorotan di layar presentasi. */
  spotlightQuestionId?: string | null;
  /** Absen = tidak diubah, `null` = kosongkan, string = pasang link materi. */
  materialsUrl?: string | null;
};

export async function updateSeminar(
  id: string,
  patch: UpdateSeminarInput,
): Promise<Seminar | null> {
  const sql = getSql();
  const clearSpotlight = patch.spotlightQuestionId === null;
  const setMaterials = patch.materialsUrl !== undefined;

  const rows = await sql`
    update seminars set
      title = coalesce(${patch.title ?? null}::text, title),
      description = coalesce(${patch.description ?? null}::text, description),
      accepting_questions = coalesce(${patch.acceptingQuestions ?? null}::boolean, accepting_questions),
      show_questions_to_participants = coalesce(
        ${patch.showQuestionsToParticipants ?? null}::boolean, show_questions_to_participants
      ),
      allow_upvotes = coalesce(${patch.allowUpvotes ?? null}::boolean, allow_upvotes),
      moderation_required = coalesce(${patch.moderationRequired ?? null}::boolean, moderation_required),
      spotlight_question_id = case
        when ${clearSpotlight}::boolean then null
        else coalesce(${patch.spotlightQuestionId ?? null}::uuid, spotlight_question_id)
      end,
      materials_url = case
        when ${setMaterials}::boolean then ${patch.materialsUrl ?? null}::text
        else materials_url
      end
    where id = ${id}
    returning *
  `;

  return rows[0] ? mapSeminar(rows[0]) : null;
}

export async function deleteSeminar(id: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`delete from seminars where id = ${id} returning id`;
  return rows.length > 0;
}

export async function listSeminarSummaries(): Promise<SeminarSummary[]> {
  const sql = getSql();
  const rows = await sql`
    select
      s.*,
      count(q.id)::int as total,
      count(q.id) filter (where q.status = 'new' and q.is_visible)::int as count_new,
      count(q.id) filter (where q.status = 'answered')::int as count_answered,
      count(q.id) filter (where q.status = 'held')::int as count_held,
      count(q.id) filter (where not q.is_visible)::int as count_hidden
    from seminars s
    left join questions q on q.seminar_id = s.id
    group by s.id
    order by s.created_at desc
  `;

  return rows.map((row) => {
    const stats: SeminarStats = {
      total: Number(row.total ?? 0),
      new: Number(row.count_new ?? 0),
      answered: Number(row.count_answered ?? 0),
      held: Number(row.count_held ?? 0),
      hidden: Number(row.count_hidden ?? 0),
    };
    return { ...mapSeminar(row), stats };
  });
}

export async function getSeminarStats(seminarId: string): Promise<SeminarStats> {
  const sql = getSql();
  const rows = await sql`
    select
      count(*)::int as total,
      count(*) filter (where status = 'new' and is_visible)::int as count_new,
      count(*) filter (where status = 'answered')::int as count_answered,
      count(*) filter (where status = 'held')::int as count_held,
      count(*) filter (where not is_visible)::int as count_hidden
    from questions
    where seminar_id = ${seminarId}
  `;
  const row = rows[0] ?? {};
  return {
    total: Number(row.total ?? 0),
    new: Number(row.count_new ?? 0),
    answered: Number(row.count_answered ?? 0),
    held: Number(row.count_held ?? 0),
    hidden: Number(row.count_hidden ?? 0),
  };
}
