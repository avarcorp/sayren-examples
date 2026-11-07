import type { Cart, Member } from "@sayren/storefront-sdk";
import { ApiError } from "@sayren/storefront-sdk";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { notFoundAsNull } from "./api-errors";
import { buyerApi, readCartToken, readToken } from "./session.server";

/**
 * 구매자 데이터 조회(장바구니·주문서·주문·회원) — 서버 함수가 구매자 세션 쿠키로 읽는다.
 * 로그인하지 않았으면 `member`가 null이고, 회원 화면 loader가 /login으로 보낸다.
 */

const getSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ member: Member | null }> => {
    if (!readToken()) return { member: null };
    try {
      return { member: await buyerApi().member.me() };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return { member: null };
      throw error;
    }
  },
);

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

/** 회원 토큰도 장바구니 쿠키도 없으면 빈 장바구니다(API를 부르지 않는다) */
const getCart = createServerFn({ method: "GET" }).handler(async (): Promise<Cart> => {
  if (!readToken() && !readCartToken()) return EMPTY_CART;
  return buyerApi().cart.get();
});

const getCheckout = createServerFn({ method: "GET" })
  .validator(z.object({ checkoutId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const api = buyerApi();
    const [checkout, addresses] = await Promise.all([
      api.checkout.get(data.checkoutId),
      readToken() ? api.member.listAddresses().catch(() => []) : Promise.resolve([]),
    ]);
    return { checkout, addresses };
  });

const listOrders = createServerFn({ method: "GET" })
  .validator(z.object({ page: z.number().int().min(1) }))
  .handler(({ data }) => buyerApi().myOrders.list({ page: data.page, size: 10 }));

const getOrder = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string().min(1) }))
  .handler(async ({ data }) => {
    if (!readToken()) return null;
    return notFoundAsNull(buyerApi().myOrders.get(data.orderId));
  });

const getAccount = createServerFn({ method: "GET" }).handler(async () => {
  const api = buyerApi();
  const [member, addresses, points, consents] = await Promise.all([
    api.member.me(),
    api.member.listAddresses(),
    api.member.getPoints(),
    api.member.consents(),
  ]);
  return { member, addresses, points, consents };
});

const getPoints = createServerFn({ method: "GET" }).handler(async () => {
  const api = buyerApi();
  const [points, history] = await Promise.all([
    api.member.getPoints(),
    api.member.listPointHistory({ page: 1, size: 30 }),
  ]);
  return { points, history: history.contents };
});

const getCoupons = createServerFn({ method: "GET" }).handler(() =>
  buyerApi().me.coupons({ status: "available" }),
);
const getWishlist = createServerFn({ method: "GET" }).handler(async () => {
  const page = await buyerApi().member.listWishlist({ page: 1, size: 60 });
  return page.contents;
});
const getMyReviews = createServerFn({ method: "GET" }).handler(async () => {
  const api = buyerApi();
  const [writable, mine] = await Promise.all([
    api.reviews.listWritable(),
    api.reviews.listMine({ page: 1, size: 30 }),
  ]);
  return { writable, mine: mine.contents };
});
const getMyInquiries = createServerFn({ method: "GET" }).handler(async () => {
  const page = await buyerApi().inquiries.listMine({ page: 1, size: 30 });
  return page.contents;
});
const getSupportInquiries = createServerFn({ method: "GET" }).handler(async () => {
  const page = await buyerApi().me.customerInquiries.list({ page: 1, size: 30 });
  return page.contents;
});

export const sessionQuery = () =>
  queryOptions({ queryKey: ["session"], queryFn: () => getSession(), staleTime: 0 });
export const cartQuery = () => queryOptions({ queryKey: ["cart"], queryFn: () => getCart() });
export const checkoutQuery = (checkoutId: string) =>
  queryOptions({
    queryKey: ["checkout", checkoutId],
    queryFn: () => getCheckout({ data: { checkoutId } }),
    staleTime: 0,
  });
export const ordersQuery = (page: number) =>
  queryOptions({ queryKey: ["orders", page], queryFn: () => listOrders({ data: { page } }) });
export const orderQuery = (orderId: string) =>
  queryOptions({ queryKey: ["order", orderId], queryFn: () => getOrder({ data: { orderId } }) });
export const accountQuery = () =>
  queryOptions({ queryKey: ["account"], queryFn: () => getAccount() });
export const pointsQuery = () => queryOptions({ queryKey: ["points"], queryFn: () => getPoints() });
export const couponsQuery = () =>
  queryOptions({ queryKey: ["coupons"], queryFn: () => getCoupons() });
export const wishlistQuery = () =>
  queryOptions({ queryKey: ["wishlist"], queryFn: () => getWishlist() });
export const myReviewsQuery = () =>
  queryOptions({ queryKey: ["my-reviews"], queryFn: () => getMyReviews() });
export const myInquiriesQuery = () =>
  queryOptions({ queryKey: ["my-inquiries"], queryFn: () => getMyInquiries() });
export const supportInquiriesQuery = () =>
  queryOptions({ queryKey: ["support-inquiries"], queryFn: () => getSupportInquiries() });
