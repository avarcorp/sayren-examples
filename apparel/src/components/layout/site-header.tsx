import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { useCategories, useShippingNotice, useStore } from "../../hooks/use-catalog";
import { m } from "../../i18n";
import { deliveryNoticeText } from "../../lib/delivery";
import { MobileDrawer } from "./mobile-drawer";

const ICON_BUTTON = "grid size-11 place-items-center text-ink hover:text-point";

/** 공통 머리 — 띠 공지 한 줄, 로고, 카테고리 메뉴(데스크톱), 검색·마이·장바구니 */
export function SiteHeader() {
  const store = useStore();
  const categories = useCategories();
  const shipping = useShippingNotice();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const announcement = shipping ? deliveryNoticeText(shipping.notice, shipping.currency) : null;

  return (
    <header className="sticky top-0 z-40 border-line border-b bg-page">
      {announcement ? (
        <p className="border-line border-b px-4 py-2 text-center text-caption text-sub">
          {announcement}
        </p>
      ) : null}
      <div className="mx-auto flex h-14 max-w-page items-center gap-2 px-2 md:h-16 md:px-6">
        <button
          type="button"
          className={`${ICON_BUTTON} md:hidden`}
          onClick={() => setDrawerOpen(true)}
          aria-label={m.nav_open_menu()}
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <Link
          to="/"
          className="flex min-h-11 items-center px-2 font-semibold text-body-lg uppercase tracking-[0.08em]"
        >
          {m.brand_wordmark()}
          <span className="sr-only">{store.name}</span>
        </Link>
        <nav aria-label={m.nav_categories()} className="ml-6 hidden md:block">
          <ul className="flex items-center gap-1">
            <li>
              <Link
                to="/products"
                className="flex min-h-11 items-center px-3 text-body hover:text-point"
                activeOptions={{ includeSearch: false }}
              >
                {m.nav_all()}
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.categoryId}>
                <Link
                  to="/products"
                  search={{ category: category.categoryId }}
                  className="flex min-h-11 items-center px-3 text-body hover:text-point"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/collections"
                className="flex min-h-11 items-center px-3 text-body hover:text-point"
              >
                {m.nav_collections()}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="ml-auto flex items-center">
          <Link to="/search" className={ICON_BUTTON} aria-label={m.nav_search()}>
            <Search className="size-5" aria-hidden />
          </Link>
          <Link to="/account" className={ICON_BUTTON} aria-label={m.nav_account()}>
            <User className="size-5" aria-hidden />
          </Link>
          {store.checkoutAvailable ? (
            <Link to="/cart" className={ICON_BUTTON} aria-label={m.nav_cart()}>
              <ShoppingBag className="size-5" aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
      />
    </header>
  );
}
