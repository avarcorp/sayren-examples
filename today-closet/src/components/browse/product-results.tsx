import type { ProductCard as ProductCardData } from "@sayren/storefront-sdk";
import type { ReactNode } from "react";
import { m } from "../../i18n";
import { siteLayout } from "../../site/layout";
import { gridClass } from "../../site/sections/common";
import { ProductCard } from "../product-card";
import { EmptyState } from "../ui/section";

/** 결과 머리 — 왼쪽 상품 수, 오른쪽 정렬 */
export function ResultBar({ count, sort }: { count: number; sort?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <p className="text-meta text-sub">
        {m.browse_product_count_prefix()} <b className="font-bold text-ink">{count}</b>
        {m.search_result_unit()}
      </p>
      {sort}
    </div>
  );
}

/**
 * 상품 격자 — 열 수·카드 모양은 `src/site/layout.json`의 `list`다(모바일 2열 · 데스크톱 4열). 비면 안내를 그린다.
 */
export function ProductResults({
  products,
  empty,
}: {
  products: readonly ProductCardData[];
  empty: { title: ReactNode; description?: ReactNode; action?: ReactNode };
}) {
  const { columns, card } = siteLayout.list;
  if (products.length === 0) return <EmptyState {...empty} />;
  return (
    <div className={gridClass(columns)}>
      {products.map((product) => (
        <ProductCard key={product.productId} product={product} card={card} />
      ))}
    </div>
  );
}
