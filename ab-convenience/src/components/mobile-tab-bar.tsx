import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, Home, Search, User } from "lucide-react";
import { m } from "../i18n";

const TABS = [
  { to: "/", label: () => m.tab_home(), Icon: Home, match: (path: string) => path === "/" },
  {
    to: "/search",
    label: () => m.tab_search(),
    Icon: Search,
    match: (path: string) => path.startsWith("/search") || path.startsWith("/products"),
  },
  {
    to: "/orders",
    label: () => m.tab_orders(),
    Icon: ClipboardList,
    match: (path: string) => path.startsWith("/orders"),
  },
  {
    to: "/account",
    label: () => m.tab_account(),
    Icon: User,
    match: (path: string) => path.startsWith("/account") || path === "/points",
  },
] as const;

/**
 * 모바일 하단 탭 — 배달앱처럼 홈·검색·주문 내역·내 정보.
 * 아래에 고정 버튼이 있는 화면(상품 상세 담기·장바구니 주문·주문서 결제)에서는 숨긴다
 */
export function hidesTabBar(path: string) {
  return (
    path.startsWith("/checkout") || path.startsWith("/cart") || /^\/products\/[^/]+/.test(path)
  );
}

export function MobileTabBar() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  if (hidesTabBar(path)) return null;
  return (
    <nav
      aria-label={m.tab_label()}
      className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-line border-t bg-page md:hidden"
    >
      {TABS.map((tab) => {
        const on = tab.match(path);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={on ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${
              on ? "font-bold text-brand" : "text-sub"
            }`}
          >
            <tab.Icon size={22} strokeWidth={2} aria-hidden />
            {tab.label()}
          </Link>
        );
      })}
    </nav>
  );
}
