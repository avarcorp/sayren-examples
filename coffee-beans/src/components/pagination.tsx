import { ChevronLeft, ChevronRight } from "lucide-react";
import { m } from "../i18n";
import { cx } from "./ui";

/** 페이지 번호 — 44px 버튼, 현재 페이지는 대표 색 테두리 */
export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  const base = "grid size-11 place-items-center rounded-control text-body tabular";
  return (
    <nav aria-label={m.pagination_label()} className="flex items-center justify-center gap-1 pt-8">
      <button
        type="button"
        className={base}
        disabled={page <= 1}
        aria-label={m.pagination_prev()}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          aria-current={p === page ? "page" : undefined}
          className={cx(base, p === page && "border border-point font-bold text-point")}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className={base}
        disabled={page >= totalPages}
        aria-label={m.pagination_next()}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
