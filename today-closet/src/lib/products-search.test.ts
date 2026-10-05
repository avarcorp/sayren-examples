import { describe, expect, it } from "vitest";
import {
  parseProductsSearch,
  parseSearchPage,
  toProductsSearch,
  toSearchPage,
} from "./products-search";

describe("상품 목록 URL 상태", () => {
  it("기본값(1페이지·추천순)과 빈 값은 비운다", () => {
    expect(parseProductsSearch({ page: 1, sort: "recommend", keyword: " " })).toEqual({
      keyword: undefined,
      categoryId: undefined,
      sort: undefined,
      page: undefined,
    });
  });

  it("라우터가 숫자로 푼 값도 문자열로 다시 읽는다", () => {
    expect(
      parseProductsSearch({ keyword: 123, page: 2, sort: "latest", categoryId: "cat_1" }),
    ).toEqual({ keyword: "123", categoryId: "cat_1", sort: "latest", page: 2 });
  });

  it("잘못된 정렬·페이지는 오류 대신 기본값으로 읽는다", () => {
    const search = parseProductsSearch({ sort: "cheapest", page: "abc" });
    expect(search.sort).toBeUndefined();
    expect(search.page).toBeUndefined();
  });
});

describe("검색 화면 URL 상태", () => {
  it("q를 검색어로 읽고 나머지는 상품 목록 규칙을 따른다", () => {
    expect(parseSearchPage({ q: " 코트 ", page: 2, sort: "priceAsc", minPrice: "0" })).toEqual({
      q: "코트",
      sort: "priceAsc",
      page: 2,
    });
    expect(parseSearchPage({ q: "  ", keyword: "무시" }).q).toBeUndefined();
  });

  it("상품 검색 조건과 옛 목록 검색 주소를 서로 바꾼다", () => {
    expect(toProductsSearch({ q: "니트", categoryId: "cat_1" })).toEqual({
      keyword: "니트",
      categoryId: "cat_1",
    });
    expect(toSearchPage({ keyword: "니트", maxPrice: 30000 })).toEqual({
      q: "니트",
      maxPrice: 30000,
    });
  });
});
