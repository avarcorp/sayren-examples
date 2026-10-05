import { analyticsIdsFromCookie, createStorefrontClient } from "@sayren/storefront-sdk";
import { createStorefrontAuth } from "@sayren/storefront-sdk/auth";
import { getRequest } from "@tanstack/react-start/server";
import { API_BASE_URL, resolveStoreCode } from "./config.server";

/**
 * 서버(서버 함수·서버 라우트)에서 쓰는 스토어프론트 API 클라이언트.
 *
 * 테넌트는 `X-Store-Code` 헤더로 보낸다. 토큰은 요청마다 넘긴다 — 모듈 전역에 담으면 서버 렌더에서
 * 다른 사용자의 요청에 섞인다.
 *
 * 방문 분석 쿠키(방문자·세션)를 헤더로 실어 서버가 기록하는 장바구니·결제·구매 이벤트를 방문과 잇는다.
 *
 * 비회원 장바구니 토큰은 서버가 새로 발급할 수 있다. `onCartToken`으로 받아 쿠키에 다시 심는다.
 */
export function apiFor(
  options: {
    accessToken?: string | null;
    cartToken?: string | null;
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
    ...analyticsIdsFromCookie(request.headers.get("cookie")),
  });
}

/**
 * 구매자 인증 — 로그인·가입·비회원 세션·토큰 갱신. 화면은 이 앱이 그리고 계정은 sayren이 보관한다.
 * 결과 토큰은 `session.server.ts`가 HttpOnly 쿠키에 둔다.
 */
export function authFor() {
  return createStorefrontAuth({ baseUrl: API_BASE_URL, storeCode: resolveStoreCode() });
}
