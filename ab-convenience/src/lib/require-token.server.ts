import { redirect } from "@tanstack/react-router";
import { readToken } from "./session.server";

/**
 * 로그인이 필요한 서버 함수의 구매자 토큰 — 없으면 로그인으로 보내고 돌아올 곳을 싣는다.
 * 서버 전용이다. 서버 함수 handler 안에서만 부른다(검사 규칙 server-only-import).
 */
export function requireToken(redirectTo: string): string {
  const accessToken = readToken();
  if (!accessToken) throw redirect({ to: "/login", search: { redirectTo } });
  return accessToken;
}
