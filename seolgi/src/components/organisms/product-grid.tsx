import type { CategoryNode, ProductCard as ProductCardData } from "@sayren/storefront-sdk";
import { categoryName, toneOf } from "../../lib/tones";
import { ProductCard } from "../molecules/product-card";

/** 상품 격자 — 목록·검색·기획전이 같이 쓴다. 카테고리를 알면 그 대분류 색으로 타일을 칠한다 */
export function ProductGrid({
  products,
  categoryId,
  tree,
  emptyText = "조건에 맞는 상품이 없습니다.",
}: {
  products: ProductCardData[];
  categoryId?: string;
  tree: CategoryNode[];
  emptyText?: string;
}) {
  if (products.length === 0) return <p className="py-24 text-center text-muted">{emptyText}</p>;
  return (
    <section
      aria-label="상품"
      className="grid grid-cols-2 gap-x-4 gap-y-12 pt-4 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-x-5"
    >
      {products.map((p) => (
        <ProductCard
          key={p.productId}
          product={p}
          tone={toneOf(categoryId, tree)}
          label={categoryName(categoryId, tree)}
        />
      ))}
    </section>
  );
}
