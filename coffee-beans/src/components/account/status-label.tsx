import type { OrderItemStatus } from "@sayren/storefront-sdk";
import { lazyMessages, m } from "../../i18n";

export const STATUS_LABELS = lazyMessages<OrderItemStatus>({
  PAYMENT_WAITING: () => m.status_payment_waiting(),
  PAID: () => m.status_paid(),
  CONFIRMED: () => m.status_confirmed(),
  DISPATCHED: () => m.status_dispatched(),
  DELIVERING: () => m.status_delivering(),
  DELIVERED: () => m.status_delivered(),
  PURCHASE_DECIDED: () => m.status_decided(),
  CANCELED: () => m.status_canceled(),
});

/** 상태값 — 명사구. 배송중은 info 색, 취소는 muted */
export function StatusLabel({ status }: { status: OrderItemStatus }) {
  const color =
    status === "DELIVERING" || status === "DISPATCHED"
      ? "text-info"
      : status === "CANCELED"
        ? "text-muted"
        : "text-point";
  return <span className={`font-semibold text-meta ${color}`}>{STATUS_LABELS[status]}</span>;
}
