import { ApiError } from "@sayren/storefront-sdk";

/**
 * 구매자에게 보일 오류 문구 — sayren API가 준 구매자용 문구(`ApiError`)만 쓴다.
 * 네트워크·내부 오류(「Failed to fetch」, 검증 JSON 등)는 그대로 보이지 않고 `fallback`이다.
 */
export function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message ? error.message : fallback;
}
