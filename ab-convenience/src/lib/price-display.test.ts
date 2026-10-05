import { describe, expect, it } from "vitest";
import { priceDisplayOf } from "./price-display";

describe("가격 표시", () => {
  it("정가가 판매가보다 크면 정가를 취소선으로, 할인율은 정가 기준으로 보인다", () => {
    expect(
      priceDisplayOf({ salePrice: 29000, discountedPrice: null, originalPrice: 39000 }),
    ).toEqual({ price: 29000, compareAt: 39000, rate: 26 });
  });

  it("즉시할인과 정가가 함께 있으면 할인 적용가와 정가를 비교한다", () => {
    expect(
      priceDisplayOf({ salePrice: 29000, discountedPrice: 26100, originalPrice: 39000 }),
    ).toEqual({ price: 26100, compareAt: 39000, rate: 33 });
  });

  it("정가가 없으면 즉시할인 때만 판매가를 취소선으로 보인다", () => {
    expect(
      priceDisplayOf({ salePrice: 10000, discountedPrice: 9000, originalPrice: null }),
    ).toEqual({ price: 9000, compareAt: 10000, rate: 10 });
    expect(priceDisplayOf({ salePrice: 10000, discountedPrice: null })).toEqual({
      price: 10000,
      compareAt: null,
      rate: null,
    });
  });

  it("정가가 구매자 가격보다 작거나 같으면 쓰지 않는다", () => {
    expect(
      priceDisplayOf({ salePrice: 10000, discountedPrice: null, originalPrice: 10000 }),
    ).toEqual({ price: 10000, compareAt: null, rate: null });
    expect(
      priceDisplayOf({ salePrice: 10000, discountedPrice: 9000, originalPrice: 8000 }),
    ).toEqual({ price: 9000, compareAt: 10000, rate: 10 });
  });
});
