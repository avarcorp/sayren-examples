import type { ReactNode } from "react";

/**
 * 쿠폰 티켓 — 왼쪽 혜택(20 굵게)·이름·조건, 오른쪽 점선 너머 상태 칸. 쓸 수 없는 쿠폰(`dimmed`)은 회색 테두리·글자다.
 * 모바일 360px에서도 넘치지 않게 왼쪽은 줄바꿈하고 오른쪽 칸은 96px로 둔다.
 */
export function CouponTicket({
  benefit,
  name,
  conditions,
  stub,
  dimmed = false,
}: {
  benefit: ReactNode;
  name: ReactNode;
  conditions?: ReactNode;
  stub: ReactNode;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 border ${dimmed ? "border-line text-muted" : "border-ink text-ink"}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-4 md:px-5">
        <p className={`break-words font-bold text-lg md:text-xl ${dimmed ? "" : "text-point"}`}>
          {benefit}
        </p>
        <p className="break-words text-body">{name}</p>
        {conditions ? (
          <p className={`break-words text-caption ${dimmed ? "" : "text-muted"}`}>{conditions}</p>
        ) : null}
      </div>
      <div
        className={`flex w-24 shrink-0 flex-col items-center justify-center gap-2 border-l border-dashed px-2 text-center font-bold text-meta ${dimmed ? "border-line" : "border-line-strong"}`}
      >
        {stub}
      </div>
    </div>
  );
}
