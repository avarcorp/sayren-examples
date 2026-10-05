import { describe, expect, it } from "vitest";
import { couponBenefitText } from "../components/coupon-benefit";
import { couponApplicationsOf, couponRefOf } from "./coupon-code";

describe("쿠폰 참조", () => {
  it("코드 쿠폰은 code, 내 쿠폰은 issueId로 보낸다(둘 중 하나)", () => {
    const byCode = { code: "WELCOME3000", issueId: null, name: "신규", discountAmount: 3000 };
    const byIssue = { code: null, issueId: "iss_1", name: "지급", discountAmount: 1000 };
    expect(couponRefOf(byCode)).toEqual({ couponCode: "WELCOME3000" });
    expect(couponRefOf(byIssue)).toEqual({ couponIssueId: "iss_1" });
    expect(couponRefOf(null)).toEqual({});
    expect(couponApplicationsOf(couponRefOf(byCode))).toEqual([{ code: "WELCOME3000" }]);
    expect(couponApplicationsOf(couponRefOf(byIssue))).toEqual([{ issueId: "iss_1" }]);
    expect(couponApplicationsOf({})).toEqual([]);
  });

  it("혜택 표기는 서버의 혜택 정의를 옮길 뿐이다", () => {
    expect(couponBenefitText({ type: "AMOUNT", value: 3000, maxDiscountAmount: null })).toBe(
      "3,000원 할인",
    );
    expect(couponBenefitText({ type: "RATE", value: 10, maxDiscountAmount: 5000 })).toBe(
      "10% 할인 (최대 5,000원)",
    );
  });
});
