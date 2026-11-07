import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { useCart, useSession } from "../hooks/use-account";
import { useCategories, useStore } from "../hooks/use-catalog";
import { m } from "../i18n";
import { Logo } from "./marks";
import { NavDrawer } from "./nav-drawer";

const ICON_BUTTON =
  "relative inline-flex size-11 items-center justify-center text-ink hover:text-point-strong focus-visible:outline-2 focus-visible:outline-point";

/** 공통 헤더 — 띠 공지, 글자 로고, 카테고리 메뉴(데스크톱), 검색·마이·장바구니 */
export function SiteHeader() {
  const store = useStore();
  const categories = useCategories();
  const session = useSession();
  const cart = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const cartCount = cart.items.length;
  return (
    <header className="sticky top-0 z-30 border-line border-b bg-page">
      <p className="border-line border-b px-4 py-2 text-center text-caption text-sub">
        {m.site_announcement()}
      </p>
      <div className="mx-auto flex h-14 max-w-page items-center gap-2 px-2 lg:h-16 lg:px-4">
        <button
          type="button"
          className={`${ICON_BUTTON} lg:hidden`}
          aria-label={m.site_menu_open()}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
        <Link to="/" className="min-w-0 px-1 focus-visible:outline-2 focus-visible:outline-point">
          <Logo name={store.name} />
        </Link>
        <nav aria-label={m.nav_categories()} className="ml-8 hidden lg:block">
          <ul className="flex items-center gap-6 text-body">
            <li>
              <Link
                to="/products"
                className="py-2 hover:text-point-strong"
                activeProps={{ className: "font-bold" }}
                activeOptions={{ includeSearch: false, exact: true }}
              >
                {m.nav_all()}
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.categoryId}>
                <Link
                  to="/products"
                  search={{ category: category.categoryId }}
                  className="py-2 hover:text-point-strong"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/collections" className="py-2 hover:text-point-strong">
                {m.nav_grades()}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="ml-auto flex items-center">
          <Link to="/search" className={ICON_BUTTON} aria-label={m.site_search()}>
            <Search size={22} aria-hidden="true" />
          </Link>
          <Link
            to={session ? "/account" : "/login"}
            className={ICON_BUTTON}
            aria-label={session ? m.site_account() : m.nav_login()}
          >
            <User size={22} aria-hidden="true" />
          </Link>
          {store.checkoutAvailable ? (
            <Link
              to="/cart"
              className={ICON_BUTTON}
              aria-label={cartCount > 0 ? m.site_cart_count({ count: cartCount }) : m.site_cart()}
            >
              <ShoppingBag size={22} aria-hidden="true" />
              {cartCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="tabular absolute top-1.5 right-1 min-w-4 border border-point bg-page px-0.5 text-center font-bold text-[11px] text-point-strong leading-[14px]"
                >
                  {cartCount}
                </span>
              ) : null}
            </Link>
          ) : null}
        </div>
      </div>
      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        signedIn={session !== null}
      />
    </header>
  );
}
