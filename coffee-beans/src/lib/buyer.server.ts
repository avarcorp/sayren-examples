import { apiFor } from "./api.server";
import { readAccessToken, readCartToken, writeCartToken } from "./session.server";

/** 구매자 요청용 API 클라이언트 — 요청마다 구매자 토큰과 비회원 장바구니 토큰을 읽는다 */
export function buyerApi() {
  return apiFor({
    accessToken: readAccessToken(),
    cartToken: readCartToken(),
    onCartToken: writeCartToken,
  });
}

export function isSignedIn(): boolean {
  return readAccessToken() !== null;
}
