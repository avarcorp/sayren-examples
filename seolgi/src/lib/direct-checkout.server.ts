import { clearServerCookie, readServerCookie, writeServerCookie } from "./cookies.server";
import { decodeLine, encodeLine, type LineRequest } from "./line-request";

/**
 * 추가 선택·직접 입력이 있는 바로구매 — 조건을 URL 대신 30분 HttpOnly 쿠키에 둔다.
 * 각인 문구 같은 입력값이 방문 기록·서버 로그·리퍼러에 남지 않게 한다. 주문서는 진입마다 세션을 새로 만들므로
 * 쿠키는 주문 완료·로그아웃·탈퇴 때 지우고, 그 밖에는 만료에 맡긴다.
 */
const DIRECT_COOKIE = "sayren_direct";
const MAX_AGE_SEC = 60 * 30;

export function writeDirectLine(line: LineRequest) {
  writeServerCookie(DIRECT_COOKIE, encodeLine(line), MAX_AGE_SEC);
}

export function readDirectLine(): LineRequest | null {
  return decodeLine(readServerCookie(DIRECT_COOKIE));
}

export function clearDirectLine() {
  clearServerCookie(DIRECT_COOKIE);
}
