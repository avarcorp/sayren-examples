import type { CategoryNode, ProductSort } from "@sayren/storefront-sdk";
import { lazyMessages, m } from "../i18n";
import { Chip, Select } from "./ui";

export const SORT_LABELS = lazyMessages<ProductSort>({
  recommend: () => m.sort_recommend(),
  latest: () => m.sort_latest(),
  priceAsc: () => m.sort_price_asc(),
  priceDesc: () => m.sort_price_desc(),
  reviewCount: () => m.sort_review_count(),
  ratingDesc: () => m.sort_rating(),
});

const SORTS: ProductSort[] = ["recommend", "latest", "priceAsc", "priceDesc", "reviewCount"];

/** 목록 필터 — 카테고리 칩(가로 스크롤) + 정렬 */
export function FilterBar({
  categories,
  categoryId,
  sort,
  onCategory,
  onSort,
}: {
  categories: CategoryNode[];
  categoryId: string | undefined;
  sort: ProductSort;
  onCategory: (categoryId: string | undefined) => void;
  onSort: (sort: ProductSort) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <Chip selected={!categoryId} onClick={() => onCategory(undefined)}>
          {m.filter_all()}
        </Chip>
        {categories.map((category) => (
          <Chip
            key={category.categoryId}
            selected={categoryId === category.categoryId}
            onClick={() => onCategory(category.categoryId)}
          >
            {category.name}
          </Chip>
        ))}
      </div>
      <div className="flex justify-end">
        <label htmlFor="sort-select" className="flex items-center gap-2 text-meta text-sub">
          <span>{m.sort_label()}</span>
          <Select
            id="sort-select"
            className="min-h-10 w-auto text-meta"
            value={sort}
            onChange={(event) => onSort(event.target.value as ProductSort)}
          >
            {SORTS.map((value) => (
              <option key={value} value={value}>
                {SORT_LABELS[value]}
              </option>
            ))}
          </Select>
        </label>
      </div>
    </div>
  );
}
