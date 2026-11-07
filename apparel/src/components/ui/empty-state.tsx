import type { ReactNode } from "react";

/** 빈 화면·오류 — 해요체 한두 문장과 버튼 하나 */
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-5 border-line border-t py-16 text-center">
      <p className="max-w-80 text-body text-sub">{message}</p>
      {action}
    </div>
  );
}
