import { ApiError, type Cart, claimReasonSchema, claimTypeSchema } from "@sayren/storefront-sdk";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buyerApi, isSignedIn } from "./buyer.server";
import { readCartToken } from "./session.server";

/**
 * 구매자 조회 — 세션·장바구니·주문서·주문·마이페이지. 토큰은 요청마다 서버 함수 안에서 읽는다.
 * 로그인이 필요한 화면은 loader가 세션을 먼저 보고 로그인 화면으로 보낸다(`requireMember`).
 */

/** 없는 자원·로그인 만료(404·401)는 null */
async function orNull<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 401)) return null;
    throw error;
  }
}

const EMPTY_CART: Cart = {
  items: [],
  summary: {
    currency: "KRW",
    productAmount: 0,
    deliveryFee: 0,
    totalAmount: 0,
    requiresShipping: false,
  },
};

/** 로그인한 구매자. 비로그인이면 null */
const getSession = createServerFn({ method: "GET" }).handler(() =>
  isSignedIn() ? orNull(() => buyerApi().member.me()) : null,
);

/** 구매자 토큰도 장바구니 쿠키도 없으면 빈 장바구니다(API를 부르지 않는다) */
const getCart = createServerFn({ method: "GET" }).handler(() =>
  isSignedIn() || readCartToken() ? buyerApi().cart.get() : EMPTY_CART,
);

const getCheckout = createServerFn({ method: "GET" })
  .validator(z.object({ checkoutId: z.string().min(1) }))
  .handler(({ data }) => orNull(() => buyerApi().checkout.get(data.checkoutId)));

const listAddresses = createServerFn({ method: "GET" }).handler(() =>
  buyerApi().member.listAddresses(),
);

const listOrders = createServerFn({ method: "GET" })
  .validator(z.object({ page: z.number().int().min(1) }))
  .handler(({ data }) => buyerApi().myOrders.list({ page: data.page, size: 10 }));

const getOrder = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string().min(1) }))
  .handler(({ data }) => orNull(() => buyerApi().myOrders.get(data.orderId)));

const getDelivery = createServerFn({ method: "GET" })
  .validator(z.object({ orderItemId: z.string().min(1) }))
  .handler(({ data }) => orNull(() => buyerApi().myOrders.getDelivery(data.orderItemId)));

/** 반품·교환·취소 미리보기 — 예상 환불 금액과 반품 배송비(서버 계산) */
export const previewClaim = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderItemId: z.string().min(1),
      type: claimTypeSchema,
      reason: claimReasonSchema,
      exchangeOptionId: z.string().min(1).optional(),
    }),
  )
  .handler(({ data }) =>
    buyerApi().myClaims.preview(data.orderItemId, {
      type: data.type,
      reason: data.reason,
      exchangeOptionId: data.exchangeOptionId,
    }),
  );

const listClaims = createServerFn({ method: "GET" }).handler(() =>
  buyerApi().myClaims.list({ page: 1, size: 50 }),
);

const getPoints = createServerFn({ method: "GET" }).handler(() => buyerApi().member.getPoints());

const listPointHistory = createServerFn({ method: "GET" }).handler(() =>
  buyerApi().member.listPointHistory({ page: 1, size: 50 }),
);

const listCoupons = createServerFn({ method: "GET" }).handler(() =>
  buyerApi().me.coupons({ status: "available" }),
);

const listWishlist = createServerFn({ method: "GET" }).handler(() =>
  buyerApi().member.listWishlist({ page: 1, size: 60 }),
);

const listWritableReviews = createServerFn({ method: "GET" }).handler(() =>
  buyerApi().reviews.listWritable(),
);

const listMyReviews = createServerFn({ method: "GET" }).handler(() =>
  buyerApi().reviews.listMine({ page: 1, size: 50 }),
);

const listMyInquiries = createServerFn({ method: "GET" }).handler(() =>
  buyerApi().inquiries.listMine({ page: 1, size: 50 }),
);

const listCustomerInquiries = createServerFn({ method: "GET" }).handler(() =>
  buyerApi().me.customerInquiries.list({ page: 1, size: 50 }),
);

const getCustomerInquiry = createServerFn({ method: "GET" })
  .validator(z.object({ inquiryId: z.string().min(1) }))
  .handler(({ data }) => orNull(() => buyerApi().me.customerInquiries.get(data.inquiryId)));

export const sessionQuery = () =>
  queryOptions({ queryKey: ["session"], queryFn: () => getSession() });

export const cartQuery = () => queryOptions({ queryKey: ["cart"], queryFn: () => getCart() });

export const checkoutQuery = (checkoutId: string) =>
  queryOptions({
    queryKey: ["checkout", checkoutId],
    queryFn: () => getCheckout({ data: { checkoutId } }),
  });

export const addressesQuery = () =>
  queryOptions({ queryKey: ["me", "addresses"], queryFn: () => listAddresses() });

export const ordersQuery = (page: number) =>
  queryOptions({ queryKey: ["me", "orders", page], queryFn: () => listOrders({ data: { page } }) });

export const orderQuery = (orderId: string) =>
  queryOptions({
    queryKey: ["me", "order", orderId],
    queryFn: () => getOrder({ data: { orderId } }),
  });

export const deliveryQuery = (orderItemId: string) =>
  queryOptions({
    queryKey: ["me", "delivery", orderItemId],
    queryFn: () => getDelivery({ data: { orderItemId } }),
  });

export const claimsQuery = () =>
  queryOptions({ queryKey: ["me", "claims"], queryFn: () => listClaims() });

export const pointsQuery = () =>
  queryOptions({ queryKey: ["me", "points"], queryFn: () => getPoints() });

export const pointHistoryQuery = () =>
  queryOptions({ queryKey: ["me", "points", "history"], queryFn: () => listPointHistory() });

export const couponsQuery = () =>
  queryOptions({ queryKey: ["me", "coupons"], queryFn: () => listCoupons() });

export const wishlistQuery = () =>
  queryOptions({ queryKey: ["me", "wishlist"], queryFn: () => listWishlist() });

export const writableReviewsQuery = () =>
  queryOptions({ queryKey: ["me", "reviews", "writable"], queryFn: () => listWritableReviews() });

export const myReviewsQuery = () =>
  queryOptions({ queryKey: ["me", "reviews"], queryFn: () => listMyReviews() });

export const myInquiriesQuery = () =>
  queryOptions({ queryKey: ["me", "inquiries"], queryFn: () => listMyInquiries() });

export const supportQuery = () =>
  queryOptions({ queryKey: ["me", "support"], queryFn: () => listCustomerInquiries() });

export const supportItemQuery = (inquiryId: string) =>
  queryOptions({
    queryKey: ["me", "support", inquiryId],
    queryFn: () => getCustomerInquiry({ data: { inquiryId } }),
  });
