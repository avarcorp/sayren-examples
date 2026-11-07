import { ApiError } from "@sayren/storefront-sdk";
import { m } from "../i18n";

/** 없는 자원(404)은 null로 바꾼다. 다른 오류는 그대로 던진다 */
export async function notFoundAsNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * 서버 함수의 실패 결과 — 로그인이 필요하면 로그인 안내, 그 밖의 API 오류는 서버 문구, 모르는 오류는 기본 문구
 */
export function failureOf(error: unknown): { ok: false; code: string; message: string } {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return { ok: false, code: "UNAUTHORIZED", message: m.error_login_required() };
    }
    return { ok: false, code: error.code, message: error.message || m.common_error_retry() };
  }
  return { ok: false, code: "UNKNOWN", message: m.common_error_retry() };
}
