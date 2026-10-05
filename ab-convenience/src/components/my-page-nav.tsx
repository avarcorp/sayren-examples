import { Link, useHydrated } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { m } from "../i18n";
import { logout } from "./mypage/logout";

/** 마이페이지 메뉴 항목 — 셸의 `current`로 지금 화면을 표시한다 */
export type MyPageKey =
  | "home"
  | "orders"
  | "wishlist"
  | "coupons"
  | "points"
  | "reviews"
  | "inquiries"
  | "support"
  | "profile";

type MenuItem =
  | { key: "orders"; to: "/orders"; label: () => string }
  | { key: "wishlist"; to: "/account/wishlist"; label: () => string }
  | { key: "coupons"; to: "/coupons"; label: () => string }
  | { key: "points"; to: "/points"; label: () => string }
  | { key: "reviews"; to: "/account/reviews"; label: () => string }
  | { key: "inquiries"; to: "/account/inquiries"; label: () => string }
  | { key: "support"; to: "/account/support"; label: () => string };

/** 메뉴 묶음 — 쇼핑 정보·혜택·활동. 회원 정보(내 정보·로그아웃)는 따로 그린다 */
const GROUPS: { label: () => string; items: MenuItem[] }[] = [
  {
    label: () => m.mypage_group_shopping(),
    items: [
      { key: "orders", to: "/orders", label: () => m.account_menu_orders() },
      { key: "wishlist", to: "/account/wishlist", label: () => m.mypage_menu_wishlist() },
    ],
  },
  {
    label: () => m.mypage_group_benefits(),
    items: [
      { key: "coupons", to: "/coupons", label: () => m.account_menu_coupons() },
      { key: "points", to: "/points", label: () => m.account_menu_points() },
    ],
  },
  {
    label: () => m.mypage_group_activity(),
    items: [
      { key: "reviews", to: "/account/reviews", label: () => m.account_menu_reviews() },
      {
        key: "inquiries",
        to: "/account/inquiries",
        label: () => m.mypage_menu_product_inquiries(),
      },
      { key: "support", to: "/account/support", label: () => m.account_menu_support() },
    ],
  },
];

/** 로그아웃 — 로그아웃 상태가 모든 화면에 새로 반영되도록 문서째 이동한다 */
export function LogoutButton({ className }: { className: string }) {
  const hydrated = useHydrated();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={!hydrated || pending}
      onClick={() => {
        setPending(true);
        void logout().finally(() => window.location.assign("/"));
      }}
      className={className}
    >
      {m.account_logout()}
    </button>
  );
}

const SIDE_LINK = "text-body text-sub hover:text-ink";
const SIDE_CURRENT = "font-bold text-body text-ink";

/** 데스크톱(lg 이상) 왼쪽 메뉴 — 묶음 제목 아래 항목, 지금 화면은 굵게 */
export function MyPageSideNav({ current }: { current: MyPageKey }) {
  return (
    <nav aria-label={m.account_menu()} className="hidden flex-col gap-7 lg:flex">
      <Link to="/account" className="font-bold text-2xl tracking-tight">
        {m.account_title()}
      </Link>
      {GROUPS.map((group) => (
        <div key={group.label()} className="flex flex-col gap-3">
          <p className="font-bold text-body-lg">{group.label()}</p>
          {group.items.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              aria-current={current === item.key ? "page" : undefined}
              className={current === item.key ? SIDE_CURRENT : SIDE_LINK}
            >
              {item.label()}
            </Link>
          ))}
        </div>
      ))}
      <div className="flex flex-col items-start gap-3">
        <p className="font-bold text-body-lg">{m.mypage_group_member()}</p>
        <Link
          to="/account"
          search={{ view: "profile" }}
          aria-current={current === "profile" ? "page" : undefined}
          className={current === "profile" ? SIDE_CURRENT : SIDE_LINK}
        >
          {m.mypage_menu_profile()}
        </Link>
        <LogoutButton className={`${SIDE_LINK} disabled:opacity-50`} />
      </div>
    </nav>
  );
}

const ROW = "flex h-13 items-center justify-between gap-3 border-line border-b px-4 text-body-lg";

function RowChevron() {
  return <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted" />;
}

/** 모바일 마이페이지 홈의 메뉴 행 목록 — 하위 화면에는 탭을 두지 않고 여기서 들어간다 */
export function MyPageMenuList() {
  return (
    <nav aria-label={m.account_menu()} className="-mx-4 flex flex-col lg:hidden">
      {GROUPS.map((group) => (
        <div key={group.label()} className="flex flex-col">
          <p className="px-4 pt-5 pb-2 font-bold text-meta text-muted">{group.label()}</p>
          {group.items.map((item) => (
            <Link key={item.key} to={item.to} className={ROW}>
              {item.label()}
              <RowChevron />
            </Link>
          ))}
        </div>
      ))}
      <p className="px-4 pt-5 pb-2 font-bold text-meta text-muted">{m.mypage_group_member()}</p>
      <Link to="/account" search={{ view: "profile" }} className={ROW}>
        {m.mypage_menu_profile()}
        <RowChevron />
      </Link>
      <LogoutButton className={`${ROW} w-full text-left text-muted disabled:opacity-50`} />
    </nav>
  );
}
