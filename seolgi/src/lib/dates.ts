const p = (n: number) => String(n).padStart(2, "0");

function kstOf(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getTime() + 9 * 3_600_000);
}

/** 날짜 표시 — 2026.10.22 (한국 시간) */
export function formatDate(iso: string): string {
  const kst = kstOf(iso);
  if (!kst) return "";
  return `${kst.getUTCFullYear()}.${p(kst.getUTCMonth() + 1)}.${p(kst.getUTCDate())}`;
}

/** 일시 표시 — 2026.10.22 14:30 (한국 시간, 24시) */
export function formatDateTime(iso: string): string {
  const kst = kstOf(iso);
  if (!kst) return iso;
  return `${formatDate(iso)} ${p(kst.getUTCHours())}:${p(kst.getUTCMinutes())}`;
}
