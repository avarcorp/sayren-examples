import type { ReactNode } from "react";

/** 구역 제목 — Jua 제목과 오른쪽 보조 링크(「전체 보기」 등) */
export function SectionHeading({
  id,
  title,
  action,
}: {
  id: string;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 id={id} className="font-display text-h2">
        {title}
      </h2>
      {action}
    </div>
  );
}
