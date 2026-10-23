import type { ReactNode } from "react";
import { Checkbox } from "../atoms/checkbox";
import { type PriceBounds, PriceFilter } from "../molecules/price-filter";
import { SortSelect } from "../molecules/sort-select";

export interface ListToolbarProps<S extends string> {
  total: number;
  price?: {
    value: PriceBounds;
    range?: { min: number; max: number };
    onChange: (v: PriceBounds) => void;
  };
  freeShipping?: { checked: boolean; onChange: (checked: boolean) => void };
  sort: { value: S; options: { value: S; label: string }[]; onChange: (value: S) => void };
  extra?: ReactNode;
}

/** 목록 위 줄 — 상품 수, 가격·무료배송 필터, 정렬. 위는 잉크 선, 아래는 옅은 선 */
export function ListToolbar<S extends string>({
  total,
  price,
  freeShipping,
  sort,
  extra,
}: ListToolbarProps<S>) {
  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-1 border-ink border-t border-b-line border-b py-1 text-small">
      <span className="font-medium">{total}개</span>
      {price ? (
        <PriceFilter value={price.value} range={price.range} onChange={price.onChange} />
      ) : null}
      {freeShipping ? (
        <Checkbox
          checked={freeShipping.checked}
          onChange={(e) => freeShipping.onChange(e.target.checked)}
        >
          무료배송
        </Checkbox>
      ) : null}
      {extra}
      <span className="flex-1" />
      <SortSelect value={sort.value} options={sort.options} onChange={sort.onChange} />
    </div>
  );
}
