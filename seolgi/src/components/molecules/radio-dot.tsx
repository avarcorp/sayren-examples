/** 라디오 점 (시안) — 고르면 primary 굵은 고리, 아니면 옅은 회색 고리 */
export function RadioDot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`size-5 shrink-0 rounded-full ${on ? "border-[6px] border-primary" : "border-[1.5px] border-control"}`}
    />
  );
}
