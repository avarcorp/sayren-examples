import { describe, expect, it } from "vitest";
import { appliedPointsOf, parsePointInput, pointErrorMessage, pointRejectMessage } from "./points";

const info = {
  enabled: true,
  balance: 5000,
  maxUsable: 5000,
  unit: 10,
  minAmount: 1000,
  minBalance: 2000,
};
const amounts = {
  productAmount: 30_000,
  deliveryFee: 3000,
  couponDiscountAmount: 0,
  deliveryDiscountAmount: 0,
  pointAmount: 0,
  totalAmount: 33_000,
};

describe("적립금", () => {
  it("입력은 쉼표를 허용하고 숫자가 아니면 null, 비우면 0이다", () => {
    expect(parsePointInput("1,000")).toBe(1000);
    expect(parsePointInput("")).toBe(0);
    expect(parsePointInput("12a")).toBeNull();
    expect(parsePointInput("-5")).toBeNull();
  });

  it("미리보기 결과 — 쓴 금액·100원 조정·거절 사유", () => {
    expect(
      appliedPointsOf(
        {
          amounts: { ...amounts, pointAmount: 32_900, totalAmount: 100 },
          paymentRequired: true,
          points: {
            balance: 50_000,
            maxUsable: 32_900,
            adjustReason: "MIN_PAYMENT",
            rejectReason: null,
          },
        },
        info,
      ),
    ).toEqual({
      applied: { amount: 32_900, adjusted: true, totalAmount: 100, paymentRequired: true },
      error: null,
    });
    // 결제가 필요한지는 서버 값을 그대로 옮긴다
    expect(
      appliedPointsOf(
        {
          amounts: { ...amounts, pointAmount: 33_000, totalAmount: 0 },
          paymentRequired: false,
          points: { balance: 50_000, maxUsable: 33_000, adjustReason: null, rejectReason: null },
        },
        info,
      ).applied,
    ).toMatchObject({ amount: 33_000, totalAmount: 0, paymentRequired: false });
    expect(
      appliedPointsOf(
        {
          amounts,
          paymentRequired: true,
          points: { balance: 500, maxUsable: 0, adjustReason: null, rejectReason: "MIN_BALANCE" },
        },
        info,
      ).error,
    ).toContain("2,000");
  });

  it("오류 코드와 사유를 안내 문구로 바꾸고 모르는 값은 일반 안내다", () => {
    expect(pointErrorMessage("POINT_BALANCE_CHANGED", null, info)).toContain("다시 적용");
    expect(pointErrorMessage("POINT_NOT_APPLICABLE", "MIN_AMOUNT", info)).toContain("1,000");
    expect(pointRejectMessage("NEW_REASON", info)).toContain("적용하지 못했습니다");
  });
});
