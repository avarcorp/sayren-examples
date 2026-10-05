import type { ReactNode } from "react";

/**
 * 필터 칩 — 높이 36(모바일 32), 회색 테두리, 고르면 잉크 채움. 링크·버튼 어디에나 붙이는 클래스 문자열이다.
 */
export function chipClass(active: boolean): string {
  return [
    "inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap border px-3 text-meta md:h-9 md:px-3.5",
    active
      ? "border-brand bg-brand font-bold text-white"
      : "border-line-strong bg-page text-ink hover:border-ink",
  ].join(" ");
}

/** 칩에 붙는 개수 — API가 준 값만 보인다 */
export function ChipCount({ count, active }: { count: number; active: boolean }) {
  return <span className={active ? "font-normal text-white/80" : "text-muted"}>{count}</span>;
}

/**
 * 칩 한 줄 — 모바일은 줄 안에서만 가로로 민다(페이지는 넘치지 않는다), 데스크톱은 줄바꿈한다.
 */
export function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav aria-label={label} className="-mx-4 min-w-0 md:mx-0">
      <div className="flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] md:flex-wrap md:gap-2 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </nav>
  );
}

/** 칩 묶음 사이의 세로 구분선(데스크톱) */
export function ChipDivider() {
  return <span aria-hidden="true" className="mx-1.5 h-5 w-px shrink-0 self-center bg-line" />;
}
