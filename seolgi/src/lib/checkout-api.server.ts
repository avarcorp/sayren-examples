import { apiFor } from "./api.server";
import { readCartToken } from "./cart-session.server";
import { readToken } from "./session.server";

/** 주문서 API — 회원 토큰과 비회원 장바구니 토큰을 함께 싣는다 */
export function checkoutApi() {
  return apiFor({ accessToken: readToken(), cartToken: readCartToken() });
}
