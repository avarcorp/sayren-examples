import { useSuspenseQuery } from "@tanstack/react-query";
import {
  addressesQuery,
  cartQuery,
  checkoutQuery,
  claimsQuery,
  couponsQuery,
  myInquiriesQuery,
  myReviewsQuery,
  orderQuery,
  ordersQuery,
  pointHistoryQuery,
  pointsQuery,
  sessionQuery,
  supportItemQuery,
  supportQuery,
  wishlistQuery,
  writableReviewsQuery,
} from "../lib/account-queries";

/** 구매자 훅 — loader가 같은 queryOptions로 먼저 받아 둔다 */
export const useSession = () => useSuspenseQuery(sessionQuery()).data;
export const useCart = () => useSuspenseQuery(cartQuery()).data;
export const useCheckout = (checkoutId: string) => useSuspenseQuery(checkoutQuery(checkoutId)).data;
export const useAddresses = () => useSuspenseQuery(addressesQuery()).data;
export const useOrders = (page: number) => useSuspenseQuery(ordersQuery(page)).data;
export const useOrder = (orderId: string) => useSuspenseQuery(orderQuery(orderId)).data;
export const useClaims = () => useSuspenseQuery(claimsQuery()).data;
export const usePoints = () => useSuspenseQuery(pointsQuery()).data;
export const usePointHistory = () => useSuspenseQuery(pointHistoryQuery()).data;
export const useCoupons = () => useSuspenseQuery(couponsQuery()).data;
export const useWishlist = () => useSuspenseQuery(wishlistQuery()).data;
export const useWritableReviews = () => useSuspenseQuery(writableReviewsQuery()).data;
export const useMyReviews = () => useSuspenseQuery(myReviewsQuery()).data;
export const useMyInquiries = () => useSuspenseQuery(myInquiriesQuery()).data;
export const useSupport = () => useSuspenseQuery(supportQuery()).data;
export const useSupportItem = (inquiryId: string) =>
  useSuspenseQuery(supportItemQuery(inquiryId)).data;
