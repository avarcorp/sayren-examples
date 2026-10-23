import { apiFor } from "./api.server";
import { readCartToken, writeCartToken } from "./cart-session.server";
import { readToken } from "./session.server";

/** 이 요청의 장바구니 API — 비회원 토큰이 새로 발급되면 응답 쿠키에 다시 심는다 */
export function cartApi() {
  const cartToken = readCartToken();
  let issued: string | null = null;
  const api = apiFor({
    accessToken: readToken(),
    cartToken: () => issued ?? cartToken ?? undefined,
    onCartToken: (t) => (issued = t),
  });
  const persist = () => {
    const token = issued ?? cartToken;
    if (token) writeCartToken(token);
  };
  return { api, persist, hasCart: Boolean(readToken() || cartToken) };
}
