import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AccountTemplate } from "../components/templates/account-template";
import { getAccountSummaryFn } from "../lib/account";
import { logoutFn } from "../lib/auth";

/** 마이페이지 묶음 — 로그인하지 않았으면 로그인으로 보내고 돌아온다 */
export const Route = createFileRoute("/account")({
  loader: ({ location }) => getAccountSummaryFn({ data: { redirectTo: location.href } }),
  head: () => ({ meta: [{ title: "마이페이지 | 설기로운" }] }),
  component: AccountLayout,
});

function AccountLayout() {
  const summary = Route.useLoaderData();
  const queryClient = useQueryClient();
  return (
    <AccountTemplate
      summary={summary}
      onLogout={() => {
        void logoutFn().then(() => {
          queryClient.clear();
          // 로그인 상태가 모든 화면에서 풀리도록 문서째 이동한다
          window.location.assign("/");
        });
      }}
    >
      <Outlet />
    </AccountTemplate>
  );
}
