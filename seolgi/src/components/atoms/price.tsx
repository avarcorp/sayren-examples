import type { ProductCard } from "@sayren/storefront-sdk";
import { formatMoney } from "../../lib/format";

type PriceFields = Pick<
  ProductCard,
  "salePrice" | "discountedPrice" | "originalPrice" | "currency"
>;

/**
 * 가격 — 지금 가격은 즉시할인가(없으면 판매가)다. 정가가 더 크면 할인율과 정가를 함께 보인다.
 * 금액 자체는 서버 값을 그대로 쓴다.
 */
export function Price({ product, size = "md" }: { product: PriceFields; size?: "md" | "lg" }) {
  const now = product.discountedPrice ?? product.salePrice;
  const was =
    product.originalPrice && product.originalPrice > now
      ? product.originalPrice
      : product.discountedPrice !== null && product.discountedPrice < product.salePrice
        ? product.salePrice
        : null;
  const rate = was ? Math.round(((was - now) / was) * 100) : null;
  const big = size === "lg";
  return (
    <span className={`flex flex-wrap items-baseline gap-x-2 ${big ? "text-h3" : "text-lead"}`}>
      {rate ? <span className="font-bold text-primary">{rate}%</span> : null}
      <span className="font-bold">{formatMoney(now, product.currency)}</span>
      {was ? (
        <span className={`text-muted line-through ${big ? "text-lead" : "text-small"}`}>
          <span className="sr-only">정가 </span>
          {formatMoney(was, product.currency)}
        </span>
      ) : null}
    </span>
  );
}
