import { describe, expect, it } from "vitest";
import { decodeLine, encodeLine, LineTooLargeError } from "./line-request";

describe("바로구매 한 줄 쿠키 값", () => {
  it("한글 입력값을 그대로 되살린다", () => {
    const line = {
      productId: "p1",
      optionId: "var_1",
      quantity: 2,
      addons: [{ groupId: "g", valueId: "v" }],
      customInputs: [{ inputId: "i", value: "생일 축하해! 😀" }],
    };
    const encoded = encodeLine(line);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeLine(encoded)).toEqual(line);
  });

  it("쿠키 한도를 넘으면 쓰기 전에 거절한다", () => {
    const value = "가".repeat(1000);
    expect(() =>
      encodeLine({
        productId: "p1",
        quantity: 1,
        customInputs: [
          { inputId: "a", value },
          { inputId: "b", value },
        ],
      }),
    ).toThrow(LineTooLargeError);
  });

  it("망가진 값·형식이 다른 값은 null이다", () => {
    expect(decodeLine(undefined)).toBeNull();
    expect(decodeLine("###")).toBeNull();
    expect(decodeLine(encodeLine({ productId: "p", quantity: 1 }).slice(0, 5))).toBeNull();
    expect(decodeLine(btoa(JSON.stringify({ productId: 1 })))).toBeNull();
  });
});
