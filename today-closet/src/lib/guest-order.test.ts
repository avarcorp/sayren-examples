import { describe, expect, it } from "vitest";
import { guestLookupLockedMessage, normalizePhone } from "./guest-order";

describe("guestLookupLockedMessage", () => {
  it("남은 시간을 분 단위로 올려 알린다", () => {
    expect(guestLookupLockedMessage(1800)).toBe(
      "조회 시도가 너무 많습니다. 30분 뒤에 다시 시도해 주십시오",
    );
    expect(guestLookupLockedMessage(61)).toContain("2분 뒤");
  });

  it("남은 시간을 모르면 잠시 후로 안내한다", () => {
    expect(guestLookupLockedMessage(undefined)).toBe(
      "조회 시도가 너무 많습니다. 잠시 후 다시 시도해 주십시오",
    );
    expect(guestLookupLockedMessage("30")).toContain("잠시 후");
  });
});

describe("normalizePhone", () => {
  it("숫자만 남긴다", () => {
    expect(normalizePhone("010-1234 5678")).toBe("01012345678");
  });
});
