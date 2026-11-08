import type { ProductCard as Card } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { m } from "../i18n";
import { productPathParam } from "../lib/product-path";
import { Price } from "./price";
import { ProductImage } from "./product-image";
import { Badge, Stars } from "./ui";

/** 상품 카드 — 사진, 이름 두 줄, 가격, 배지 하나(품절 > 무료배송) */
export function ProductCard({ product, eager }: { product: Card; eager?: boolean }) {
  const badge = product.soldOut ? (
    <Badge tone="sale">{m.badge_sold_out()}</Badge>
  ) : product.freeShipping ? (
    <Badge>{m.badge_free_shipping()}</Badge>
  ) : null;
  return (
    <Link
      to="/products/$productId"
      params={{ productId: productPathParam(product) }}
      className="group flex min-w-0 flex-col gap-2"
    >
      <ProductImage src={product.thumbnailUrl} alt={product.name} eager={eager} />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="line-clamp-2 break-words text-body leading-snug group-hover:underline">
          {product.name}
        </p>
        <Price product={product} />
        {product.reviewCount > 0 ? (
          <p className="flex items-center gap-1 text-caption text-muted">
            <Stars rating={product.averageRating} />
            <span className="tabular">({product.reviewCount})</span>
          </p>
        ) : null}
        {badge ? <div>{badge}</div> : null}
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  eagerCount = 0,
}: {
  products: Card[];
  eagerCount?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.productId} className="min-w-0">
          <ProductCard product={product} eager={index < eagerCount} />
        </li>
      ))}
    </ul>
  );
}
