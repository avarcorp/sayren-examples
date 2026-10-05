import type { ProductCard as ProductCardData } from "@sayren/storefront-sdk";
import { m } from "../i18n";
import { siteLayout } from "../site/layout";
import { ProductCard } from "./product-card";
import { SectionHeader } from "./ui/section";

/** 추천 — 같은 카테고리의 판매 중 상품(지금 상품 제외, 최대 10개)을 가로로 넘긴다 */
export function RelatedProducts({ products }: { products: ProductCardData[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <SectionHeader title={m.related_title()} />
      {products.length === 0 ? (
        <p className="text-body text-muted">{m.related_empty()}</p>
      ) : (
        <ul className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:gap-4 md:px-0">
          {products.map((product) => (
            <li key={product.productId} className="w-[9.5rem] shrink-0 snap-start md:w-44">
              <ProductCard product={product} card={siteLayout.list.card} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 추천 후보 고르기 — 지금 상품·품절 제외, 최대 `limit`개 */
export function pickRelated(
  products: readonly ProductCardData[],
  currentId: string,
  limit = 10,
): ProductCardData[] {
  return products.filter((p) => p.productId !== currentId && !p.soldOut).slice(0, limit);
}
