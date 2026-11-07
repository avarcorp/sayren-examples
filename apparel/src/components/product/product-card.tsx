import type { ProductCard as ProductCardData } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { m } from "../../i18n";
import { productPathParam } from "../../lib/product-path";
import { Price } from "./price";
import { ProductImage } from "./product-image";

/** 상품 카드 — 사진, 이름, 가격, 배지 하나(품절 우선, 다음 무료배송) */
export function ProductCard({
  product,
  eager = false,
}: {
  product: ProductCardData;
  eager?: boolean;
}) {
  const badge = product.soldOut
    ? m.badge_sold_out()
    : product.freeShipping
      ? m.badge_free_shipping()
      : null;
  return (
    <Link
      to="/products/$productId"
      params={{ productId: productPathParam(product) }}
      className="group flex min-w-0 flex-col gap-2.5"
    >
      <ProductImage
        src={product.thumbnailUrl}
        alt={product.name}
        eager={eager}
        className={product.soldOut ? "opacity-60" : ""}
      />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="line-clamp-2 break-words text-body group-hover:underline">{product.name}</p>
        <Price product={product} />
        {badge ? (
          <p className="text-caption text-sub">
            <span className="border border-line-strong px-1.5 py-0.5">{badge}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}

/** 상품 그리드 — 390px 2열, 768px 3열, 1024px 이상 4열 */
export function ProductGrid({
  products,
  eagerCount = 0,
}: {
  products: ProductCardData[];
  eagerCount?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.productId} className="min-w-0">
          <ProductCard product={product} eager={index < eagerCount} />
        </li>
      ))}
    </ul>
  );
}
