import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { cartQuery, sessionQuery, wishlistQuery } from "../lib/account-queries";

/** 로그인한 구매자 — 비로그인이면 null */
export function useSession() {
  return useSuspenseQuery(sessionQuery()).data;
}

export function useCart() {
  return useSuspenseQuery(cartQuery()).data;
}

/**
 * 찜 여부 — 로그인한 구매자만 찜 목록을 받는다. 서버 목록이 원천이고 화면이 따로 상태를 들지 않는다
 */
export function useWishlisted(productId: string): boolean {
  const session = useSession();
  const wishlist = useQuery({ ...wishlistQuery(), enabled: session !== null });
  return wishlist.data?.contents.some((p) => p.productId === productId) ?? false;
}
