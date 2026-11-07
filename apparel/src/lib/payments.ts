import type { AvailablePaymentOption } from "@sayren/storefront-sdk";
import { createPayments, type Payments } from "@sayren/storefront-sdk/payments";
import { browserApi } from "./api";
import type { PublicConfig } from "./config";

/**
 * 브라우저 결제 모듈 — 설정마다 인스턴스 하나만 둔다(미리 연 결제창은 그 창을 만든 인스턴스만 쓸 수 있다).
 * 브라우저에서만 부른다(클릭 핸들러·effect 안).
 */
let instance: { key: string; payments: Payments } | null = null;

export function paymentsFor(config: PublicConfig): Payments {
  const key = `${config.apiBaseUrl}|${config.storeCode}`;
  if (instance?.key !== key) {
    instance = {
      key,
      payments: createPayments({
        client: browserApi(config),
        returnUrl: new URL("/checkout/return", window.location.origin).toString(),
      }),
    };
  }
  return instance.payments;
}

/**
 * 결제 옵션 기억 — 결제창에서 돌아와 실패·취소면 같은 결제를 다른 옵션으로 다시 시도하게 한다(payments.retry).
 * 결제 id별로 이 탭의 sessionStorage에만 둔다. 개인정보가 아니다
 */
const OPTIONS_KEY = (paymentId: string) => `daily-basic:payment-options:${paymentId}`;

export function rememberPaymentOptions(paymentId: string, options: AvailablePaymentOption[]) {
  try {
    window.sessionStorage.setItem(OPTIONS_KEY(paymentId), JSON.stringify(options));
  } catch {
    // 저장소를 못 쓰면 실패 화면에서 주문서로 돌아가게 한다
  }
}

export function recallPaymentOptions(paymentId: string): AvailablePaymentOption[] {
  try {
    const raw = window.sessionStorage.getItem(OPTIONS_KEY(paymentId));
    return raw ? (JSON.parse(raw) as AvailablePaymentOption[]) : [];
  } catch {
    return [];
  }
}
