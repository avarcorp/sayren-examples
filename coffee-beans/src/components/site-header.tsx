import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { useCart, useSession } from "../hooks/use-account";
import { useCategories, useStore } from "../hooks/use-catalog";
import { m } from "../i18n";
import { AnnouncementBar } from "./announcement-bar";
import { Logo } from "./logo";
import { NavDrawer } from "./nav-drawer";

/** 공통 헤더 — 흰 바탕 56px. 모바일은 메뉴 서랍, 1024px 이상은 카테고리를 가로로 보인다 */
export function SiteHeader() {
  const store = useStore();
  const categories = useCategories();
  const member = useSession();
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const icon = "grid size-11 place-items-center text-ink";
  const count = cart.items.length;
  return (
    <header className="sticky top-0 z-40 bg-page">
      <AnnouncementBar />
      <div className="border-line border-b">
        <div className="mx-auto flex h-14 max-w-page items-center gap-1 px-2 md:px-4">
          <button
            type="button"
            aria-label={m.nav_menu()}
            className={`${icon} lg:hidden`}
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1 lg:flex-none">
            <Logo name={store.name} />
          </div>
          <nav className="hidden flex-1 items-center gap-6 pl-10 lg:flex">
            {categories.map((category) => (
              <Link
                key={category.categoryId}
                to="/products"
                search={{ category: category.categoryId }}
                className="text-body-lg hover:text-point"
              >
                {category.name}
              </Link>
            ))}
            <Link to="/collections" className="text-body-lg hover:text-point">
              {m.nav_collections()}
            </Link>
          </nav>
          <Link to="/search" aria-label={m.nav_search()} className={icon}>
            <Search className="size-5" />
          </Link>
          <Link to={member ? "/account" : "/login"} aria-label={m.nav_mypage()} className={icon}>
            <User className="size-5" />
          </Link>
          {store.checkoutAvailable ? (
            <Link to="/cart" aria-label={m.nav_cart()} className={`${icon} relative`}>
              <ShoppingBag className="size-5" />
              {count > 0 ? (
                <span className="absolute top-1.5 right-1 grid min-w-4 place-items-center rounded-full border border-point bg-page px-1 font-bold text-[10px] text-point tabular">
                  {count}
                </span>
              ) : null}
            </Link>
          ) : null}
        </div>
      </div>
      <NavDrawer
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        signedIn={member !== null}
      />
    </header>
  );
}
