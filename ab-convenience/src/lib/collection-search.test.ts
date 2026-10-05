import { describe, expect, it } from "vitest";
import { defaultCollectionSort, parseCollectionSearch } from "./collection-search";

describe("컬렉션 정렬", () => {
  it("응답 productSort(정렬 파라미터와 같은 소문자 값)를 그대로 기본 정렬로 쓴다", () => {
    expect(defaultCollectionSort("latest")).toBe("latest");
    expect(defaultCollectionSort("priceAsc")).toBe("priceAsc");
    expect(defaultCollectionSort("manual")).toBe("manual");
  });

  it("모르는 값은 진열순이다", () => {
    expect(defaultCollectionSort("bestSelling")).toBe("manual");
    expect(defaultCollectionSort("LATEST")).toBe("manual");
  });

  it("주소의 잘못된 정렬·페이지는 기본값으로 읽는다", () => {
    expect(parseCollectionSearch({ sort: "nope", page: "x" })).toEqual({
      sort: undefined,
      page: undefined,
    });
    expect(parseCollectionSearch({ sort: "priceDesc", page: "3" })).toEqual({
      sort: "priceDesc",
      page: 3,
    });
  });
});
