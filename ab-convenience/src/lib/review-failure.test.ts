import { ApiError } from "@sayren/storefront-sdk";
import { describe, expect, it } from "vitest";
import { reviewFailureOf, uploadFailureOf } from "./review-failure";

describe("리뷰 작성·수정 실패 사유", () => {
  it("테스트 결제 주문 거절은 코드에 TEST가 들어 있으면 테스트 결제로 안내한다", () => {
    expect(reviewFailureOf(new ApiError(409, "REVIEW_TEST_PAYMENT_ORDER", "x")).reason).toBe(
      "TEST_PAYMENT",
    );
  });
  it("수정 기한이 지나면 PERIOD_EXPIRED, 그 밖의 거절은 작성 불가, 나머지는 알 수 없음", () => {
    expect(reviewFailureOf(new ApiError(409, "PERIOD_EXPIRED", "x")).reason).toBe("PERIOD_EXPIRED");
    expect(reviewFailureOf(new ApiError(409, "REVIEW_ALREADY_WRITTEN", "x")).reason).toBe(
      "NOT_WRITABLE",
    );
    expect(reviewFailureOf(new ApiError(500, "INTERNAL", "x")).reason).toBe("UNKNOWN");
    expect(reviewFailureOf(new Error("network")).reason).toBe("UNKNOWN");
  });
});

describe("리뷰 사진 업로드 실패 사유", () => {
  it("400 형식·413 크기·429 연타를 가른다", () => {
    expect(uploadFailureOf(new ApiError(400, "UNSUPPORTED_FILE_TYPE", "x"))).toBe(
      "UNSUPPORTED_FILE_TYPE",
    );
    expect(uploadFailureOf(new ApiError(413, "FILE_TOO_LARGE", "x"))).toBe("FILE_TOO_LARGE");
    expect(uploadFailureOf(new ApiError(429, "TOO_MANY_REQUESTS", "x"))).toBe("TOO_MANY_REQUESTS");
    expect(uploadFailureOf(new ApiError(500, "INTERNAL", "x"))).toBe("UNKNOWN");
  });
});
