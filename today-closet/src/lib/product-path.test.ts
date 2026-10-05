import { describe, expect, it } from "vitest";
import { isProductNoParam, productPathParam } from "./product-path";

describe("상품 주소 (이슈 #107)", () => {
  it("상품번호가 있으면 번호, 없으면 상품 id다", () => {
    expect(productPathParam({ productId: "prod_1", productNo: 12 })).toBe("12");
    expect(productPathParam({ productId: "prod_1", productNo: null })).toBe("prod_1");
    expect(productPathParam({ productId: "prod_1" })).toBe("prod_1");
  });

  it("숫자만인 경로 값이 상품번호다", () => {
    expect(isProductNoParam("12")).toBe(true);
    expect(isProductNoParam("prod_1")).toBe(false);
    expect(isProductNoParam("012")).toBe(false);
  });
});
