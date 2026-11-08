import type { CategoryNode } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect } from "react";
import { m } from "../i18n";

/** 모바일 메뉴 서랍 — 카테고리·내 메뉴·도움말. 흰 바탕, 44px 행 */
export function NavDrawer({
  open,
  onClose,
  categories,
  signedIn,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryNode[];
  signedIn: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const row = "flex min-h-11 items-center border-line border-b px-4 text-body-lg";
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={m.nav_close()}
        className="absolute inset-0 bg-ink/30"
        onClick={onClose}
      />
      <nav className="absolute inset-y-0 left-0 flex w-[82%] max-w-80 flex-col overflow-y-auto bg-page">
        <div className="flex min-h-14 items-center justify-between border-line border-b px-4">
          <span className="font-bold">{m.nav_menu()}</span>
          <button
            type="button"
            aria-label={m.nav_close()}
            className="grid size-11 place-items-center"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="px-4 pt-5 pb-2 font-semibold text-caption text-muted">{m.nav_shop()}</p>
        <Link to="/products" className={row} onClick={onClose}>
          {m.nav_all_products()}
        </Link>
        {categories.map((category) => (
          <Link
            key={category.categoryId}
            to="/products"
            search={{ category: category.categoryId }}
            className={row}
            onClick={onClose}
          >
            {category.name}
          </Link>
        ))}
        <Link to="/collections" className={row} onClick={onClose}>
          {m.nav_collections()}
        </Link>
        <p className="px-4 pt-5 pb-2 font-semibold text-caption text-muted">{m.nav_my()}</p>
        {signedIn ? (
          <>
            <Link to="/orders" className={row} onClick={onClose}>
              {m.account_menu_orders()}
            </Link>
            <Link to="/account" className={row} onClick={onClose}>
              {m.nav_mypage()}
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className={row} onClick={onClose}>
              {m.nav_login()}
            </Link>
            <Link to="/guest-order" className={row} onClick={onClose}>
              {m.nav_guest_order()}
            </Link>
          </>
        )}
        <Link to="/help" className={row} onClick={onClose}>
          {m.nav_help()}
        </Link>
      </nav>
    </div>
  );
}
