import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

/**
 * 서버 쿠키(구매자 세션·비회원 장바구니·바로구매 입력값)의 이름과 속성을 한 곳에서 정한다.
 * 프로덕션은 이름에 `__Host-`를 붙인다 — 브라우저가 `Secure`·`Path=/`·`Domain` 없음일 때만 받아서
 * 같은 상위 도메인의 다른 사이트가 심은 쿠키(세션 주입)가 들어오지 못한다. 접두사 없는 옛 이름은 읽지 않는다.
 * 개발 서버(http)는 `Secure`를 못 받는 브라우저가 있어 접두사 없이 쓴다.
 */
const SECURE = import.meta.env.PROD;

export const cookieName = (base: string): string => (SECURE ? `__Host-${base}` : base);

export function readServerCookie(base: string): string | undefined {
  return getCookie(cookieName(base));
}

export function writeServerCookie(base: string, value: string, maxAgeSec: number) {
  setCookie(cookieName(base), value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: SECURE,
    maxAge: maxAgeSec,
  });
}

/** 지울 때도 같은 속성을 준다 — `__Host-` 쿠키는 `Secure`·`Path=/` 없이 지우는 헤더를 거부한다 */
export function clearServerCookie(base: string) {
  deleteCookie(cookieName(base), { path: "/", secure: SECURE });
}
