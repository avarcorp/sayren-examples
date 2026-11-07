import type { CategoryNode, ProductSort } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { lazyMessages, m } from "../../i18n";

export const SORT_LABELS = lazyMessages<ProductSort>({
  recommend: () => m.sort_recommend(),
  latest: () => m.sort_latest(),
  priceAsc: () => m.sort_price_asc(),
  priceDesc: () => m.sort_price_desc(),
  reviewCount: () => m.sort_review_count(),
  ratingDesc: () => m.sort_rating(),
});

const CHIP =
  "flex min-h-10 shrink-0 items-center border px-3.5 text-meta whitespace-nowrap transition-colors";

/** 카테고리 칩 — 가로로 넘기고, 선택한 칩은 네이비 테두리·글자 */
export function CategoryChips({
  categories,
  current,
  onSelect,
}: {
  categories: CategoryNode[];
  current: string | undefined;
  onSelect: (categoryId: string | undefined) => void;
}) {
  const items = [{ categoryId: undefined, name: m.nav_all() }, ...categories];
  return (
    <div className="scroll-row -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex gap-2">
        {items.map((item) => {
          const active = item.categoryId === current;
          return (
            <li key={item.categoryId ?? "all"}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(item.categoryId)}
                className={`${CHIP} ${active ? "border-point font-semibold text-point" : "border-line-strong text-sub hover:border-ink"}`}
              >
                {item.name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SortSelect({
  value,
  onChange,
  total,
}: {
  value: ProductSort;
  onChange: (next: ProductSort) => void;
  total: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <p className="text-meta text-sub">{m.list_total({ count: total })}</p>
      <label className="flex items-center gap-2 text-meta">
        <span className="sr-only">{m.sort_label()}</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as ProductSort)}
          className="min-h-10 border border-line-strong bg-page px-2 text-meta"
        >
          {(Object.keys(SORT_LABELS) as ProductSort[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** 페이지 이동 — 이전·번호·다음. 한 쪽뿐이면 숨긴다 */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => { search: Record<string, unknown> };
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const cell = "grid size-11 place-items-center text-meta";
  return (
    <nav aria-label={m.pagination_label()} className="mt-10 flex justify-center">
      <ul className="flex items-center">
        <li>
          {page > 1 ? (
            <Link to="." {...hrefFor(page - 1)} className={cell} aria-label={m.pagination_prev()}>
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
          ) : null}
        </li>
        {pages.map((p) => (
          <li key={p}>
            <Link
              to="."
              {...hrefFor(p)}
              className={`${cell} ${p === page ? "font-semibold text-point underline underline-offset-4" : "text-sub"}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Link>
          </li>
        ))}
        <li>
          {page < totalPages ? (
            <Link to="." {...hrefFor(page + 1)} className={cell} aria-label={m.pagination_next()}>
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </li>
      </ul>
    </nav>
  );
}
