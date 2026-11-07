import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { sessionQuery } from "./account-queries";

/** 회원 화면 loader의 첫 줄 — 로그인하지 않았으면 로그인 화면으로 보내고 돌아올 주소를 넘긴다 */
export async function requireMember(queryClient: QueryClient, next: string) {
  const session = await queryClient.ensureQueryData(sessionQuery());
  if (!session.member) throw redirect({ to: "/login", search: { next } });
  return session.member;
}
