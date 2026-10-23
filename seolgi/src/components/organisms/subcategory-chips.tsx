import { Link } from "@tanstack/react-router";
import { ChipCount, chipClass } from "../atoms/chip";

export interface ChipItem {
  categoryId: string;
  label: string;
  count: number | null;
}

/** 하위 카테고리 칩 — 「전체」(대분류) + 하위. 수는 대분류 기준 패싯이다 */
export function SubcategoryChips({
  items,
  current,
}: {
  items: ChipItem[];
  current: string | undefined;
}) {
  if (items.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c) => {
        const on = c.categoryId === current;
        return (
          <Link
            key={c.categoryId}
            from="/products/"
            to="/products"
            search={(prev) => ({ ...prev, categoryId: c.categoryId, page: undefined })}
            aria-current={on ? "true" : undefined}
            className={chipClass(on)}
          >
            {c.label}
            {c.count !== null ? <ChipCount on={on} count={c.count} /> : null}
          </Link>
        );
      })}
    </div>
  );
}
