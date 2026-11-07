import { type ProductCard, priceViewOf } from "@sayren/storefront-sdk";
import { m } from "../i18n";
import { formatMoney } from "../lib/format";

/** 상품 가격 — `priceViewOf` 결과 그대로. 취소선 가격이 없으면 낼 가격만 보인다 */
export function Price({
  product,
  size = "card",
}: {
  product: Pick<
    ProductCard,
    "salePrice" | "discountedPrice" | "discountRate" | "originalPrice" | "currency"
  >;
  size?: "card" | "detail";
}) {
  const view = priceViewOf(product);
  return (
    <p className="tabular flex flex-wrap items-baseline gap-x-2">
      {view.discountRate ? (
        <span className="font-bold text-point-strong">
          {m.product_discount({ rate: view.discountRate })}
        </span>
      ) : null}
      <span className={`font-bold ${size === "detail" ? "text-2xl" : "text-body-lg"}`}>
        {formatMoney(view.price, view.currency)}
      </span>
      {view.compareAt ? (
        <>
          <span className="sr-only">
            {m.product_compare_price({ amount: formatMoney(view.compareAt, view.currency) })}
          </span>
          <span aria-hidden="true" className="text-meta text-muted line-through">
            {formatMoney(view.compareAt, view.currency)}
          </span>
        </>
      ) : null}
    </p>
  );
}
