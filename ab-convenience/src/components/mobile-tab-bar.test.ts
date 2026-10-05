import { describe, expect, it } from "vitest";
import { hidesTabBar } from "./mobile-tab-bar";

describe("모바일 하단 탭", () => {
  it("아래 고정 버튼이 있는 화면에서만 숨긴다", () => {
    expect(hidesTabBar("/")).toBe(false);
    expect(hidesTabBar("/products")).toBe(false);
    expect(hidesTabBar("/orders/ord_1")).toBe(false);
    expect(hidesTabBar("/products/12")).toBe(true);
    expect(hidesTabBar("/cart")).toBe(true);
    expect(hidesTabBar("/checkout")).toBe(true);
  });
});
