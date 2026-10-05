import type { ReactNode } from "react";

/**
 * 배지 원자 — 높이 20, 11px 굵게.
 * - benefit: 혜택(옅은 포인트 면) · solid: 잉크 채움(BEST·혜택 타일) · outline: 잉크 테두리 · neutral: 회색 테두리(무료배송) · muted: 품절
 */
const TONE = {
  benefit: "bg-point-soft text-point",
  solid: "bg-ink text-white",
  outline: "border border-ink text-ink",
  neutral: "border border-line-strong text-sub",
  muted: "bg-chip text-muted",
} as const;

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: keyof typeof TONE;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center whitespace-nowrap px-1.5 font-bold text-[0.6875rem] ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
