import { describe, expect, it } from "vitest";
import { pageTitle } from "./page-title";

const root = { loaderData: { store: { name: "나의첫번째몰", logoUrl: null } } };

describe("pageTitle", () => {
  it("화면 이름 뒤에 상점 이름을 붙인다", () => {
    expect(pageTitle([root, { loaderData: {} }], "회원가입")).toBe("회원가입 | 나의첫번째몰");
  });

  it("화면 이름이 없으면 상점 이름만 쓴다", () => {
    expect(pageTitle([root])).toBe("나의첫번째몰");
  });

  it("상점 이름을 읽지 못하면 기본 이름을 쓴다", () => {
    expect(pageTitle([{ loaderData: { store: null } }], "장바구니")).toBe("장바구니 | 상점");
    expect(pageTitle([], "장바구니")).toBe("장바구니 | 상점");
  });
});
