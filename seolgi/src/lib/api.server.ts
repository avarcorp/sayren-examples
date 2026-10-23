import { analyticsIdsFromCookie, createStorefrontClient } from "@sayren/storefront-sdk";
import { createStorefrontAuth } from "@sayren/storefront-sdk/auth";
import { getRequest } from "@tanstack/react-start/server";
import { mockFetch } from "../mock";
import { API_BASE_URL, MOCK, resolveStoreCode } from "./config.server";

/** mock 모드면 SDK의 fetch 자리에 mock 서버를 끼운다. 그림 주소에 붙일 사이트 주소는 이 요청에서 읽는다 */
function fetchFor(): typeof fetch | undefined {
  return MOCK ? mockFetch(new URL(getRequest().url).origin) : undefined;
}

/**
 * 서버 함수에서 쓰는 스토어프론트 API 클라이언트. 요청마다 만든다 — 모듈 전역에 두면 서버 렌더에서
 * 다른 구매자의 토큰이 섞인다. 방문 분석 쿠키를 실어 장바구니·주문 이벤트를 방문과 잇는다.
 */
export function apiFor(
  options: {
    accessToken?: string | null;
    /** 함수로 넘기면 요청마다 읽는다 — 한 요청 안에서 새로 발급한 토큰을 바로 쓴다 */
    cartToken?: string | null | (() => string | undefined);
    onCartToken?: (token: string) => void;
  } = {},
) {
  const request = getRequest();
  return createStorefrontClient({
    baseUrl: API_BASE_URL,
    storeCode: resolveStoreCode(),
    accessToken: options.accessToken ?? undefined,
    cartToken: options.cartToken ?? undefined,
    onCartToken: options.onCartToken,
    fetch: fetchFor(),
    ...analyticsIdsFromCookie(request.headers.get("cookie")),
  });
}

/** 구매자 인증(로그인·가입·토큰 갱신) — 결과 토큰은 `session.server.ts`가 HttpOnly 쿠키에 둔다 */
export function authFor() {
  return createStorefrontAuth({
    baseUrl: API_BASE_URL,
    storeCode: resolveStoreCode(),
    fetch: fetchFor(),
  });
}
