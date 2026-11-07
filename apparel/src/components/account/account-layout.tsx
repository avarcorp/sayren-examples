import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { m } from "../../i18n";
import { Container, PageTitle } from "../ui/page-title";

type AccountPath =
  | "/orders"
  | "/account/wishlist"
  | "/coupons"
  | "/points"
  | "/account/reviews"
  | "/account/inquiries"
  | "/account/support"
  | "/account";

const GROUPS: { title: () => string; links: { to: AccountPath; label: () => string }[] }[] = [
  {
    title: () => m.account_group_shopping(),
    links: [
      { to: "/orders", label: () => m.account_orders() },
      { to: "/account/wishlist", label: () => m.account_wishlist() },
    ],
  },
  {
    title: () => m.account_group_benefits(),
    links: [
      { to: "/coupons", label: () => m.account_coupons() },
      { to: "/points", label: () => m.account_points() },
    ],
  },
  {
    title: () => m.account_group_activity(),
    links: [
      { to: "/account/reviews", label: () => m.account_reviews() },
      { to: "/account/inquiries", label: () => m.footer_inquiries() },
      { to: "/account/support", label: () => m.footer_support() },
    ],
  },
  {
    title: () => m.account_group_info(),
    links: [{ to: "/account", label: () => m.account_profile() }],
  },
];

/** 마이페이지 메뉴 묶음 — 쇼핑·혜택·활동·정보. 모바일은 가로로 넘기는 칩, 데스크톱은 왼쪽 열 */
export function AccountNav() {
  const links = GROUPS.flatMap((g) => g.links);
  return (
    <>
      <nav
        aria-label={m.nav_account()}
        className="scroll-row -mx-4 overflow-x-auto px-4 pb-4 md:hidden"
      >
        <ul className="flex gap-2">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                activeOptions={{ exact: true }}
                className="flex min-h-10 items-center whitespace-nowrap border border-line-strong px-3 text-meta text-sub"
                activeProps={{ className: "border-point font-semibold text-point" }}
              >
                {link.label()}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label={m.nav_account()} className="hidden md:block">
        {GROUPS.map((group) => (
          <div key={group.title()} className="pb-6">
            <p className="pb-1 text-caption text-muted">{group.title()}</p>
            <ul>
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    activeOptions={{ exact: true }}
                    className="flex min-h-10 items-center text-body text-sub hover:text-ink"
                    activeProps={{ className: "font-semibold text-point" }}
                  >
                    {link.label()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}

/** 마이페이지 틀 — 제목, 메뉴, 본문 */
export function AccountLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Container>
      <PageTitle>{title}</PageTitle>
      <div className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:gap-10">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
