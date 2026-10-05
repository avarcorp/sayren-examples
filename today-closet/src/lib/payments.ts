import { createPayments, type Payments } from "@sayren/storefront-sdk/payments";
import { browserApi } from "./api";
import type { PublicConfig } from "./config";

/**
 * 결제 — 브라우저 전용. 이 파일은 그대로 두는 편이 좋다.
 *
 * 1. 결제 시작(`startPayment`)은 서버 함수에서 한다 — 구매자 토큰이 브라우저 JS에 노출되지 않는다.
 * 2. 결제창은 결제 서비스가 그린다. 버튼 클릭 시점에 `payments.prepareWindow()`로 빈 팝업을 먼저 열고
 *    (팝업 차단 회피), 서버 함수가 돌려준 결제 시작 값으로 `payments.open(start, { window })`을 부른다.
 * 3. 모바일이나 팝업 차단이면 같은 탭이 결제 서비스로 이동하고, 결제가 끝나면 복귀 화면(`/checkout/return`)으로
 *    돌아온다. 복귀 화면은 `payments.result()` 한 줄로 결과를 읽는다.
 * 4. 결과를 모르면(`PROCESSING`) 실패로 단정하지 말고 계속 조회한다 — 다시 결제하게 하면 이중 결제가 난다.
 * 5. 상점 플랫폼 설정 › 결제의 결제 도메인을 등록했다면 복귀 주소의 도메인이 그 안에 있어야 한다(비우면 https 모두 허용,
 *    테스트 결제는 localhost 허용).
 */
/**
 * 설정마다 하나만 만든다. `prepareWindow()`로 연 창과 그 결과를 기다리는 감시가 같은 인스턴스에 묶여 있어서,
 * 화면마다 새로 만들면 미리 연 창을 `open()`이 받지 못하고 이전 결제의 감시도 정리되지 않는다.
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
