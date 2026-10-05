import type { CouponResult } from "@sayren/storefront-sdk";
import { m } from "../i18n";

/**
 * 적용한 쿠폰 — 금액 미리보기가 적용을 확인한 값이다. 결제 시작이 같은 쿠폰을 `coupons`로 보낸다.
 * 코드 입력형은 `code`, 내 쿠폰(셀러 지급)은 `issueId`로 가리킨다. 할인액은 서버 미리보기 값이다.
 */
export interface AppliedCoupon {
  code: string | null;
  issueId: string | null;
  name: string;
  discountAmount: number;
}

/** 서버 함수에 넘길 쿠폰 참조 — 코드와 issueId 중 하나다 */
export function couponRefOf(coupon: AppliedCoupon | null): {
  couponCode?: string;
  couponIssueId?: string;
} {
  if (!coupon) return {};
  if (coupon.issueId) return { couponIssueId: coupon.issueId };
  return coupon.code ? { couponCode: coupon.code } : {};
}

/** 금액 미리보기·결제 시작의 `coupons` 값 */
export function couponApplicationsOf(ref: {
  couponCode?: string;
  couponIssueId?: string;
}): Array<{ code: string } | { issueId: string }> {
  if (ref.couponIssueId) return [{ issueId: ref.couponIssueId }];
  return ref.couponCode ? [{ code: ref.couponCode }] : [];
}

/** 쿠폰 코드 형식 — 영문·숫자·`-`·`_` 6~30자. 서버가 다시 검사한다 */
export const COUPON_CODE_PATTERN = /^[A-Za-z0-9_-]{6,30}$/;

/** 쿠폰 API 오류 코드 → 안내 문구. 모르는 코드는 일반 안내다 */
export function couponErrorMessage(code: string | null): string {
  switch (code) {
    case "COUPON_NOT_FOUND":
      return m.coupon_code_error_not_found();
    case "TOO_MANY_REQUESTS":
      return m.coupon_code_error_too_many_requests();
    case "COUPONS_UNAVAILABLE":
      return m.coupon_code_error_unavailable();
    case "COUPON_IN_USE":
      return m.coupon_code_error_in_use();
    case "COUPON_LIMIT_REACHED":
      return m.coupon_code_error_limit_reached();
    case "COUPON_EXHAUSTED":
      return m.coupon_code_error_exhausted();
    case "COUPON_CHANGED":
      return m.coupon_code_error_changed();
    case "PAYMENT_AMOUNT_TOO_LOW":
      return m.coupon_code_error_amount_too_low();
    default:
      return m.coupon_code_error_default();
  }
}

/** 적용하지 못한 사유 → 안내 문구. 사유는 늘 수 있어 모르는 값은 일반 안내다 */
export function couponRejectMessage(reason: CouponResult["rejectReason"]): string {
  switch (reason) {
    case "MIN_ORDER_AMOUNT":
      return m.coupon_code_reject_min_order_amount();
    case "NO_ELIGIBLE_ITEMS":
    case "LINE_NOT_ELIGIBLE":
      return m.coupon_code_reject_not_eligible();
    case "MEMBER_ONLY":
      return m.coupon_code_reject_member_only();
    case "NOT_STARTED":
      return m.coupon_code_reject_not_started();
    case "EXPIRED":
      return m.coupon_code_reject_expired();
    case "IN_USE":
      return m.coupon_code_reject_in_use();
    case "LIMIT_REACHED":
      return m.coupon_code_reject_limit_reached();
    case "EXHAUSTED":
      return m.coupon_code_reject_exhausted();
    default:
      return m.coupon_code_reject_default();
  }
}
