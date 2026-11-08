import { type PriceView, type ProductCard, priceViewOf } from "@sayren/storefront-sdk";
import { m } from "../i18n";
import { formatMoney } from "../lib/format";
import { cx } from "./ui";

/** 가격 — priceViewOf 결과만 보인다(할인율·취소선은 compareAt이 있을 때만) */
export function Price({
  product,
  size = "sm",
}: {
  product: Pick<ProductCard, "salePrice" | "discountedPrice" | "originalPrice" | "currency">;
  size?: "sm" | "lg";
}) {
  const view: PriceView = priceViewOf(product);
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5">
      {view.discountRate !== null ? (
        <span
          className={cx("font-bold text-sale tabular", size === "lg" ? "text-xl" : "text-body")}
        >
          {m.price_discount({ rate: view.discountRate })}
        </span>
      ) : null}
      <span className={cx("font-bold tabular", size === "lg" ? "text-xl" : "text-body")}>
        {formatMoney(view.price, view.currency)}
      </span>
      {view.compareAt !== null ? (
        <span className="text-caption text-muted line-through tabular">
          {formatMoney(view.compareAt, view.currency)}
        </span>
      ) : null}
    </div>
  );
}
