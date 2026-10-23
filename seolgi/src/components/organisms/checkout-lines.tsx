import type { CheckoutSession } from "@sayren/storefront-sdk";
import { formatMoney } from "../../lib/format";
import { ProductThumb } from "../atoms/product-thumb";
import { LineOptions } from "../molecules/line-options";
import { SectionTitle } from "../molecules/section-title";

/** 주문 상품 (시안 DCheckout) — 64px 그림, 이름·옵션·수량, 금액 */
export function CheckoutLines({ items }: { items: CheckoutSession["items"] }) {
  return (
    <section aria-labelledby="lines-title" className="flex flex-col">
      <SectionTitle id="lines-title" title={`주문 상품 ${items.length}개`} />
      <ul>
        {items.map((item) => (
          <li
            key={item.lineId ?? `${item.productId}-${item.optionId}`}
            className="flex items-center gap-4 border-line border-b py-4"
          >
            <span className="w-16 shrink-0">
              <ProductThumb src={item.thumbnailUrl ?? null} name={item.productName} size="sm" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1 text-body">
              <span>{item.productName}</span>
              <LineOptions line={item} />
              <span className="text-caption text-muted">수량 {item.quantity}</span>
            </span>
            <span className="font-medium text-body">{formatMoney(item.totalPrice)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
