import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { sessionQuery } from "./account-queries";

/** 회원 전용 화면 — 로그인하지 않았으면 로그인 화면으로 보내고, 로그인하면 이 주소로 돌아온다 */
export async function requireMember({
  context,
  location,
}: {
  context: { queryClient: QueryClient };
  location: { href: string };
}) {
  const session = await context.queryClient.ensureQueryData(sessionQuery());
  if (!session) throw redirect({ to: "/login", search: { redirect: location.href } });
}
