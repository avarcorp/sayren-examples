import type { MyOrderItem } from "@sayren/storefront-sdk";
import { lazyMessages, m } from "../../i18n";

export const STATUS_LABEL = lazyMessages<MyOrderItem["status"]>({
  PAYMENT_WAITING: () => m.status_PAYMENT_WAITING(),
  PAID: () => m.status_PAID(),
  CONFIRMED: () => m.status_CONFIRMED(),
  DISPATCHED: () => m.status_DISPATCHED(),
  DELIVERING: () => m.status_DELIVERING(),
  DELIVERED: () => m.status_DELIVERED(),
  PURCHASE_DECIDED: () => m.status_PURCHASE_DECIDED(),
  CANCELED: () => m.status_CANCELED(),
});

/** 주문상품 단계 — 흐름이 준 이름(`flowState.label`)이 있으면 그 이름, 없으면 상태 이름 */
export function StatusLabel({ item }: { item: MyOrderItem }) {
  const label = item.flowState?.label ?? item.step?.label ?? STATUS_LABEL[item.status];
  const tone =
    item.status === "DISPATCHED" || item.status === "DELIVERING"
      ? "text-info"
      : item.status === "CANCELED"
        ? "text-muted"
        : "text-ink";
  return <span className={`shrink-0 font-semibold text-meta ${tone}`}>{label}</span>;
}
