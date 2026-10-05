import type { MyOrderItemFulfillmentSnapshot, OrderItemStatus } from "@sayren/storefront-sdk";
import { lazyMessages, m } from "../i18n";

/** 주문 상품 상태 라벨 — 화면에 코드 대신 보인다. 서버가 상태를 더하면 코드 그대로 보인다 */
const ORDER_ITEM_STATUS_LABELS = lazyMessages<OrderItemStatus>({
  PAYMENT_WAITING: () => m.order_status_payment_waiting(),
  PAID: () => m.order_status_paid(),
  CONFIRMED: () => m.order_status_confirmed(),
  DISPATCHED: () => m.order_status_dispatched(),
  DELIVERING: () => m.order_status_delivering(),
  DELIVERED: () => m.order_status_delivered(),
  PURCHASE_DECIDED: () => m.order_status_purchase_decided(),
  CANCELED: () => m.order_status_canceled(),
});

/**
 * 배송이 없는 상품의 상태 라벨. 판매자가 제공 처리하면 `DELIVERED`가 되므로 표시만 「제공 완료」로 바꾼다.
 */
function nonShippingLabel(status: string): string | null {
  if (status === "CONFIRMED") return m.order_status_preparing();
  if (status === "DELIVERED") return m.order_status_provided();
  return null;
}

/**
 * 주문 상품 상태 라벨. `fulfillment`는 주문상품의 `fulfillmentSnapshot`(주문 시점 이행)이다 — 배송이 없는 상품은 제공 단계로
 * 보인다. 모르는 유형도 `requiresShipping`으로 가른다
 */
export function orderItemStatusLabel(
  status: string,
  fulfillment?: Pick<MyOrderItemFulfillmentSnapshot, "type" | "requiresShipping"> | null,
): string {
  if (fulfillment && !fulfillment.requiresShipping) {
    const label = nonShippingLabel(status);
    if (label) return label;
  }
  return ORDER_ITEM_STATUS_LABELS[status as OrderItemStatus] ?? status;
}

/** 주문 상품 상태 글자색 — 배송 중은 info, 취소·반품은 point, 구매 확정은 muted, 나머지는 잉크다 */
export type OrderItemTone = "info" | "point" | "muted" | "ink";

/** 진행 중인 취소·반품 — 끝난(완료·거부·철회) 신청은 상태 표시에 섞지 않는다 */
const CLOSED_CLAIMS: ReadonlySet<string> = new Set(["COMPLETED", "REJECTED", "WITHDRAWN"]);

export function claimInProgress(claimStatus: string | null | undefined): boolean {
  return Boolean(claimStatus && !CLOSED_CLAIMS.has(claimStatus));
}

export function orderItemTone(status: string, claimStatus?: string | null): OrderItemTone {
  if (status === "CANCELED" || claimInProgress(claimStatus)) return "point";
  if (status === "DISPATCHED" || status === "DELIVERING") return "info";
  if (status === "PURCHASE_DECIDED") return "muted";
  return "ink";
}

/** 주문 흐름(#115)의 행동 — 서버가 켠 행동만 그린다 */
interface FlowActionLike {
  key: string;
  enabled: boolean;
  subflow?: string;
  mode?: string;
}

/**
 * 접수할 수 있는 신청 종류. 주문 흐름이 있는 주문상품은 서버가 준 행동(`actions`)으로 판정한다 — 하위 흐름(클레임)이 붙은 켜진 행동만이다.
 * 흐름이 없는 옛 응답만 상태로 판정한다(**서버 규칙과 같게 둔다**: 취소는 발송 전, 반품은 배송완료 뒤).
 * 교환은 희망 옵션(`exchangeOptionId`)이 필수라 이 화면에서 다루지 않는다.
 */
export function claimableTypes(item: {
  status: string;
  actions?: readonly FlowActionLike[];
}): ("CANCEL" | "RETURN")[] {
  if (item.actions) {
    const types = new Set<"CANCEL" | "RETURN">();
    for (const action of item.actions) {
      if (!action.enabled || !action.subflow) continue;
      if (action.subflow.startsWith("core.claim.cancel")) types.add("CANCEL");
      if (action.subflow.startsWith("core.claim.return")) types.add("RETURN");
    }
    return [...types];
  }
  if (item.status === "PAID" || item.status === "CONFIRMED") return ["CANCEL"];
  if (item.status === "DELIVERED") return ["RETURN"];
  return [];
}

/** 지금 취소·반품을 신청할 수 있는 주문 상품 — 신청 중이 아니고 남은 수량이 있어야 한다 */
export function canClaim(item: {
  status: string;
  claimStatus: string | null;
  activeQuantity: number;
  actions?: readonly FlowActionLike[];
}): boolean {
  return claimableTypes(item).length > 0 && !item.claimStatus && item.activeQuantity > 0;
}

/** 이 화면에서 바로 보내는 흐름 행동(시안 승인·구매확정 등) — 클레임(하위 흐름)·보기 전용 행동은 뺀다 */
export function flowButtons<T extends FlowActionLike>(item: { actions?: readonly T[] }): T[] {
  return (item.actions ?? []).filter((action) => !action.subflow && action.mode !== "VIEW");
}

/** 배송 조회를 열 수 있는 주문 상품 — 발송 뒤의 택배 상품. 직접 배달·방문 수령은 송장이 없어 조회하지 않는다 */
export function canTrack(item: {
  status: string;
  fulfillmentSnapshot?: Pick<MyOrderItemFulfillmentSnapshot, "requiresShipping"> | null;
}): boolean {
  const method = (item.fulfillmentSnapshot as { method?: string | null } | null | undefined)
    ?.method;
  return (
    (item.status === "DISPATCHED" || item.status === "DELIVERING" || item.status === "DELIVERED") &&
    Boolean(item.fulfillmentSnapshot?.requiresShipping) &&
    (method == null || method === "CARRIER")
  );
}

/**
 * 리뷰를 쓸 수 있는 주문 상품 — 서버 판정(`reviewWritable`: 구매확정·미작성·작성 기한, 테스트 결제 주문은 상점 허용 시)을 따른다.
 * 그 값이 없는 옛 응답만 상태로 짐작한다
 */
export function canReview(item: {
  status: string;
  reviewWritten: boolean;
  reviewWritable?: boolean;
}): boolean {
  if (item.reviewWritable !== undefined) return item.reviewWritable;
  return (item.status === "DELIVERED" || item.status === "PURCHASE_DECIDED") && !item.reviewWritten;
}

/** 주문 처리 현황의 단계 — 발송 완료·배송 중은 「배송 중」 한 칸으로 센다. 결제 대기·취소는 세지 않는다 */
export const ORDER_STAGES = [
  "PAID",
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
  "PURCHASE_DECIDED",
] as const;
export type OrderStage = (typeof ORDER_STAGES)[number];

export const ORDER_STAGE_LABELS = lazyMessages<OrderStage>({
  PAID: () => m.order_status_paid(),
  CONFIRMED: () => m.order_status_confirmed(),
  SHIPPING: () => m.order_status_delivering(),
  DELIVERED: () => m.order_status_delivered(),
  PURCHASE_DECIDED: () => m.order_status_purchase_decided(),
});

function stageOf(status: string): OrderStage | null {
  if (status === "DISPATCHED" || status === "DELIVERING") return "SHIPPING";
  return (ORDER_STAGES as readonly string[]).includes(status) ? (status as OrderStage) : null;
}

/** 주문 상품을 단계별로 센다 — 주문 목록 응답의 상품 상태만 쓴다(별도 집계 API가 없다) */
export function orderStageCounts(
  orders: readonly { items: readonly { status: string }[] }[],
): Record<OrderStage, number> {
  const counts = Object.fromEntries(ORDER_STAGES.map((stage) => [stage, 0])) as Record<
    OrderStage,
    number
  >;
  for (const order of orders) {
    for (const item of order.items) {
      const stage = stageOf(item.status);
      if (stage) counts[stage] += 1;
    }
  }
  return counts;
}

/** 결제수단 라벨 — 서버가 결제수단을 더하면 코드 그대로 보인다. 간편결제는 결제사 이름을 붙인다 */
const PAYMENT_METHOD_LABELS: Readonly<Record<string, string>> = lazyMessages({
  CARD: () => m.mypage_pay_card(),
  EASY_PAY: () => m.mypage_pay_easy(),
  BANK_TRANSFER: () => m.mypage_pay_bank_transfer(),
  VIRTUAL_ACCOUNT: () => m.mypage_pay_virtual_account(),
  MOBILE: () => m.mypage_pay_mobile(),
  POINT: () => m.mypage_pay_point(),
});

const EASY_PAY_LABELS: Readonly<Record<string, string>> = lazyMessages({
  NAVERPAY: () => m.mypage_easy_naverpay(),
  KAKAOPAY: () => m.mypage_easy_kakaopay(),
  TOSSPAY: () => m.mypage_easy_tosspay(),
  PAYCO: () => m.mypage_easy_payco(),
});

export function paymentMethodLabel(method: string, easyPayProvider?: string | null): string {
  const label = PAYMENT_METHOD_LABELS[method] ?? method;
  if (method !== "EASY_PAY" || !easyPayProvider) return label;
  return `${label} · ${EASY_PAY_LABELS[easyPayProvider] ?? easyPayProvider}`;
}
