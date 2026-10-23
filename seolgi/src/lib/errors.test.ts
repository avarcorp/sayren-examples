import { ApiError } from "@sayren/storefront-sdk";
import { describe, expect, it } from "vitest";
import { messageOf } from "./errors";

describe("구매자에게 보일 오류 문구", () => {
  it("sayren API 문구만 보이고 네트워크·내부 오류는 대신 문구로 바꾼다", () => {
    expect(messageOf(new ApiError(409, "OUT_OF_STOCK", "품절된 상품입니다"), "실패")).toBe(
      "품절된 상품입니다",
    );
    expect(messageOf(new TypeError("Failed to fetch"), "실패")).toBe("실패");
    expect(messageOf(new Error('[{"code":"invalid_type"}]'), "실패")).toBe("실패");
  });
});
