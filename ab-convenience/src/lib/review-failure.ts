import { ApiError } from "@sayren/storefront-sdk";

/**
 * 리뷰 작성·수정·삭제 실패 사유 — 테스트 결제 주문은 플랫폼이 리뷰를 막는다(응답 코드에 TEST가 들어 있다).
 * 수정 기한(작성 후 30일)이 지나면 409 `PERIOD_EXPIRED`다.
 */
export type ReviewFailure = "TEST_PAYMENT" | "PERIOD_EXPIRED" | "NOT_WRITABLE" | "UNKNOWN";

export function reviewFailureOf(error: unknown): { reason: ReviewFailure; code: string | null } {
  if (!(error instanceof ApiError)) return { reason: "UNKNOWN", code: null };
  const code = error.code ?? null;
  if (code && /TEST/i.test(code)) return { reason: "TEST_PAYMENT", code };
  if (code === "PERIOD_EXPIRED") return { reason: "PERIOD_EXPIRED", code };
  if ([403, 404, 409, 422].includes(error.status)) return { reason: "NOT_WRITABLE", code };
  return { reason: "UNKNOWN", code };
}

/** 리뷰 사진 업로드 자리 발급 실패 — 400 형식·413 크기·429 연타 */
export type UploadFailure =
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "TOO_MANY_REQUESTS"
  | "UNKNOWN";

export function uploadFailureOf(error: unknown): UploadFailure {
  if (!(error instanceof ApiError)) return "UNKNOWN";
  if (error.status === 429 || error.code === "TOO_MANY_REQUESTS") return "TOO_MANY_REQUESTS";
  if (error.status === 413 || error.code === "FILE_TOO_LARGE") return "FILE_TOO_LARGE";
  if (error.status === 400 || error.code === "UNSUPPORTED_FILE_TYPE")
    return "UNSUPPORTED_FILE_TYPE";
  return "UNKNOWN";
}
