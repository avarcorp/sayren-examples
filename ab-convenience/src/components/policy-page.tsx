import type { ReactNode } from "react";
import type { PolicyDocument } from "../site/policies";

/** 약관·방침·안내 문서 한 장 — 문서 내용은 `src/site/policies.ts`다. 본문 폭 768, 제목 24(모바일 20) · 조항 16 · 본문 14 */
export function PolicyPage({
  document,
  children,
}: {
  document: PolicyDocument;
  /** 문서 아래에 붙는 진입점(고객센터의 1:1 문의 등) */
  children?: ReactNode;
}) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 md:gap-10">
      <header className="flex flex-col gap-1.5 border-ink border-b-2 pb-4 md:pb-5">
        <h1 className="break-words font-bold text-xl tracking-tight md:text-2xl">
          {document.title}
        </h1>
        <p className="text-meta text-muted">{document.updatedAt}</p>
      </header>
      {document.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-2.5">
          <h2 className="break-words font-bold text-base">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="whitespace-pre-line break-words text-body text-sub">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      {children}
    </article>
  );
}
