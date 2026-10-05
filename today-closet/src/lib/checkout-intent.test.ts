import { describe, expect, it } from "vitest";
import { checkoutIntentFrom, checkoutSearch } from "./checkout-intent";

describe("주문서 진입 의도", () => {
  it("장바구니 항목이 있으면 장바구니 주문이다", () => {
    expect(checkoutIntentFrom(checkoutSearch.parse({ cartItemId: ["a", "b"] }))).toEqual({
      cartItemIds: ["a", "b"],
    });
    expect(checkoutIntentFrom(checkoutSearch.parse({ cartItemId: "a" }))).toEqual({
      cartItemIds: ["a"],
    });
  });

  it("상품이 있으면 바로구매이고 수량은 1 이상 정수로 맞춘다", () => {
    expect(checkoutIntentFrom(checkoutSearch.parse({ productId: "p", quantity: "2.7" }))).toEqual({
      directItem: { productId: "p", optionId: undefined, quantity: 2 },
    });
    expect(
      checkoutIntentFrom(checkoutSearch.parse({ productId: "p", optionId: "o", quantity: -1 })),
    ).toEqual({ directItem: { productId: "p", optionId: "o", quantity: 1 } });
  });

  it("direct=1이면 쿠키의 바로구매 한 줄을 쓰고, 주소의 상품과 다르거나 없으면 null이다", () => {
    const line = {
      productId: "p",
      quantity: 1,
      addons: [{ groupId: "g", valueId: "v" }],
      customInputs: [{ inputId: "i", value: "HAPPY" }],
    };
    const search = checkoutSearch.parse({ direct: "1", productId: "p" });
    expect(search.direct).toBe(1);
    expect(checkoutIntentFrom(search, line)).toEqual({ directItem: line });
    expect(checkoutIntentFrom(search, { ...line, productId: "other" })).toBeNull();
    expect(checkoutIntentFrom(search, null)).toBeNull();
    // 다른 값은 무시한다 — 주소 조건의 바로구매로 돌아간다
    expect(checkoutSearch.parse({ direct: "yes" }).direct).toBeUndefined();
  });

  it("조건이 없으면 null이다", () => {
    expect(checkoutIntentFrom(checkoutSearch.parse({}))).toBeNull();
    expect(checkoutIntentFrom(checkoutSearch.parse({ cartItemId: [] }))).toBeNull();
  });
});
