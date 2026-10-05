import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { m } from "../../i18n";

type PagedRoute =
  | "/account/inquiries"
  | "/account/support"
  | "/account/reviews"
  | "/account/wishlist"
  | "/points"
  | "/orders";

const WINDOW = 5;
const CELL = "flex size-8 items-center justify-center text-meta";

/**
 * 페이지 번호 — 링크라서 자바스크립트 없이도 넘어간다. 지금 페이지 앞뒤로 5칸을 보이고, 다른 검색 조건은 그대로 둔다.
 * 1페이지는 주소에서 `page`를 뺀다.
 */
export function Pagination({
  page,
  totalPages,
  to,
}: {
  page: number;
  totalPages: number;
  to: PagedRoute;
}) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1));
  const pages = Array.from({ length: Math.min(WINDOW, totalPages) }, (_, index) => start + index);
  const searchOf = (next: number) => (prev: Record<string, unknown>) => ({
    ...prev,
    page: next > 1 ? next : undefined,
  });
  return (
    <nav aria-label={m.mypage_page_label()} className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link to={to} search={searchOf(page - 1)} aria-label={m.list_page_prev()} className={CELL}>
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${CELL} text-line-strong`}>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {pages.map((number) => (
        <Link
          key={number}
          to={to}
          search={searchOf(number)}
          aria-label={m.mypage_page_number({ page: number })}
          aria-current={number === page ? "page" : undefined}
          className={`${CELL} tabular ${number === page ? "bg-ink font-bold text-white" : "text-ink hover:bg-chip"}`}
        >
          {number}
        </Link>
      ))}
      {page < totalPages ? (
        <Link to={to} search={searchOf(page + 1)} aria-label={m.list_page_next()} className={CELL}>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${CELL} text-line-strong`}>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}

/** 밑줄 탭·필터의 글자 클래스 — 링크(검색 조건)로 오가는 목록 거르기에 쓴다 */
export function tabClass(active: boolean): string {
  return `-mb-px shrink-0 border-b-2 px-4 py-3 text-body ${
    active ? "border-ink font-bold text-ink" : "border-transparent text-muted hover:text-ink"
  }`;
}

/** 탭 줄 — 아래 1px 선. 좁은 화면에서는 탭이 많으면 줄 안에서 가로로 민다 */
export const TAB_ROW = "flex min-w-0 overflow-x-auto border-line border-b [scrollbar-width:none]";
