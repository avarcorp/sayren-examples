import { describe, expect, it } from "vitest";
import { safeRedirect } from "./safe-redirect";

describe("safeRedirect", () => {
  it("같은 사이트 경로는 그대로 둔다", () => {
    expect(safeRedirect("/cart")).toBe("/cart");
    expect(safeRedirect("/orders/ord_1?tab=items")).toBe("/orders/ord_1?tab=items");
  });

  it("외부로 나가는 주소와 빈 값은 기본 경로로 바꾼다", () => {
    for (const value of [
      null,
      "",
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "/\t/evil.com",
      "/\n/evil.com",
      "cart",
    ]) {
      expect(safeRedirect(value)).toBe("/orders");
    }
  });
});
