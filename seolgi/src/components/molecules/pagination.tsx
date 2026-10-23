import { Link } from "@tanstack/react-router";

/** 쪽 번호 — 지금 화면의 검색 조건은 두고 page만 바꾼다(어느 목록 화면에서나 쓴다) */
export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav aria-label="페이지" className="flex justify-center gap-1 pt-8 text-body">
      {pages.map((n) => (
        <Link
          key={n}
          to="."
          search={(prev: Record<string, unknown>) => ({ ...prev, page: n === 1 ? undefined : n })}
          aria-current={n === page ? "page" : undefined}
          className={`grid size-11 place-items-center ${n === page ? "border-ink border-b-2 font-bold" : "text-muted hover:text-ink"}`}
        >
          {n}
        </Link>
      ))}
    </nav>
  );
}
