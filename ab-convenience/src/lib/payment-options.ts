import { type AvailablePaymentOption, availablePaymentOptionSchema } from "@sayren/storefront-sdk";
import { z } from "zod";

/**
 * 결제 복귀 화면에서 다른 결제수단으로 다시 결제(`payments.retry`)할 때 보여 줄 결제 옵션 — 브라우저 전용.
 *
 * 옵션은 주문서를 만들 때만 내려온다. 복귀 화면(리다이렉트 결제)은 새 문서라 주문서가 준 옵션을 모르므로,
 * 주문서가 결제창을 열기 전에 결제 id별로 탭 저장소(sessionStorage)에 남겨 둔다. 개인정보·토큰은 없다.
 * 모바일 결제 앱을 거쳐 다른 탭으로 돌아오면 남은 값이 없고, 그때는 주문서로 돌아가 새로 결제한다.
 */
const KEY_PREFIX = "sayren.paymentOptions.";
const storedOptions = z.array(availablePaymentOptionSchema);

export function rememberPaymentOptions(paymentId: string, options: AvailablePaymentOption[]) {
  try {
    window.sessionStorage.setItem(`${KEY_PREFIX}${paymentId}`, JSON.stringify(options));
  } catch {
    // 저장소를 못 쓰는 브라우저(사생활 보호 모드 등) — 복귀 화면이 주문서로 돌아가라고 안내한다
  }
}

export function recallPaymentOptions(paymentId: string): AvailablePaymentOption[] {
  try {
    const raw = window.sessionStorage.getItem(`${KEY_PREFIX}${paymentId}`);
    if (!raw) return [];
    const parsed = storedOptions.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function forgetPaymentOptions(paymentId: string) {
  try {
    window.sessionStorage.removeItem(`${KEY_PREFIX}${paymentId}`);
  } catch {
    // 지우지 못해도 결제에는 영향이 없다
  }
}
