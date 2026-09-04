-- Skema database Q&A Seminar.
-- Jalankan sekali di database Neon/Postgres kamu:
--   psql "$DATABASE_URL" -f db/schema.sql
-- atau tempel isinya ke SQL editor Neon.

create extension if not exists "pgcrypto";

create table if not exists seminars (
  id                              uuid primary key default gen_random_uuid(),
  slug                            text not null unique,
  title                           text not null,
  description                     text not null default '',
  admin_token                     text not null unique,
  accepting_questions             boolean not null default true,
  show_questions_to_participants  boolean not null default true,
  allow_upvotes                   boolean not null default true,
  moderation_required             boolean not null default false,
  spotlight_question_id           uuid,
  materials_url                   text,
  created_at                      timestamptz not null default now()
);

-- Migrasi untuk database yang tabelnya sudah terlanjur dibuat sebelum kolom ini ada.
alter table seminars add column if not exists materials_url text;

create table if not exists questions (
  id           uuid primary key default gen_random_uuid(),
  seminar_id   uuid not null references seminars(id) on delete cascade,
  author_name  text,
  author_key   text,
  body         text not null,
  status       text not null default 'new' check (status in ('new', 'answered', 'held')),
  is_visible   boolean not null default true,
  upvote_count integer not null default 0,
  created_at   timestamptz not null default now(),
  answered_at  timestamptz
);

create index if not exists questions_seminar_created_idx
  on questions (seminar_id, created_at desc);

create index if not exists questions_seminar_votes_idx
  on questions (seminar_id, upvote_count desc, created_at desc);

create index if not exists questions_author_key_idx
  on questions (seminar_id, author_key, created_at desc);

create table if not exists question_votes (
  question_id uuid not null references questions(id) on delete cascade,
  voter_id    text not null,
  created_at  timestamptz not null default now(),
  primary key (question_id, voter_id)
);

-- Dipasang terpisah supaya schema.sql tetap aman dijalankan ulang.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'seminars_spotlight_question_id_fkey'
  ) then
    alter table seminars
      add constraint seminars_spotlight_question_id_fkey
      foreign key (spotlight_question_id) references questions(id) on delete set null;
  end if;
end $$;
