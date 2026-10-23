import { createPayments, type Payments } from "@sayren/storefront-sdk/payments";
import { browserApi } from "./api";
import type { PublicConfig } from "./config";

/**
 * 결제 — 브라우저 전용. 결제 시작은 서버 함수가 하고(구매자 토큰을 서버에 둔다), 받은 값으로 `payments.open(start)`을
 * 부르면 SDK가 PG 결제창을 연다. 결과를 모르면(`PROCESSING`) 실패로 단정하지 않고 복귀 화면이 계속 조회한다.
 * 설정마다 하나만 만든다 — 같은 복귀를 두 번 읽어도 승인 요청이 한 번만 가도록 인스턴스가 기억한다.
 */
let cached: { key: string; payments: Payments } | null = null;

export function paymentsFor(config: PublicConfig): Payments {
  const key = `${config.apiBaseUrl}\u0000${config.storeCode}`;
  if (cached?.key !== key) {
    cached = { key, payments: createPayments({ client: browserApi(config) }) };
  }
  return cached.payments;
}

/** 결제 복귀 경로 — 주문서가 결제 시작 때 복귀 주소로 보낸다 */
export const PAYMENT_RETURN_PATH = "/checkout/return";
