import type { InfoSectionView, ProductNoticeView } from "@sayren/storefront-sdk";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { m } from "../../i18n";

/** 접는 구획 — 흰 바탕, 위아래 선 */
export function Accordion({
  title,
  children,
  open,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="group border-line border-b">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-semibold text-body [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 break-words">{title}</span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4 text-body text-sub">{children}</div>
    </details>
  );
}

/** 셀러가 연결한 안내 섹션 — 제목·본문 HTML(서버 정화) 그대로 */
export function InfoSections({ sections }: { sections: InfoSectionView[] }) {
  if (sections.length === 0) return null;
  return (
    <div className="border-line border-t">
      {sections.map((section) => (
        <Accordion key={section.infoSectionId} title={section.title}>
          <div
            className="info-body break-words [&_p+p]:mt-2"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: 서버가 정화한 HTML이다
            dangerouslySetInnerHTML={{ __html: section.body }}
          />
        </Accordion>
      ))}
    </div>
  );
}

/** 상품정보제공 고시 — 서버가 채운 라벨·값을 순서대로 */
export function NoticeTable({ notice }: { notice: ProductNoticeView | null }) {
  if (!notice) return null;
  return (
    <Accordion title={m.notice_title()}>
      <table className="w-full table-fixed border-collapse text-meta">
        <tbody>
          {notice.fields.map((field) => (
            <tr key={field.key} className="border-line border-b last:border-b-0">
              <th
                scope="row"
                className="w-2/5 py-2 pr-3 text-left align-top font-normal text-muted"
              >
                {field.label}
              </th>
              <td className="break-words py-2 align-top text-ink">{field.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Accordion>
  );
}
