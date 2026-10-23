import type { ProductCard as ProductCardData } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { productPathParam } from "../../lib/product-path";
import type { Tone } from "../../lib/tones";
import { Price } from "../atoms/price";
import { ProductThumb } from "../atoms/product-thumb";

interface Props {
  product: ProductCardData;
  /** 사진이 없을 때 타일 면 색과 작은 라벨(카테고리) */
  tone: Tone;
  label?: string | null;
}

/** 상품 카드 — 그림, 이름, 가격, 메타(품절·무료배송·리뷰 수). 카드 상자 없이 정렬로만 나눈다 */
export function ProductCard({ product, tone, label }: Props) {
  const meta = [
    product.freeShipping ? "무료배송" : null,
    product.reviewCount > 0 ? `리뷰 ${product.reviewCount}` : null,
  ].filter(Boolean);
  return (
    <Link
      to="/products/$productNo"
      params={{ productNo: productPathParam(product) }}
      className="group flex flex-col gap-3"
      data-testid="product-card"
    >
      <span className="relative block">
        <ProductThumb src={product.thumbnailUrl} name={product.name} tone={tone} label={label} />
        {product.soldOut ? (
          <span className="absolute inset-0 grid place-items-center bg-page/60 font-medium text-body">
            품절
          </span>
        ) : null}
      </span>
      <span className="flex flex-col gap-1 text-body leading-normal">
        <span className="group-hover:underline">{product.name}</span>
        <Price product={product} />
        {meta.length > 0 ? (
          <span className="text-caption text-muted">{meta.join(" · ")}</span>
        ) : null}
      </span>
    </Link>
  );
}
