/** 필터 칩 모양 — 둥근 알약. 고른 칩은 primary 면에 흰 글자 */
export function chipClass(on: boolean) {
  return `flex h-10 items-center gap-1.5 rounded-full px-4 text-body ${
    on ? "bg-primary text-white" : "border border-line-strong bg-page hover:border-ink"
  }`;
}

/** 칩 안의 수 */
export function ChipCount({ on, count }: { on: boolean; count: number }) {
  return <span className={`text-caption ${on ? "text-white/75" : "text-muted"}`}>{count}</span>;
}
