import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/** 접는 행 — 행 사이 가는 선. 브라우저 기본 details라 키보드·화면 읽기 프로그램이 그대로 동작한다 */
export function Accordion({ items }: { items: { id: string; title: string; body: ReactNode }[] }) {
  return (
    <div className="divide-y divide-line border-line border-y">
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-body-lg focus-visible:outline-2 focus-visible:outline-point [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">{item.title}</span>
            <ChevronDown
              size={18}
              aria-hidden="true"
              className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <div className="pb-5 text-body text-sub leading-relaxed">{item.body}</div>
        </details>
      ))}
    </div>
  );
}
