import { createServerFn } from "@tanstack/react-start";
import { authFor } from "../../lib/api.server";
import { clearDirectLine } from "../../lib/direct-checkout.server";
import { readToken, signOut } from "../../lib/session.server";

/**
 * 로그아웃 — 서버에서 이 구매자의 리프레시 토큰을 모두 폐기하고 세션 쿠키를 지운다.
 * 서버 호출이 실패해도 쿠키는 지운다(이 브라우저에서는 로그아웃된다).
 */
export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const accessToken = readToken();
  if (accessToken)
    await authFor()
      .signOut(accessToken)
      .catch(() => undefined);
  signOut();
  // 같은 브라우저를 다른 사람이 쓸 수 있다 — 바로구매에 적어 둔 입력값도 함께 지운다
  clearDirectLine();
});
