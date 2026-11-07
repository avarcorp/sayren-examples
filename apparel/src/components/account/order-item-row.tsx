import type { MyOrderItem, OrderItemStatus } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { lazyMessages, m } from "../../i18n";
import { formatMoney } from "../../lib/format";
import { productPathParam } from "../../lib/product-path";
import { ProductImage } from "../product/product-image";

export const ITEM_STATUS = lazyMessages<OrderItemStatus>({
  PAYMENT_WAITING: () => m.status_payment_waiting(),
  PAID: () => m.status_paid(),
  CONFIRMED: () => m.status_confirmed(),
  DISPATCHED: () => m.status_dispatched(),
  DELIVERING: () => m.status_delivering(),
  DELIVERED: () => m.status_delivered(),
  PURCHASE_DECIDED: () => m.status_decided(),
  CANCELED: () => m.status_canceled(),
});

/** 주문 상품 한 줄 — 사진, 이름, 옵션·수량, 금액, 단계(서버의 step.label 우선) */
export function OrderItemRow({
  item,
  currency,
  children,
}: {
  item: MyOrderItem;
  currency?: string;
  children?: React.ReactNode;
}) {
  const label = item.step?.label ?? ITEM_STATUS[item.status];
  return (
    <li className="flex flex-col gap-3 border-line border-b py-4">
      <div className="flex gap-3">
        <Link
          to="/products/$productId"
          params={{ productId: productPathParam(item) }}
          className="w-16 shrink-0"
        >
          <ProductImage src={item.thumbnailUrl} alt={item.productName} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-meta">
          <p className="font-semibold text-point">{label}</p>
          <p className="line-clamp-2 break-words text-body">{item.productName}</p>
          <p className="text-sub">
            {[item.optionName, m.checkout_qty({ count: item.activeQuantity || item.quantity })]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="tabular font-semibold">{formatMoney(item.totalPrice, currency)}</p>
          {item.claimStatus ? <p className="text-sale">{m.order_claim_in_progress()}</p> : null}
        </div>
      </div>
      {children}
    </li>
  );
}
