import { Link } from "@tanstack/react-router";
import type { AccountSummary } from "../../lib/account";
import { formatMoney } from "../../lib/format";

const MENU = [
  {
    title: "쇼핑",
    items: [
      { to: "/account", label: "주문 내역", exact: true },
      { to: "/account/claims", label: "취소·반품·교환" },
      { to: "/account/wishlist", label: "찜한 상품" },
      { to: "/account/coupons", label: "쿠폰" },
      { to: "/account/points", label: "적립금" },
    ],
  },
  {
    title: "활동",
    items: [
      { to: "/account/reviews", label: "리뷰" },
      { to: "/account/inquiries", label: "상품 문의" },
      { to: "/account/support", label: "1:1 문의" },
    ],
  },
  {
    title: "계정",
    items: [
      { to: "/account/profile", label: "회원 정보" },
      { to: "/account/addresses", label: "배송지 관리" },
    ],
  },
] as const;

/**
 * 마이페이지 메뉴 (시안 DOrder 왼쪽) — 이름·적립금·쿠폰 수와 쇼핑·활동·계정 묶음. 모바일에서는 가로로 흐른다.
 */
export function AccountNav({
  summary,
  onLogout,
}: {
  summary: AccountSummary;
  onLogout: () => void;
}) {
  return (
    <nav
      aria-label="마이페이지"
      className="flex w-full min-w-0 flex-col gap-7 md:max-w-[240px] md:flex-[1_1_200px]"
    >
      <div className="flex flex-col gap-1.5">
        <span className="font-display text-name">{summary.member.name}님</span>
        <span className="text-muted text-small">
          적립금 {formatMoney(summary.points?.balance ?? summary.member.point)} · 쿠폰{" "}
          {summary.couponCount}장
        </span>
      </div>
      <div className="-mx-4 flex gap-6 overflow-x-auto px-4 md:mx-0 md:flex-col md:gap-7 md:overflow-visible md:px-0">
        {MENU.map((group) => (
          <div key={group.title} className="flex shrink-0 gap-4 md:flex-col md:gap-0">
            <span className="hidden pb-1.5 text-caption text-muted md:block">{group.title}</span>
            {group.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: "exact" in item }}
                className="block whitespace-nowrap py-2 text-body text-prose md:py-2.5"
                activeProps={{ className: "font-bold text-ink", "aria-current": "page" }}
              >
                {item.label}
              </Link>
            ))}
            {group.title === "계정" ? (
              <button
                type="button"
                onClick={onLogout}
                className="block whitespace-nowrap py-2 text-left text-body text-prose md:py-2.5"
              >
                로그아웃
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </nav>
  );
}
