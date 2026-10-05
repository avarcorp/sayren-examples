import { describe, expect, it } from "vitest";
import { formatDateTime, formatPrice } from "./format";

describe("표시 형식", () => {
  it("가격은 천 단위로 끊고 원을 붙인다", () => {
    expect(formatPrice(129000)).toBe("129,000원");
  });

  it("시각은 서울 시간 24시간제 숫자로 쓴다(서버·브라우저 결과가 같다)", () => {
    expect(formatDateTime("2026-09-24T13:05:00.000Z")).toBe("2026. 9. 24. 22:05");
    expect(formatDateTime("2026-09-24T15:00:00.000Z")).toBe("2026. 9. 25. 00:00");
    expect(formatDateTime(null)).toBe("-");
  });
});
