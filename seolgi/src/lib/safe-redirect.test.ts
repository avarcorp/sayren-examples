import { describe, expect, it } from "vitest";
import { safeRedirect } from "./safe-redirect";

describe("로그인 뒤 돌아갈 주소", () => {
  it("같은 사이트 경로만 받고 바깥 주소는 홈으로 바꾼다", () => {
    expect(safeRedirect("/products/2")).toBe("/products/2");
    expect(safeRedirect("//evil.com")).toBe("/");
    expect(safeRedirect("/\\evil.com")).toBe("/");
    expect(safeRedirect("https://evil.com")).toBe("/");
    expect(safeRedirect(undefined)).toBe("/");
    // 브라우저가 지우는 제어 문자로 `//evil.com`을 만드는 우회
    expect(safeRedirect("/\t/evil.com")).toBe("/");
    expect(safeRedirect("/\n/evil.com")).toBe("/");
    expect(safeRedirect("/products?sort=latest#reviews")).toBe("/products?sort=latest#reviews");
  });
});
