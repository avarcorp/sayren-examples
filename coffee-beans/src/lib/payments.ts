import type { AvailablePaymentOption } from "@sayren/storefront-sdk";
import { createPayments } from "@sayren/storefront-sdk/payments";
import { browserApi } from "./api";
import type { PublicConfig } from "./config";

/**
 * 브라우저 결제 모듈 — 결제창 열기(`open`)·복귀 결과(`result`)·재시도(`retry`)·상태 조회. 결제 시작은 서버 함수가 한다.
 * 모듈 최상위에서 만들지 않는다(클릭·effect 때 만든다)
 */
export function paymentsFor(config: PublicConfig) {
  return createPayments({ client: browserApi(config) });
}

/**
 * 결제 옵션 목록을 결제 id별로 이 탭에 남긴다 — 복귀 화면이 실패·취소 뒤 다른 옵션으로 다시 결제할 때 고를 목록이다.
 * 금액·주문 같은 서버 데이터가 아니라 결제창 선택지다. 저장소를 못 쓰면 재시도 목록 없이 주문 내역으로 안내한다
 */
const key = (paymentId: string) => `wsg-payment-options:${paymentId}`;

export function rememberPaymentOptions(paymentId: string, options: AvailablePaymentOption[]) {
  try {
    window.sessionStorage.setItem(key(paymentId), JSON.stringify(options));
  } catch {
    // 저장소를 못 쓰는 브라우저 — 재시도 목록 없이 동작한다
  }
}

export function recallPaymentOptions(paymentId: string): AvailablePaymentOption[] {
  try {
    const raw = window.sessionStorage.getItem(key(paymentId));
    return raw ? (JSON.parse(raw) as AvailablePaymentOption[]) : [];
  } catch {
    return [];
  }
}
