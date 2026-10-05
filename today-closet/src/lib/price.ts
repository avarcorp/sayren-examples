/**
 * 가격 표시 — 구매자가 내는 가격은 `discountedPrice ?? salePrice`다(결제 금액 계산은 서버가 한다).
 * 비교 가격(취소선)은 정가(`originalPrice`)가 그보다 클 때 정가, 아니면 즉시할인 전 판매가다. 둘 다 없으면 취소선·할인율이 없다.
 * 할인율은 `round((1 - 내는 가격 / 비교 가격) × 100)`이다(storefront-sdk 0.18.2 `originalPrice` 설명과 같다).
 */
export interface PriceView {
  price: number;
  compareAt: number | null;
  rate: number | null;
}

export function priceView(product: {
  salePrice: number;
  discountedPrice: number | null;
  originalPrice?: number | null;
}): PriceView {
  const price = product.discountedPrice ?? product.salePrice;
  const original = product.originalPrice ?? null;
  const compareAt =
    original != null && original > price
      ? original
      : product.discountedPrice != null && product.salePrice > price
        ? product.salePrice
        : null;
  const rate = compareAt ? Math.round((1 - price / compareAt) * 100) : null;
  return { price, compareAt, rate: rate && rate > 0 ? rate : null };
}
