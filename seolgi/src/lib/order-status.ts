import type { MyOrder, MyOrderItem } from "@sayren/storefront-sdk";

/** 주문 상품 상태 이름 */
export const ITEM_STATUS: Record<string, string> = {
  PAYMENT_WAITING: "입금 대기",
  PAID: "결제 완료",
  CONFIRMED: "상품 준비 중",
  DISPATCHED: "발송 완료",
  DELIVERING: "배송 중",
  DELIVERED: "배송 완료",
  PURCHASE_DECIDED: "구매확정",
  CANCELED: "취소 완료",
};

/** 클레임 상태 이름 */
export const CLAIM_STATUS: Record<string, string> = {
  REQUESTED: "접수",
  HELD: "보류",
  COLLECTING: "회수 중",
  COLLECTED: "회수 완료",
  REDELIVERING: "재배송 중",
  APPROVED: "승인",
  REJECTED: "거절",
  COMPLETED: "완료",
  WITHDRAWN: "철회",
};

export const CLAIM_TYPE: Record<string, string> = {
  CANCEL: "취소",
  RETURN: "반품",
  EXCHANGE: "교환",
};

export const CLAIM_REASONS = [
  { value: "CHANGE_OF_MIND", label: "단순 변심" },
  { value: "WRONG_ORDER", label: "주문 실수" },
  { value: "DEFECTIVE", label: "상품 불량" },
  { value: "WRONG_DELIVERY", label: "오배송" },
  { value: "DIFFERENT_FROM_PAGE", label: "상품 정보와 다름" },
  { value: "DELAY", label: "배송 지연" },
] as const;

/** 주문 단계 막대 — 결제 완료 → 상품 준비 → 배송 중 → 배송 완료 → 구매확정 */
export const ORDER_STEPS = ["결제 완료", "상품 준비", "배송 중", "배송 완료", "구매확정"] as const;
const STEP_OF: Record<string, number> = {
  PAYMENT_WAITING: -1,
  PAID: 0,
  CONFIRMED: 1,
  DISPATCHED: 2,
  DELIVERING: 2,
  DELIVERED: 3,
  PURCHASE_DECIDED: 4,
};

/** 주문 전체가 지금 몇 번째 단계인가 — 취소만 남았으면 null */
export function orderStepIndex(order: MyOrder): number | null {
  const status = order.progressStatus ?? order.items.find((i) => i.status !== "CANCELED")?.status;
  if (!status || status === "CANCELED") return null;
  return STEP_OF[status] ?? 0;
}

const REOPENABLE_CLAIMS = new Set(["REJECTED", "WITHDRAWN"]);

export type ItemAction = "track" | "decide" | "cancel" | "return" | "review";

/**
 * 주문 상품마다 고를 수 있는 일 — 상태와 클레임 여부로 정한다(서버가 다시 확인한다).
 * 배송 조회는 발송 뒤, 구매확정·반품은 배송 완료 뒤, 취소는 발송 전, 리뷰는 서버가 쓸 수 있다고 한 상품만.
 */
export function itemActions(item: MyOrderItem): ItemAction[] {
  const actions: ItemAction[] = [];
  const shipped = ["DISPATCHED", "DELIVERING", "DELIVERED", "PURCHASE_DECIDED"].includes(
    item.status,
  );
  if (shipped && item.fulfillmentSnapshot.requiresShipping) actions.push("track");
  // 진행 중인 클레임이 없을 때만 새로 신청한다(거절·철회된 뒤에는 다시 신청할 수 있다)
  if (!item.claimStatus || REOPENABLE_CLAIMS.has(item.claimStatus)) {
    if (item.status === "PAID" || item.status === "CONFIRMED") actions.push("cancel");
    if (item.status === "DELIVERED") actions.push("return");
  }
  if (item.status === "DELIVERED") actions.push("decide");
  if (item.reviewWritable && !item.reviewWritten) actions.push("review");
  return actions;
}
