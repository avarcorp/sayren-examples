import { ChevronRight } from "lucide-react";
import type { SectionOf } from "../layout-schema";
import { fill, SiteLink } from "../site-link";

/** 한 줄 안내 — 배송 요일·휴무 같은 것. band: 면 띠 · box: 테두리 상자. 링크가 있으면 오른쪽 화살표 */
export function NoticeSection({
  section,
  storeName,
}: {
  section: SectionOf<"notice">;
  storeName: string;
}) {
  const text = <span className="min-w-0 break-words">{fill(section.text, storeName)}</span>;
  const className =
    section.variant === "box"
      ? "flex min-h-12 items-center justify-between gap-3 border border-ink px-4 py-3 font-bold text-meta md:px-5 md:text-body"
      : "flex min-h-11 items-center justify-center gap-3 bg-chip px-4 py-2.5 text-center text-meta md:text-body";
  return section.to ? (
    <SiteLink to={section.to} className={`${className} hover:bg-chip`}>
      {text}
      <ChevronRight aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.6} />
    </SiteLink>
  ) : (
    <p className={className}>{text}</p>
  );
}
