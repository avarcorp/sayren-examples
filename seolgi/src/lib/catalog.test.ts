import { describe, expect, it } from "vitest";
import { keywordSearchSchema, productListSearchSchema } from "./catalog";

describe("주소 검색 파라미터", () => {
  it("틀린 값은 버리고 맞는 값만 남긴다(목록·검색 화면이 500으로 깨지지 않는다)", () => {
    expect(
      productListSearchSchema.parse({ page: 0, sort: "bad", categoryId: 123, freeShipping: "x" }),
    ).toEqual({
      categoryId: "123",
      sort: undefined,
      freeShipping: undefined,
      page: undefined,
    });
    expect(
      productListSearchSchema.parse({ page: 2, sort: "latest", categoryId: "cat_1" }),
    ).toMatchObject({
      page: 2,
      sort: "latest",
      categoryId: "cat_1",
    });
    expect(keywordSearchSchema.parse({ keyword: "", page: "abc" })).toEqual({
      keyword: undefined,
      page: undefined,
    });
  });
});
