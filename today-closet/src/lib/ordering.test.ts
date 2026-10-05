import { describe, expect, it } from "vitest";
import { orderingOf } from "./ordering";

describe("주문 받기 상태", () => {
  it("주문을 받으면 버튼을 그리고 안내가 없다", () => {
    expect(orderingOf({ checkoutAvailable: true, customerCenterPhone: "02-1234-5678" })).toEqual({
      open: true,
      notice: null,
      phone: null,
    });
  });

  it("주문을 받지 않으면 버튼 대신 안내와 문의 전화를 보인다", () => {
    expect(orderingOf({ checkoutAvailable: false, customerCenterPhone: "02-1234-5678" })).toEqual({
      open: false,
      notice: "지금은 온라인 주문을 받지 않습니다",
      phone: "02-1234-5678",
    });
    expect(orderingOf({ checkoutAvailable: false, customerCenterPhone: " " }).phone).toBeNull();
  });

  it("상점 설정을 읽지 못하면 주문을 받는 것으로 둔다(결제 요청이 최종 판정)", () => {
    expect(orderingOf(null).open).toBe(true);
  });
});
