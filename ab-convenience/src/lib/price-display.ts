import type { ProductCard } from "@sayren/storefront-sdk";

/** 가격 표시 — 구매자가 내는 한 개 가격과, 있으면 취소선으로 보일 비교 가격·할인율 */
export interface PriceDisplay {
  /** 구매자가 내는 한 개 가격(옵션 추가금 제외) — 즉시할인이 있으면 할인 적용가, 없으면 판매가 */
  price: number;
  /** 취소선으로 보일 가격. 없으면 null */
  compareAt: number | null;
  /** 비교 가격 대비 할인율(%). 비교 가격이 없으면 null */
  rate: number | null;
}

/**
 * 「정가 취소선 + 할인율 + 판매가」 표시의 원천이다. 상품 카드·상세가 같은 함수로 그린다.
 *
 * - 정가(`originalPrice`)가 구매자 가격보다 크면 정가를 취소선으로 보이고 할인율도 정가 기준으로 셈한다.
 * - 정가가 없거나 작으면, 즉시할인이 있을 때 판매가를 취소선으로 보인다(할인율은 서버의 `discountRate`와 같다).
 *
 * 화면 표시용이다. 결제 금액은 서버가 다시 계산한다.
 */
export function priceDisplayOf(
  product: Pick<ProductCard, "salePrice" | "discountedPrice"> & {
    originalPrice?: number | null;
  },
): PriceDisplay {
  const price = product.discountedPrice ?? product.salePrice;
  const original = product.originalPrice ?? null;
  let compareAt: number | null = null;
  if (original !== null && original > price) compareAt = original;
  else if (product.discountedPrice !== null && product.salePrice > price)
    compareAt = product.salePrice;
  return {
    price,
    compareAt,
    rate: compareAt === null ? null : Math.round((1 - price / compareAt) * 100),
  };
}
