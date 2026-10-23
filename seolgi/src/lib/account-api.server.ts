import { ApiError } from "@sayren/storefront-sdk";
import { redirect } from "@tanstack/react-router";
import { apiFor } from "./api.server";
import { messageOf } from "./errors";
import { readToken } from "./session.server";

/** 구매자 토큰이 있는 API — 없으면 로그인으로 보낸다(돌아올 곳은 부르는 쪽이 정한다) */
export function memberApi(redirectTo = "/account") {
  const accessToken = readToken();
  if (!accessToken) throw redirect({ to: "/login", search: { redirectTo } });
  return apiFor({ accessToken });
}

/** 쓰기 한 번 — 실패는 서버 문구로 돌려주고, 토큰이 풀렸으면 로그인으로 보낸다 */
export async function act(
  job: () => Promise<unknown>,
  fallback: string,
): Promise<{ error: string | null }> {
  try {
    await job();
    return { error: null };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      throw redirect({ to: "/login", search: { redirectTo: "/account" } });
    return { error: messageOf(error, fallback) };
  }
}
