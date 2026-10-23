import type {
  CategoryNode,
  ProductCard as ProductCardData,
  ProductSort,
} from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { toneOf } from "../../lib/tones";
import { ProductCard } from "../molecules/product-card";
import { SectionHeading } from "../molecules/section-heading";

/** 홈 진열 한 줄 — 제목과 「전체 보기」, 카드 4개 */
export function ProductRail({
  id,
  title,
  sort,
  products,
  topCategoryOf,
  tree,
}: {
  id: string;
  title: string;
  sort: ProductSort;
  products: ProductCardData[];
  topCategoryOf: Record<string, string>;
  tree: CategoryNode[];
}) {
  return (
    <section className="flex flex-col gap-7" aria-labelledby={id}>
      <SectionHeading
        id={id}
        title={title}
        action={
          <Link
            to="/products"
            search={{ sort }}
            className="py-2 text-muted text-small hover:text-ink"
          >
            전체 보기
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-5">
        {products.map((p) => {
          const top = topCategoryOf[p.productId];
          return (
            <ProductCard
              key={p.productId}
              product={p}
              tone={toneOf(top, tree)}
              label={tree.find((t) => t.categoryId === top)?.name ?? null}
            />
          );
        })}
      </div>
    </section>
  );
}
