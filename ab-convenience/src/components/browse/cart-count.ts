import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { apiFor } from "../../lib/api.server";
import { readCartToken } from "../../lib/cart-session.server";
import { readToken } from "../../lib/session.server";

/**
 * 장바구니에 담긴 줄 수 — 헤더 배지. 회원은 액세스 토큰, 비회원은 장바구니 토큰으로 찾는다.
 * 둘 다 없으면 서버에 묻지 않는다. 실패해도 헤더는 그린다(배지만 숨긴다).
 */
const getCartCount = createServerFn({ method: "GET" }).handler(async (): Promise<number> => {
  const accessToken = readToken();
  const cartToken = readCartToken();
  if (!accessToken && !cartToken) return 0;
  const cart = await apiFor({ accessToken, cartToken })
    .cart.get()
    .catch(() => null);
  return cart?.items.length ?? 0;
});

/** 장바구니를 바꾼 화면은 이 키를 무효화하면 배지가 바로 바뀐다. 헤더도 화면을 옮길 때마다 다시 받는다 */
export const CART_COUNT_KEY = ["cart", "count"] as const;

export const cartCountQuery = () =>
  queryOptions({ queryKey: CART_COUNT_KEY, queryFn: () => getCartCount(), staleTime: 0 });
