import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { m } from "../../i18n";

/** 링크 하나를 그리는 데 필요한 것 — 화면이 자기 라우트의 `<Link>`로 그린다(다른 조건은 그대로 둔다) */
export interface PageLinkProps {
  page: number;
  className: string;
  children: ReactNode;
  "aria-label"?: string;
  "aria-current"?: "page";
}

/** 보이는 번호 — 현재 쪽을 가운데 두고 최대 `size`개 */
export function pageWindow(page: number, totalPages: number, size = 5): number[] {
  const count = Math.min(size, totalPages);
  const start = Math.min(Math.max(1, page - Math.floor(count / 2)), totalPages - count + 1);
  return Array.from({ length: count }, (_, i) => start + i);
}

const CELL = "flex size-9 items-center justify-center text-meta md:size-8";

/**
 * 페이지 번호 — 이전·번호·다음. 이동은 링크라 자바스크립트 없이도 넘어간다. 한 쪽뿐이면 그리지 않는다.
 */
export function Pagination({
  page,
  totalPages,
  renderLink,
}: {
  page: number;
  totalPages: number;
  renderLink: (props: PageLinkProps) => ReactNode;
}) {
  if (totalPages <= 1) return null;
  const icon = "size-4";
  return (
    <nav aria-label={m.browse_pagination()} className="flex items-center justify-center gap-1 pt-4">
      {page > 1 ? (
        renderLink({
          page: page - 1,
          className: `${CELL} text-ink hover:bg-chip`,
          "aria-label": m.products_page_prev(),
          children: <ChevronLeft aria-hidden="true" className={icon} strokeWidth={1.6} />,
        })
      ) : (
        <span aria-hidden="true" className={`${CELL} text-line-strong`}>
          <ChevronLeft className={icon} strokeWidth={1.6} />
        </span>
      )}
      {pageWindow(page, totalPages).map((number) => (
        <span key={number} className="contents">
          {renderLink({
            page: number,
            className:
              number === page ? `${CELL} bg-ink font-bold text-white` : `${CELL} hover:bg-chip`,
            "aria-label": m.browse_page_number({ page: number }),
            "aria-current": number === page ? "page" : undefined,
            children: number,
          })}
        </span>
      ))}
      {page < totalPages ? (
        renderLink({
          page: page + 1,
          className: `${CELL} text-ink hover:bg-chip`,
          "aria-label": m.products_page_next(),
          children: <ChevronRight aria-hidden="true" className={icon} strokeWidth={1.6} />,
        })
      ) : (
        <span aria-hidden="true" className={`${CELL} text-line-strong`}>
          <ChevronRight className={icon} strokeWidth={1.6} />
        </span>
      )}
    </nav>
  );
}
