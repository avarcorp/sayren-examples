import { describe, expect, it } from "vitest";
import { isNavActive } from "./nav";

describe("헤더 메뉴 선택 표시", () => {
  const at = (pathname: string, search: Record<string, unknown> = {}) => ({ pathname, search });

  it("경로와 메뉴의 검색 파라미터가 모두 같을 때만 켠다", () => {
    expect(
      isNavActive("/products?categoryId=cat_1", at("/products", { categoryId: "cat_1" })),
    ).toBe(true);
    expect(
      isNavActive("/products?categoryId=cat_1", at("/products", { categoryId: "cat_1", page: 2 })),
    ).toBe(true);
    expect(
      isNavActive("/products?categoryId=cat_1", at("/products", { categoryId: "cat_2" })),
    ).toBe(false);
    expect(isNavActive("/products?sort=latest", at("/products", { sort: "latest" }))).toBe(true);
    expect(isNavActive("/products?sort=latest", at("/products/abc"))).toBe(false);
  });

  it("카테고리 없는 메뉴는 카테고리를 고른 목록에서 켜지 않는다", () => {
    expect(
      isNavActive("/products?sort=latest", at("/products", { sort: "latest", categoryId: "c" })),
    ).toBe(false);
  });
});
