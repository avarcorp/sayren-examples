import type { MyOrder } from "@sayren/storefront-sdk";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CouponTicket } from "./coupon-ticket";
import { MyPageShell } from "./my-page-shell";
import { OrderCard } from "./order-card";

async function render(node: ReactNode): Promise<string> {
  const rootRoute = createRootRoute({ component: () => <>{node}</> });
  const paths = [
    "/",
    "/account",
    "/orders",
    "/orders/$orderId",
    "/coupons",
    "/points",
    "/account/wishlist",
    "/account/reviews",
    "/account/reviews/write/$orderItemId",
    "/account/inquiries",
    "/account/support",
    "/account/support/new",
  ];
  const router = createRouter({
    routeTree: rootRoute.addChildren(
      paths.map((path) => createRoute({ getParentRoute: () => rootRoute, path })),
    ),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    isServer: true,
  });
  await router.load();
  return renderToString(<RouterProvider router={router} />);
}

const item = {
  orderItemId: "oi_1",
  orderItemNo: "2026100200010001",
  productId: "prod_1",
  productName: "울 블렌드 체크 롱코트",
  thumbnailUrl: null,
  optionName: "네이비 / M",
  quantity: 1,
  canceledQuantity: 0,
  activeQuantity: 1,
  totalPrice: 189000,
  couponDiscountAmount: 0,
  pointAllocation: 0,
  status: "DELIVERING",
  fulfillmentSnapshot: { type: "SHIPPING", requiresShipping: true },
  fulfillment: null,
  claimStatus: null,
  reviewWritten: false,
  autoDecisionDate: null,
  optionSelections: [],
  customInputs: [],
} as MyOrder["items"][number];

const order = {
  orderId: "ord_1",
  orderNo: "2026100200010001",
  orderedAt: "2026-10-02T03:00:00.000Z",
  items: [
    item,
    { ...item, orderItemId: "oi_2", status: "DELIVERED" },
    { ...item, orderItemId: "oi_3", status: "PAID" },
  ],
} as MyOrder;

describe("마이페이지 셸·주문 카드", () => {
  it("셸은 데스크톱 메뉴(묶음·현재 항목)와 페이지 제목을 그린다", async () => {
    const html = await render(
      <MyPageShell current="orders" title="주문 내역">
        <p>본문</p>
      </MyPageShell>,
    );
    expect(html).toContain("쇼핑 정보");
    expect(html).toContain("찜한 상품");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-label="마이페이지로"');
    expect(html).toContain("주문 내역</h1>");
  });

  it("주문 카드는 상태별 행동을 보인다 — 배송 중은 배송 조회, 배송 완료는 리뷰 쓰기, 결제 완료는 취소·반품 신청", async () => {
    const html = await render(<OrderCard order={order} />);
    expect(html).toContain("text-info");
    expect(html).toContain("배송 조회");
    expect(html).toContain("리뷰 쓰기");
    expect(html).toContain("취소·반품 신청");
    expect(html).toContain("track=oi_1");
    expect(html).toContain("orderItemId=oi_3");
  });

  it("쿠폰 티켓은 혜택·이름·상태 칸을 그린다", async () => {
    const html = await render(
      <CouponTicket benefit="3,000원 할인" name="웰컴 쿠폰" stub="사용 가능" />,
    );
    expect(html).toContain("3,000원 할인");
    expect(html).toContain("사용 가능");
  });
});
