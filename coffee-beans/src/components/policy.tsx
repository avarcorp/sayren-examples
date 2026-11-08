import type { ReactNode } from "react";

/** 약관·개인정보 본문 — 법률 문서라 합니다체다(규칙 10 예외) */
export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold text-body-lg">{title}</h2>
      <div className="flex flex-col gap-2 break-words text-body text-sub leading-relaxed">
        {children}
      </div>
    </section>
  );
}
