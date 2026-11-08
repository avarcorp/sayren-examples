import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { m } from "../../i18n";
import { Container, PageTitle } from "../ui";

const GROUPS = () =>
  [
    {
      title: m.account_group_shopping(),
      links: [
        { to: "/orders", label: m.account_menu_orders() },
        { to: "/account/wishlist", label: m.account_menu_wishlist() },
      ],
    },
    {
      title: m.account_group_benefits(),
      links: [
        { to: "/coupons", label: m.account_menu_coupons() },
        { to: "/points", label: m.account_menu_points() },
      ],
    },
    {
      title: m.account_group_activity(),
      links: [
        { to: "/account/reviews", label: m.account_menu_reviews() },
        { to: "/account/inquiries", label: m.account_menu_inquiries() },
        { to: "/account/support", label: m.account_menu_support() },
      ],
    },
    {
      title: m.account_group_me(),
      links: [{ to: "/account", label: m.account_menu_profile() }],
    },
  ] as const;

/** 마이페이지 틀 — 390px은 위쪽 가로 메뉴, 1024px 이상은 왼쪽 메뉴 */
export function AccountLayout({ title, children }: { title: string; children: ReactNode }) {
  const groups = GROUPS();
  return (
    <Container className="pt-5">
      <div className="lg:grid lg:grid-cols-[12rem_1fr] lg:gap-10">
        <nav
          aria-label={m.nav_mypage()}
          className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-line border-b px-4 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-5 lg:border-0 lg:px-0"
        >
          {groups.map((group) => (
            <div key={group.title} className="flex shrink-0 gap-1 lg:flex-col">
              <p className="hidden pb-1 font-semibold text-caption text-muted lg:block">
                {group.title}
              </p>
              {group.links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  activeOptions={{ exact: true }}
                  className="flex min-h-11 shrink-0 items-center whitespace-nowrap px-2 text-meta text-sub lg:px-0 lg:text-body"
                  activeProps={{ className: "font-semibold text-point" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="flex min-w-0 flex-col gap-5">
          <PageTitle>{title}</PageTitle>
          {children}
        </div>
      </div>
    </Container>
  );
}
