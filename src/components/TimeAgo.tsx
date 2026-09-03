"use client";

import { formatRelativeTime } from "@/lib/client/format";
import { useNow } from "@/lib/client/useNow";

export function TimeAgo({ iso }: { iso: string }) {
  const now = useNow();
  return <time dateTime={iso}>{now === null ? "" : formatRelativeTime(iso, now)}</time>;
}
