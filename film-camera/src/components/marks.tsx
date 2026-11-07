import { m } from "../i18n";
import type { Grade } from "../lib/camera-name";

/** 점검 통과 표시 — 테두리 정사각형 + 가운데 점. 로고와 점검표가 같은 기호를 쓴다 */
export function CheckMark({ size = 16, muted = false }: { size?: 12 | 16 | 20; muted?: boolean }) {
  const dot = Math.round(size / 3);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center border-[1.5px] ${muted ? "border-line-strong" : "border-point"}`}
      style={{ width: size, height: size }}
    >
      <span className={muted ? "bg-line-strong" : "bg-point"} style={{ width: dot, height: dot }} />
    </span>
  );
}

export function Logo({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-bold text-lg tracking-tight">
      <CheckMark size={16} />
      <span className="whitespace-nowrap">{name}</span>
    </span>
  );
}

/** 등급 배지 — A급은 오렌지 테두리, B급은 잉크 테두리 */
export function GradeBadge({ grade }: { grade: Grade }) {
  const tone = grade === "A" ? "border-point text-point-strong" : "border-ink text-ink";
  return (
    <span
      className={`inline-flex h-[22px] w-fit shrink-0 items-center border px-1.5 font-bold text-caption leading-none ${tone}`}
    >
      {grade === "A" ? m.grade_A() : m.grade_B()}
    </span>
  );
}
