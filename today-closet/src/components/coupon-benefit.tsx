import { m } from "../i18n";
import { formatPrice } from "../lib/format";

/** 쿠폰 혜택 표기 — 서버 응답의 혜택 정의(방식·값·최대)를 문장으로 옮길 뿐 할인액을 계산하지 않는다 */
export function couponBenefitText(benefit: {
  type: string;
  value: number;
  maxDiscountAmount: number | null;
}): string {
  if (benefit.type === "RATE") {
    return benefit.maxDiscountAmount
      ? m.coupons_benefit_rate_max({
          rate: benefit.value,
          max: formatPrice(benefit.maxDiscountAmount),
        })
      : m.coupons_benefit_rate({ rate: benefit.value });
  }
  return m.coupons_benefit_amount({ amount: formatPrice(benefit.value) });
}
