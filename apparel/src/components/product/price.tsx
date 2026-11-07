import { priceViewOf } from "@sayren/storefront-sdk";
import { m } from "../../i18n";
import { formatMoney } from "../../lib/format";

type Priced = Parameters<typeof priceViewOf>[0];

/** 가격 — `priceViewOf` 결과만 그린다. 할인율·취소선은 compareAt이 있을 때만 */
export function Price({ product, size = "sm" }: { product: Priced; size?: "sm" | "lg" }) {
  const view = priceViewOf(product);
  const main = size === "lg" ? "text-xl" : "text-body";
  return (
    <p className="tabular flex flex-wrap items-baseline gap-x-1.5">
      {view.discountRate !== null ? (
        <span className={`font-semibold text-sale ${main}`}>
          {m.price_discount_rate({ rate: view.discountRate })}
        </span>
      ) : null}
      <span className={`font-semibold ${main}`}>{formatMoney(view.price, view.currency)}</span>
      {view.compareAt !== null ? (
        <span className="text-caption text-muted line-through">
          <span className="sr-only">{m.price_compare_at()}</span>
          {formatMoney(view.compareAt, view.currency)}
        </span>
      ) : null}
    </p>
  );
}
