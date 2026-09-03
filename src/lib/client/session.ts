"use client";

import { useMemo } from "react";
import { readLocalStorage, useStoredValue, writeLocalStorage } from "@/lib/client/useLocalStorage";

const VOTER_KEY = "qa:voter-id";
const NAME_KEY = "qa:display-name";

const votesKey = (slug: string) => `qa:votes:${slug}`;
const myQuestionsKey = (slug: string) => `qa:my-questions:${slug}`;

let fallbackVoterId: string | null = null;

/**
 * ID acak per browser untuk mencegah vote ganda dan membatasi spam.
 * Dibuat saat pertama kali dibutuhkan — dipanggil dari event handler, bukan saat render.
 */
export function ensureVoterId(): string {
  const existing = readLocalStorage(VOTER_KEY);
  if (existing) return existing;

  fallbackVoterId ??= crypto.randomUUID();
  writeLocalStorage(VOTER_KEY, fallbackVoterId);
  return fallbackVoterId;
}

export function useSavedName(): string {
  return useStoredValue(NAME_KEY) ?? "";
}

export function saveName(name: string): void {
  writeLocalStorage(NAME_KEY, name);
}

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function useIdSet(key: string): ReadonlySet<string> {
  const raw = useStoredValue(key);
  return useMemo(() => new Set(parseIds(raw)), [raw]);
}

/** Pertanyaan yang sudah didukung dari browser ini. */
export function useVotedQuestionIds(slug: string): ReadonlySet<string> {
  return useIdSet(votesKey(slug));
}

export function setVoted(slug: string, questionId: string, voted: boolean): void {
  const key = votesKey(slug);
  const ids = new Set(parseIds(readLocalStorage(key)));
  if (voted) ids.add(questionId);
  else ids.delete(questionId);
  writeLocalStorage(key, JSON.stringify([...ids]));
}

/** Pertanyaan yang dikirim dari browser ini, untuk label "Pertanyaanmu". */
export function useMyQuestionIds(slug: string): ReadonlySet<string> {
  return useIdSet(myQuestionsKey(slug));
}

export function rememberMyQuestion(slug: string, questionId: string): void {
  const key = myQuestionsKey(slug);
  const ids = new Set(parseIds(readLocalStorage(key)));
  ids.add(questionId);
  writeLocalStorage(key, JSON.stringify([...ids]));
}
