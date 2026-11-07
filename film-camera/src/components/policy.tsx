import type { ReactNode } from "react";
import { m } from "../i18n";
import { PageHeader } from "./ui";

/** 정책 문서 — 제목과 조항 목록. 상점 정보(이름·연락처)는 응답 값으로 채운다 */
export function PolicyDocument({
  title,
  sections,
  footer,
}: {
  title: string;
  sections: { title: string; body: string }[];
  footer?: ReactNode;
}) {
  return (
    <main className="flex flex-col gap-6 lg:max-w-[48rem]">
      <PageHeader title={title} />
      <p className="text-meta text-sub">{m.policy_effective()}</p>
      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h2 className="font-bold text-body-lg">{section.title}</h2>
            <p className="max-w-[40em] text-body text-sub leading-relaxed">{section.body}</p>
          </section>
        ))}
        {footer}
      </div>
    </main>
  );
}
