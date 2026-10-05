import { describe, expect, it } from "vitest";
import { COUPON_CODE_PATTERN, couponErrorMessage, couponRejectMessage } from "./coupon-code";

describe("쿠폰 코드", () => {
  it("형식은 영문·숫자·-·_ 6~30자다", () => {
    expect(COUPON_CODE_PATTERN.test("FALL-10")).toBe(true);
    expect(COUPON_CODE_PATTERN.test("fall_2026")).toBe(true);
    expect(COUPON_CODE_PATTERN.test("ABC")).toBe(false);
    expect(COUPON_CODE_PATTERN.test("가을쿠폰코드")).toBe(false);
  });

  it("오류 코드와 적용하지 못한 사유를 안내 문구로 바꾸고 모르는 값은 일반 안내다", () => {
    expect(couponErrorMessage("COUPON_NOT_FOUND")).toContain("찾을 수 없습니다");
    expect(couponErrorMessage("SOMETHING_NEW")).toContain("적용하지 못했습니다");
    expect(couponRejectMessage("MIN_ORDER_AMOUNT")).toContain("최소 주문 금액");
    expect(couponRejectMessage("NEW_REASON")).toBe("이 주문에는 쓸 수 없는 쿠폰입니다.");
    expect(couponRejectMessage(null)).toBe("이 주문에는 쓸 수 없는 쿠폰입니다.");
  });
});
