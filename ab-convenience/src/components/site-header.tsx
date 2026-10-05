import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { m } from "../i18n";
import { siteLayout } from "../site/layout";
import type { HeaderLayout } from "../site/layout-schema";
import { isNavActive } from "../site/nav";
import { SiteLink } from "../site/site-link";
import { CART_COUNT_KEY, cartCountQuery } from "./browse/cart-count";
import { MenuDrawer } from "./browse/menu-drawer";

/** 헤더에 쓰는 상점 정보 — `GET /store`의 이름·로고 */
export interface StoreBrand {
  name: string;
  logoUrl: string | null;
}

/** 주요 메뉴 한 칸 — 카테고리 이름 메뉴는 루트 loader가 목록 경로로 바꿔 둔다(`resolveNav`) */
export interface NavLink {
  label: string;
  to: string;
}

const linkClass = "hover:text-point";

/**
 * 확장 지점 — 로고·전역 내비게이션은 여기서 바꾼다. 모양(classic·centered·minimal)·띠 문구·주요 메뉴는
 * `src/site/layout.json`의 `header`다. 장바구니·주문 내역·내 정보는 설정과 무관하게 늘 보인다
 * (장바구니만 주문을 받지 않을 때 숨긴다).
 * 상점 이름·로고는 셀러가 상점 플랫폼 설정 › 상점 정보에서 정한 값이다. 로고가 있으면 로고를, 없으면 이름을 보인다.
 *
 * 띠 공지는 `<header>` 밖에 두어 스크롤하면 사라지고 헤더만 붙어 있다. 상품 상세의 탭은 `<header>` 높이로
 * 붙는 위치를 잰다 — `<header>`는 하나만 둔다. 모바일 검색 화면(`/search`)은 화면 자체의 검색 줄을 쓰고 헤더를 숨긴다.
 */
/** 모바일에서 카테고리 줄을 숨기는 경로(접두사) */
const COMPACT_PATHS = [
  "/products/",
  "/cart",
  "/checkout",
  "/account",
  "/orders",
  "/points",
  "/coupons",
];

export function SiteHeader({
  store,
  showCart = true,
  nav,
  layout = siteLayout.header,
}: {
  store: StoreBrand | null;
  /** 주문을 받지 않으면(`checkoutAvailable` false·카탈로그형) 장바구니를 숨긴다 */
  showCart?: boolean;
  /** 주요 메뉴 — 없으면 설정의 경로 메뉴만 쓴다 */
  nav?: NavLink[];
  layout?: HeaderLayout;
}) {
  const name = store?.name ?? m.site_store_fallback();
  const onSearch = useRouterState({ select: (state) => state.location.pathname === "/search" });
  const hideOnMobile = onSearch ? "max-md:hidden" : "";
  const menu: NavLink[] =
    nav ?? layout.nav.flatMap((item) => ("to" in item ? [{ label: item.label, to: item.to }] : []));
  const logo = (
    <Link to="/" className="flex min-w-0 items-center gap-2">
      {store?.logoUrl ? (
        <img src={store.logoUrl} alt={name} className="h-7 w-auto md:h-8" />
      ) : (
        <span className="truncate">{name}</span>
      )}
    </Link>
  );
  const menuLinks = menu.map((item) => (
    <SiteLink key={`${item.label}-${item.to}`} to={item.to} className={linkClass}>
      {item.label}
    </SiteLink>
  ));
  const utilities = (
    <>
      {showCart ? (
        <Link to="/cart" className={linkClass}>
          {m.site_header_cart()}
        </Link>
      ) : null}
      <Link to="/orders" className={linkClass}>
        {m.site_header_orders()}
      </Link>
      <Link to="/account" className={linkClass}>
        {m.site_header_account()}
      </Link>
    </>
  );
  const announcement = layout.announcement ? (
    <div
      className={`flex min-h-9 items-center justify-center bg-brand-strong px-4 py-2 text-center text-caption text-white md:text-meta ${hideOnMobile}`}
    >
      {layout.announcement.to ? (
        <SiteLink to={layout.announcement.to} className="hover:underline">
          {layout.announcement.text}
        </SiteLink>
      ) : (
        layout.announcement.text
      )}
    </div>
  ) : null;

  if (layout.variant === "centered") {
    return (
      <>
        {announcement}
        <header className={`border-line border-b ${hideOnMobile}`}>
          <div className="mx-auto w-full max-w-page space-y-3 px-4 py-4 md:px-10">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <span />
              <div className="flex min-w-0 font-bold text-lg">{logo}</div>
              <nav aria-label={m.site_header_my_menu()} className="flex justify-end gap-4 text-sm">
                {utilities}
              </nav>
            </div>
            {menu.length ? (
              <nav
                aria-label={m.site_header_main_menu()}
                className="flex flex-wrap items-center justify-center gap-6 text-sm"
              >
                {menuLinks}
              </nav>
            ) : null}
          </div>
        </header>
      </>
    );
  }

  if (layout.variant === "minimal") {
    return (
      <>
        {announcement}
        <header className={`border-line border-b ${hideOnMobile}`}>
          <div className="mx-auto flex w-full max-w-page items-center justify-between gap-3 px-4 py-4 md:px-10">
            <div className="flex min-w-0 font-bold text-lg">{logo}</div>
            <div className="flex items-center gap-4 text-sm">
              {showCart ? (
                <Link to="/cart" className={linkClass}>
                  {m.site_header_cart()}
                </Link>
              ) : null}
              {/* 메뉴는 서랍 — 자바스크립트 없이 열린다 */}
              <details className="relative">
                <summary className="cursor-pointer list-none">{m.site_header_menu()}</summary>
                <nav
                  aria-label={m.site_header_main_menu()}
                  className="absolute right-0 z-20 mt-3 flex w-48 flex-col gap-3 rounded-card border border-line bg-page p-4 shadow-sm"
                >
                  {menuLinks}
                  <Link to="/orders" className={linkClass}>
                    {m.site_header_orders()}
                  </Link>
                  <Link to="/account" className={linkClass}>
                    {m.site_header_account()}
                  </Link>
                </nav>
              </details>
            </div>
          </div>
        </header>
      </>
    );
  }

  // classic — 국내 패션몰 GNB: 로고·검색·아이콘 줄(80) + 카테고리 줄(48). 모바일은 52 한 줄 + 가로로 넘기는 카테고리 줄
  return (
    <>
      {announcement}
      <ClassicHeader logo={logo} menu={menu} showCart={showCart} className={hideOnMobile} />
    </>
  );
}

const ICON = "size-5 shrink-0";
const STROKE = 1.6;

function ClassicHeader({
  logo,
  menu,
  showCart,
  className,
}: {
  logo: ReactNode;
  menu: NavLink[];
  showCart: boolean;
  className: string;
}) {
  const router = useRouter();
  const location = useRouterState({ select: (state) => state.location });
  const home = location.pathname === "/";
  // 상품 상세·구매 흐름(장바구니·주문서)·마이페이지의 모바일은 카테고리 줄을 서랍으로 옮겨 화면을 넓게 쓴다
  const compact = COMPACT_PATHS.some((prefix) => location.pathname.startsWith(prefix));
  const [drawer, setDrawer] = useState(false);
  const closeDrawer = useCallback(() => setDrawer(false), []);
  const cartCount = useCartCount(showCart, location.pathname);

  // 화면을 옮기면 서랍을 닫는다
  // biome-ignore lint/correctness/useExhaustiveDependencies: 경로가 바뀔 때만 닫는다
  useEffect(() => setDrawer(false), [location.pathname, location.searchStr]);

  const iconButton = "flex size-11 shrink-0 items-center justify-center";
  const mobileMenuButton = (
    <button
      type="button"
      aria-label={m.site_header_open_menu()}
      aria-expanded={drawer}
      onClick={() => setDrawer(true)}
      className={iconButton}
    >
      <Menu aria-hidden="true" className={ICON} strokeWidth={STROKE} />
    </button>
  );
  const cartLink = showCart ? (
    <Link to="/cart" className={`${iconButton} relative`}>
      <ShoppingBag aria-hidden="true" className={ICON} strokeWidth={STROKE} />
      <span className="sr-only">{m.site_header_cart()}</span>
      <CartBadge count={cartCount} className="top-1.5 right-0.5" />
    </Link>
  ) : null;
  const deskIcon = "relative flex flex-col items-center gap-1 text-caption hover:text-sub";

  return (
    <header className={`sticky top-0 z-30 border-line border-b bg-page ${className}`}>
      {/* 모바일 52 — 하위 화면: 뒤로·로고·검색·장바구니·메뉴 / 홈: 메뉴·로고·검색·장바구니 */}
      <div className="flex h-13 items-center gap-0.5 px-1.5 md:hidden">
        {home ? (
          mobileMenuButton
        ) : (
          <button
            type="button"
            aria-label={m.site_header_back()}
            onClick={() =>
              window.history.length > 1 ? router.history.back() : router.navigate({ to: "/" })
            }
            className={iconButton}
          >
            <ChevronLeft aria-hidden="true" className={ICON} strokeWidth={STROKE} />
          </button>
        )}
        <div className="flex min-w-0 flex-1 px-1 font-extrabold text-lg tracking-tight">{logo}</div>
        <Link to="/search" aria-label={m.site_header_search_open()} className={iconButton}>
          <Search aria-hidden="true" className={ICON} strokeWidth={STROKE} />
        </Link>
        {cartLink}
        {home ? null : mobileMenuButton}
      </div>

      {/* 데스크톱 80 — 로고 · 회색 면 검색 상자 · 아이콘+라벨 */}
      <div className="mx-auto hidden h-20 w-full max-w-page items-center gap-10 px-10 md:flex">
        <div className="flex min-w-0 shrink-0 font-extrabold text-[1.375rem] tracking-tight">
          {logo}
        </div>
        <HeaderSearch className="max-w-[30rem] flex-1" />
        <nav aria-label={m.site_header_my_menu()} className="ml-auto flex items-center gap-6">
          <Link to="/account" className={deskIcon}>
            <User aria-hidden="true" className={ICON} strokeWidth={STROKE} />
            {m.site_header_account()}
          </Link>
          <Link to="/account/wishlist" className={deskIcon}>
            <Heart aria-hidden="true" className={ICON} strokeWidth={STROKE} />
            {m.site_header_wishlist()}
          </Link>
          {showCart ? (
            <Link to="/cart" className={deskIcon}>
              <ShoppingBag aria-hidden="true" className={ICON} strokeWidth={STROKE} />
              {m.site_header_cart()}
              <CartBadge count={cartCount} className="-top-1.5 right-1" />
            </Link>
          ) : null}
        </nav>
      </div>

      {menu.length ? (
        <nav
          aria-label={m.site_header_main_menu()}
          className={`mx-auto w-full max-w-page md:px-10 ${compact ? "max-md:hidden" : ""}`}
        >
          <div className="flex h-11 gap-6 overflow-x-auto whitespace-nowrap px-4 font-bold text-body [scrollbar-width:none] md:h-12 md:gap-8 md:overflow-visible md:px-0 md:text-body-lg [&::-webkit-scrollbar]:hidden">
            {menu.map((item) => {
              const active = isNavActive(item.to, location);
              return (
                <SiteLink
                  key={`${item.label}-${item.to}`}
                  to={item.to}
                  className={`flex shrink-0 items-center border-b-2 ${
                    active ? "border-ink" : "border-transparent hover:border-line-strong"
                  }`}
                >
                  {item.label}
                </SiteLink>
              );
            })}
          </div>
        </nav>
      ) : null}

      <MenuDrawer
        open={drawer}
        onClose={closeDrawer}
        title={m.site_header_drawer_title()}
        closeLabel={m.site_header_drawer_close()}
      >
        <DrawerContent menu={menu} showCart={showCart} />
      </MenuDrawer>
    </header>
  );
}

function DrawerContent({ menu, showCart }: { menu: NavLink[]; showCart: boolean }) {
  const row = "flex h-12 items-center border-line border-b px-4 text-body";
  return (
    <div className="flex flex-col">
      {menu.length ? (
        <nav aria-label={m.site_header_drawer_categories()}>
          <h3 className="px-4 pt-5 pb-2 font-bold text-caption text-muted">
            {m.site_header_drawer_categories()}
          </h3>
          <div className="border-line border-t">
            {menu.map((item) => (
              <SiteLink
                key={`${item.label}-${item.to}`}
                to={item.to}
                className={`${row} font-bold`}
              >
                {item.label}
              </SiteLink>
            ))}
          </div>
        </nav>
      ) : null}
      <div className="h-2 bg-chip" />
      <nav aria-label={m.site_header_drawer_my()}>
        <h3 className="px-4 pt-5 pb-2 font-bold text-caption text-muted">
          {m.site_header_drawer_my()}
        </h3>
        <div className="border-line border-t">
          <Link to="/account" className={row}>
            {m.site_header_account()}
          </Link>
          <Link to="/orders" className={row}>
            {m.site_header_orders()}
          </Link>
          <Link to="/account/wishlist" className={row}>
            {m.site_header_wishlist()}
          </Link>
          {showCart ? (
            <Link to="/cart" className={row}>
              {m.site_header_cart()}
            </Link>
          ) : null}
          <Link to="/help" className={row}>
            {m.site_header_help()}
          </Link>
        </div>
      </nav>
    </div>
  );
}

/** 담긴 줄 수 — 0이면 숨긴다. 화면을 옮길 때마다 다시 받는다 */
function useCartCount(enabled: boolean, pathname: string): number {
  const queryClient = useQueryClient();
  const { data } = useQuery({ ...cartCountQuery(), enabled });
  // biome-ignore lint/correctness/useExhaustiveDependencies: 경로가 바뀔 때마다 다시 센다
  useEffect(() => {
    if (enabled) void queryClient.invalidateQueries({ queryKey: CART_COUNT_KEY });
  }, [enabled, pathname, queryClient]);
  return data ?? 0;
}

function CartBadge({ count, className }: { count: number; className: string }) {
  if (count <= 0) return null;
  return (
    <>
      <span
        aria-hidden="true"
        className={`absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-point px-1 font-bold text-[0.625rem] text-white leading-none ${className}`}
      >
        {count > 99 ? "99+" : count}
      </span>
      <span className="sr-only">{m.site_header_cart_count({ count })}</span>
    </>
  );
}

/**
 * 헤더 검색 상자 — 회색 면. 자바스크립트 없이도 검색 화면으로 GET 제출되고(`/search?q=`), 하이드레이션 뒤에는
 * 화면을 새로 그리지 않고 이동한다. 빈 검색은 검색 화면(최근·추천 검색어)으로 간다.
 */
function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <search className={className}>
      <form
        action="/search"
        method="get"
        className="flex h-11 w-full items-center bg-chip pr-1 pl-4"
        onSubmit={(event) => {
          event.preventDefault();
          const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
          void router.navigate({ to: "/search", search: q ? { q } : {} });
        }}
      >
        <input
          type="search"
          name="q"
          aria-label={m.products_search()}
          placeholder={m.site_header_search_placeholder()}
          className="h-full min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="submit"
          aria-label={m.products_search_submit()}
          className="flex size-10 shrink-0 items-center justify-center"
        >
          <Search aria-hidden="true" className={ICON} strokeWidth={STROKE} />
        </button>
      </form>
    </search>
  );
}
