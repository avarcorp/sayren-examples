import { ApiError } from "@sayren/storefront-sdk";

/** 쓰기 서버 함수의 결과 — 예상한 API 오류는 코드·문구로 돌려주고 화면이 그 자리에서 보인다 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string; retryAfterSeconds?: number };

export async function attempt<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        ok: false,
        status: error.status,
        code: error.code,
        message: error.message,
        retryAfterSeconds:
          typeof error.details?.retryAfterSeconds === "number"
            ? error.details.retryAfterSeconds
            : undefined,
      };
    }
    throw error;
  }
}
