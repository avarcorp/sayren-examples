import type { CheckoutPricing, CheckoutSession } from "@sayren/storefront-sdk";
import { m } from "../i18n";
import { formatPrice } from "./format";

/** 주문서의 적립금 안내 — 회원이고 상점이 적립금 사용을 켰을 때만 온다 */
export type CheckoutPoints = NonNullable<CheckoutSession["points"]>;

/**
 * 적용한 적립금 — 금액 미리보기가 확인한 값이다. 결제 시작이 같은 금액을 `pointAmount`로 보낸다.
 * 결제 금액과 결제가 필요한지는 서버가 정한 값을 그대로 쓴다(화면이 계산하지 않는다)
 */
export interface AppliedPoints {
  amount: number;
  /** 남는 결제 금액이 1~99원이라 서버가 100원을 남기려고 줄였는가 */
  adjusted: boolean;
  /** 서버가 계산한 결제 금액(쿠폰·적립금 반영) */
  totalAmount: number;
  /** 결제수단으로 낼 금액이 남는가 — false면 결제수단을 고르지 않는다(서버 `paymentRequired`) */
  paymentRequired: boolean;
}

/** 결제 시작이 적립금 때문에 거절된 오류 코드 */
export const POINT_START_ERRORS = [
  "POINT_NOT_APPLICABLE",
  "POINT_BALANCE_CHANGED",
  "POINTS_UNAVAILABLE",
] as const;

/** 입력 칸 값 → 원 단위 정수. 쉼표는 허용하고, 숫자가 아니면 null이다 */
export function parsePointInput(value: string): number | null {
  const text = value.replaceAll(",", "").trim();
  if (text === "") return 0;
  if (!/^\d+$/.test(text)) return null;
  return Number(text);
}

/** 적용하지 못한 사유(`points.rejectReason`·오류 `details.reason`) → 안내 문구. 모르는 값은 일반 안내다 */
export function pointRejectMessage(
  reason: string | null | undefined,
  points: CheckoutPoints | null,
): string {
  switch (reason) {
    case "MIN_BALANCE":
      return m.points_error_min_balance({ amount: formatPrice(points?.minBalance ?? 0) });
    case "MIN_AMOUNT":
      return m.points_error_min_amount({ amount: formatPrice(points?.minAmount ?? 0) });
    case "NOT_PAYABLE":
    case "GUEST":
    case "USE_DISABLED":
      return m.points_error_not_payable();
    default:
      return m.points_error_default();
  }
}

/** 적립금 API 오류 코드 → 안내 문구 */
export function pointErrorMessage(
  code: string | null,
  reason: string | null | undefined,
  points: CheckoutPoints | null,
): string {
  switch (code) {
    case "POINTS_UNAVAILABLE":
      return m.points_error_unavailable();
    case "POINT_BALANCE_CHANGED":
      return m.points_error_balance_changed();
    case "POINT_NOT_APPLICABLE":
      return pointRejectMessage(reason, points);
    default:
      return m.points_error_default();
  }
}

/** 미리보기 결과 → 적용 값 또는 안내 문구 */
export function appliedPointsOf(
  pricing: Pick<CheckoutPricing, "amounts" | "points" | "paymentRequired">,
  points: CheckoutPoints | null,
): { applied: AppliedPoints | null; error: string | null } {
  const rejectReason = pricing.points?.rejectReason ?? null;
  if (rejectReason) return { applied: null, error: pointRejectMessage(rejectReason, points) };
  const amount = pricing.amounts.pointAmount;
  if (amount <= 0) return { applied: null, error: null };
  return {
    applied: {
      amount,
      adjusted: pricing.points?.adjustReason === "MIN_PAYMENT",
      totalAmount: pricing.amounts.totalAmount,
      paymentRequired: pricing.paymentRequired,
    },
    error: null,
  };
}
