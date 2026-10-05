import { m } from "../i18n";

/**
 * 비회원 주문 조회 잠금 안내 — API는 주문번호마다 시도 한도를 두고, 넘으면 429 `TOO_MANY_REQUESTS`와
 * 남은 시간(`details.retryAfterSeconds`)을 준다. 남은 시간은 분 단위로 올려 알린다.
 */
export function guestLookupLockedMessage(retryAfterSeconds: unknown): string {
  const minutes =
    typeof retryAfterSeconds === "number" && retryAfterSeconds > 0
      ? Math.ceil(retryAfterSeconds / 60)
      : null;
  return minutes ? m.guest_order_locked_minutes({ minutes }) : m.guest_order_locked();
}

/** 비회원 조회에 싣는 연락처 — 숫자만 남긴다 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}
