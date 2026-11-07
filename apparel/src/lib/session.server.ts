import { createStorefrontAuth, type TokenPair } from "@sayren/storefront-sdk/auth";
import { buyerTokenOf, sessionClearHeader, sessionSetHeader } from "@sayren/storefront-sdk/server";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { apiFor } from "./api.server";
import { API_BASE_URL, resolveStoreCode } from "./config.server";
import { clearServerCookie, readServerCookie, writeServerCookie } from "./cookies.server";

/**
 * 구매자 세션 — sayren 호스팅에서는 플랫폼이 세션 쿠키를 소유하고 만료 전에 갱신한다. 사이트 코드는 요청마다
 * `buyerTokenOf(request)`로 액세스 토큰을 읽고, 로그인·로그아웃은 응답 헤더(`sessionSetHeader`·`sessionClearHeader`)로
 * 플랫폼에 알린다. 리프레시 토큰은 사이트 코드에 남지 않는다.
 *
 * 로컬 개발(`pnpm dev`)에는 플랫폼이 없어 개발 빌드에서만 HttpOnly 쿠키에 액세스 토큰을 둔다(갱신 없음, 30분).
 * 토큰은 모듈 변수에 두지 않고 요청마다 읽는다.
 */

const DEV_SESSION_COOKIE = "sayren_dev_member";
const CART_COOKIE = "sayren_cart";
const CART_MAX_AGE = 30 * 24 * 60 * 60;

export function readToken(): string | null {
  const fromPlatform = buyerTokenOf(getRequest());
  if (fromPlatform) return fromPlatform;
  if (import.meta.env.DEV) return readServerCookie(DEV_SESSION_COOKIE) ?? null;
  return null;
}

export function signIn(tokens: TokenPair) {
  setResponseHeader(...sessionSetHeader(tokens));
  if (import.meta.env.DEV)
    writeServerCookie(DEV_SESSION_COOKIE, tokens.accessToken, tokens.expiresIn);
  // 비회원 장바구니는 로그인할 때 회원 장바구니로 합쳐졌다
  clearServerCookie(CART_COOKIE);
}

export function signOutCookies() {
  setResponseHeader(...sessionClearHeader());
  if (import.meta.env.DEV) clearServerCookie(DEV_SESSION_COOKIE);
}

export function readCartToken(): string | null {
  return readServerCookie(CART_COOKIE) ?? null;
}

/** 이 요청의 구매자 API 클라이언트 — 회원 토큰과 비회원 장바구니 토큰을 함께 싣는다 */
export function buyerApi() {
  return apiFor({
    accessToken: readToken(),
    cartToken: readCartToken(),
    onCartToken: (token) => writeServerCookie(CART_COOKIE, token, CART_MAX_AGE),
  });
}

export function authFor() {
  return createStorefrontAuth({ baseUrl: API_BASE_URL, storeCode: resolveStoreCode() });
}
