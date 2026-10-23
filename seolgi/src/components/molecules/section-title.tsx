import type { ReactNode } from "react";

/** 주문서·마이페이지 구역 머리 — 17px 제목과 오른쪽 보조 동작, 아래 잉크 선 */
export function SectionTitle({
  id,
  title,
  action,
}: {
  id: string;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-ink border-b pb-3">
      <h2 id={id} className="font-medium text-section">
        {title}
      </h2>
      {action}
    </div>
  );
}
