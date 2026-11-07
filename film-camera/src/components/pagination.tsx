import { Link, type LinkProps } from "@tanstack/react-router";
import { m } from "../i18n";

const CELL =
  "inline-flex min-h-11 min-w-11 items-center justify-center border border-line px-3 text-body hover:border-ink";

/** 쪽 이동 — 이전·다음과 쪽 번호. 쪽이 하나면 그리지 않는다 */
export function Pagination({
  page,
  totalPages,
  linkFor,
}: {
  page: number;
  totalPages: number;
  linkFor: (page: number) => LinkProps;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav aria-label={m.pagination_label()} className="flex flex-wrap items-center gap-2">
      {page > 1 ? (
        <Link {...linkFor(page - 1)} className={CELL}>
          {m.pagination_prev()}
        </Link>
      ) : null}
      {pages.map((p) => (
        <Link
          key={p}
          {...linkFor(p)}
          aria-label={m.pagination_page({ page: p })}
          aria-current={p === page ? "page" : undefined}
          className={`${CELL} tabular ${p === page ? "border-ink font-bold" : ""}`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link {...linkFor(page + 1)} className={CELL}>
          {m.pagination_next()}
        </Link>
      ) : null}
    </nav>
  );
}
