import type { MyOrderItem } from "@sayren/storefront-sdk";
import { describe, expect, it } from "vitest";
import { itemActions } from "./order-status";

const item = (patch: Partial<MyOrderItem>): MyOrderItem =>
  ({
    status: "DELIVERED",
    claimStatus: null,
    reviewWritable: false,
    reviewWritten: false,
    fulfillmentSnapshot: { type: "SHIPPING", requiresShipping: true },
    ...patch,
  }) as MyOrderItem;

describe("주문 상품에서 고를 수 있는 일", () => {
  it("진행 중인 클레임이 있으면 막고, 거절·철회된 뒤에는 다시 신청할 수 있다", () => {
    expect(itemActions(item({ claimStatus: "REQUESTED" }))).not.toContain("return");
    expect(itemActions(item({ claimStatus: "REJECTED" }))).toContain("return");
    expect(itemActions(item({ claimStatus: "WITHDRAWN" }))).toContain("return");
    expect(itemActions(item({ status: "PAID", claimStatus: "WITHDRAWN" }))).toContain("cancel");
  });
});
