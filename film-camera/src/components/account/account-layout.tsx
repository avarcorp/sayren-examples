import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { m } from "../../i18n";
import { PageHeader } from "../ui";

type Item = { to: LinkProps["to"]; label: () => string };

const GROUPS: { label: () => string; items: Item[] }[] = [
  {
    label: () => m.account_group_shopping(),
    items: [
      { to: "/orders", label: () => m.account_orders() },
      { to: "/account/wishlist", label: () => m.account_wishlist() },
    ],
  },
  {
    label: () => m.account_group_benefits(),
    items: [
      { to: "/coupons", label: () => m.account_coupons() },
      { to: "/points", label: () => m.account_points() },
    ],
  },
  {
    label: () => m.account_group_activity(),
    items: [
      { to: "/account/reviews", label: () => m.account_reviews() },
      { to: "/account/inquiries", label: () => m.account_inquiries() },
      { to: "/account/support", label: () => m.account_support() },
    ],
  },
];

/** 마이페이지 메뉴 — 쇼핑 / 혜택 / 활동. 모바일은 가로로 밀어 보는 줄, 데스크톱은 왼쪽 열 */
export function AccountMenu() {
  return (
    <nav
      aria-label={m.account_title()}
      className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0"
    >
      <div className="flex gap-5 lg:flex-col lg:gap-6">
        <Link
          to="/account"
          activeOptions={{ exact: true }}
          activeProps={{ className: "font-bold text-ink" }}
          className="inline-flex min-h-11 shrink-0 items-center text-body text-sub hover:text-ink"
        >
          {m.account_profile()}
        </Link>
        {GROUPS.map((group) => (
          <div key={group.label()} className="contents lg:flex lg:flex-col lg:items-start">
            <p className="hidden pb-1 font-bold text-caption text-muted lg:block">
              {group.label()}
            </p>
            {group.items.map((item) => (
              <Link
                key={String(item.to)}
                to={item.to}
                activeProps={{ className: "font-bold text-ink" }}
                className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap text-body text-sub hover:text-ink"
              >
                {item.label()}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}

export function AccountLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-12">
      <div className="border-line border-b lg:border-0">
        <AccountMenu />
      </div>
      <main className="flex min-w-0 flex-col gap-6">
        <PageHeader title={title} />
        {children}
      </main>
    </div>
  );
}
