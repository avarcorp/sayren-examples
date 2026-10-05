import { describe, expect, it } from "vitest";
import {
  canClaim,
  canReview,
  canTrack,
  claimableTypes,
  orderItemStatusLabel,
  orderItemTone,
  orderStageCounts,
  paymentMethodLabel,
} from "./order-status";

const SHIPPING = { type: "SHIPPING", requiresShipping: true } as const;
const MANUAL = { type: "MANUAL", requiresShipping: false } as const;

describe("주문 상품 상태 라벨", () => {
  it("배송 상품은 배송 단계로 보인다", () => {
    expect(orderItemStatusLabel("DELIVERED")).toBe("배송 완료");
    expect(orderItemStatusLabel("DELIVERED", SHIPPING)).toBe("배송 완료");
    expect(orderItemStatusLabel("CONFIRMED", SHIPPING)).toBe("발송 준비");
  });

  it("배송이 없는 상품의 DELIVERED는 제공 완료다", () => {
    expect(orderItemStatusLabel("DELIVERED", MANUAL)).toBe("제공 완료");
    expect(orderItemStatusLabel("CONFIRMED", MANUAL)).toBe("준비 중");
    expect(orderItemStatusLabel("PAID", MANUAL)).toBe("결제 완료");
    // 모르는 유형도 배송 여부로 가른다
    expect(orderItemStatusLabel("DELIVERED", { type: "OTHER", requiresShipping: false })).toBe(
      "제공 완료",
    );
  });

  it("모르는 상태는 코드 그대로다", () => {
    expect(orderItemStatusLabel("ON_HOLD", MANUAL)).toBe("ON_HOLD");
  });
});

describe("주문 상품 상태 색·행동", () => {
  it("배송 중은 info, 취소·진행 중 신청은 point, 구매 확정은 muted다", () => {
    expect(orderItemTone("DELIVERING")).toBe("info");
    expect(orderItemTone("DISPATCHED")).toBe("info");
    expect(orderItemTone("CANCELED")).toBe("point");
    expect(orderItemTone("DELIVERED", "REQUESTED")).toBe("point");
    expect(orderItemTone("DELIVERED", "WITHDRAWN")).toBe("ink");
    expect(orderItemTone("PURCHASE_DECIDED")).toBe("muted");
    expect(orderItemTone("PAID")).toBe("ink");
  });

  it("취소는 발송 전, 반품은 배송 완료 뒤에만 신청한다", () => {
    expect(claimableTypes({ status: "PAID" })).toEqual(["CANCEL"]);
    expect(claimableTypes({ status: "DELIVERING" })).toEqual([]);
    expect(claimableTypes({ status: "DELIVERED" })).toEqual(["RETURN"]);
    // 주문 흐름이 있으면 서버 행동이 기준이다(상태가 PAID여도 취소가 꺼져 있으면 없다)
    expect(
      claimableTypes({
        status: "PAID",
        actions: [
          { key: "CANCEL", enabled: false, subflow: "core.claim.cancel@1" },
          { key: "RETURN_REQUEST", enabled: true, subflow: "core.claim.return@1" },
        ],
      }),
    ).toEqual(["RETURN"]);
    expect(canClaim({ status: "PAID", claimStatus: null, activeQuantity: 1 })).toBe(true);
    expect(canClaim({ status: "PAID", claimStatus: "REQUESTED", activeQuantity: 1 })).toBe(false);
    expect(canClaim({ status: "PAID", claimStatus: null, activeQuantity: 0 })).toBe(false);
  });

  it("배송 조회는 발송 뒤의 배송 상품, 리뷰는 배송 완료 뒤 한 번이다", () => {
    expect(canTrack({ status: "DELIVERING", fulfillmentSnapshot: SHIPPING })).toBe(true);
    expect(canTrack({ status: "DELIVERED", fulfillmentSnapshot: MANUAL })).toBe(false);
    expect(canTrack({ status: "CONFIRMED", fulfillmentSnapshot: SHIPPING })).toBe(false);
    expect(canReview({ status: "PURCHASE_DECIDED", reviewWritten: false })).toBe(true);
    expect(canReview({ status: "DELIVERED", reviewWritten: true })).toBe(false);
  });
});

describe("주문 처리 현황", () => {
  it("상품 상태를 다섯 단계로 센다 — 발송 완료·배송 중은 한 칸, 결제 대기·취소는 뺀다", () => {
    const counts = orderStageCounts([
      { items: [{ status: "PAID" }, { status: "DISPATCHED" }, { status: "DELIVERING" }] },
      {
        items: [
          { status: "CANCELED" },
          { status: "PAYMENT_WAITING" },
          { status: "PURCHASE_DECIDED" },
        ],
      },
    ]);
    expect(counts).toEqual({
      PAID: 1,
      CONFIRMED: 0,
      SHIPPING: 2,
      DELIVERED: 0,
      PURCHASE_DECIDED: 1,
    });
  });
});

describe("결제수단 라벨", () => {
  it("아는 수단은 이름, 간편결제는 결제사를 붙이고 모르는 값은 그대로다", () => {
    expect(paymentMethodLabel("CARD")).toBe("신용·체크카드");
    expect(paymentMethodLabel("EASY_PAY", "KAKAOPAY")).toBe("간편결제 · 카카오페이");
    expect(paymentMethodLabel("CRYPTO")).toBe("CRYPTO");
  });
});
