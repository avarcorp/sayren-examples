import { ChevronDown } from "lucide-react";
import { m } from "../../i18n";
import type { SectionOf } from "../layout-schema";
import { fill } from "../site-link";
import { SectionShell } from "./common";

/** 자주 묻는 질문 — `<details>`라 자바스크립트 없이 열린다. 답변은 텍스트(줄바꿈만) */
export function FaqSection({
  section,
  storeName,
}: {
  section: SectionOf<"faq">;
  storeName: string;
}) {
  return (
    <SectionShell title={section.title ?? m.faq_title()}>
      <div className="divide-y divide-line border-ink border-t-2 border-b border-b-line">
        {section.items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 질문은 순서가 곧 정체다
          <details key={index} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 py-4 text-body md:text-body-lg [&::-webkit-details-marker]:hidden">
              <span aria-hidden="true" className="shrink-0 font-bold">
                Q
              </span>
              <span className="min-w-0 flex-1 break-words font-bold">
                {fill(item.question, storeName)}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-sub transition-transform group-open:rotate-180"
                strokeWidth={1.6}
              />
            </summary>
            <p className="whitespace-pre-line bg-chip px-4 py-4 text-body text-sub md:px-7">
              {fill(item.answer, storeName)}
            </p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}
