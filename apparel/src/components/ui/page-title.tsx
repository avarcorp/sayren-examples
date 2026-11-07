import type { ReactNode } from "react";

/** 페이지 머리말 — 제목만 둔다(설명 줄 없음). 페이지의 유일한 h1 */
export function PageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 pt-6 pb-4 md:pt-10 md:pb-6">
      <h1 className="min-w-0 break-words font-semibold text-xl md:text-2xl">{children}</h1>
      {aside}
    </div>
  );
}

/** 본문 폭 컨테이너 — 좌우 여백 16px(모바일)·24px(태블릿 이상) */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-page px-4 md:px-6 ${className}`}>{children}</div>;
}
