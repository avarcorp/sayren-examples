import { describe, expect, it } from "vitest";
import { priceView } from "./price";

describe("가격 표시", () => {
  it("정가가 판매가보다 크면 정가 취소선과 할인율을 보인다", () => {
    expect(priceView({ salePrice: 79000, discountedPrice: null, originalPrice: 99000 })).toEqual({
      price: 79000,
      compareAt: 99000,
      rate: 20,
    });
  });
  it("정가가 없거나 판매가 이하이면 취소선·할인율이 없다", () => {
    expect(
      priceView({ salePrice: 29000, discountedPrice: null, originalPrice: null }).compareAt,
    ).toBeNull();
    expect(
      priceView({ salePrice: 29000, discountedPrice: null, originalPrice: 29000 }).rate,
    ).toBeNull();
    expect(
      priceView({ salePrice: 29000, discountedPrice: null, originalPrice: 25000 }).compareAt,
    ).toBeNull();
  });
  it("즉시할인이 있으면 할인가 기준으로 정가와 비교하고, 정가가 없으면 판매가와 비교한다", () => {
    expect(priceView({ salePrice: 100000, discountedPrice: 90000, originalPrice: 120000 })).toEqual(
      {
        price: 90000,
        compareAt: 120000,
        rate: 25,
      },
    );
    expect(priceView({ salePrice: 100000, discountedPrice: 90000, originalPrice: null })).toEqual({
      price: 90000,
      compareAt: 100000,
      rate: 10,
    });
  });
});
