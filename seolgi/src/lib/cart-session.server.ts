import { clearServerCookie, readServerCookie, writeServerCookie } from "./cookies.server";

/**
 * 비회원 장바구니 토큰 — 서버가 `X-Cart-Token`으로 발급한다. 비회원은 이 토큰이 유일한 열쇠라
 * 잃으면 담은 상품이 사라진다. 서버 함수 안에서만 부른다.
 */
const CART_COOKIE = "sayren_cart";

export function readCartToken(): string | null {
  return readServerCookie(CART_COOKIE) || null;
}

export function writeCartToken(token: string) {
  writeServerCookie(CART_COOKIE, token, 60 * 60 * 24 * 30);
}

/** 로그인하며 회원 장바구니로 합쳐진 뒤 지운다 */
export function clearCartToken() {
  clearServerCookie(CART_COOKIE);
}
