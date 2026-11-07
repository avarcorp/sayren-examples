import type { CategoryNode } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { m } from "../i18n";

const ROW =
  "flex min-h-12 items-center border-line border-b px-1 text-body-lg hover:text-point-strong";

/** 모바일 메뉴 서랍 — 카테고리, 등급 모음, 내 메뉴, 고객센터 */
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
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        aria-label={m.site_menu_close()}
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={m.nav_categories()}
        className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col overflow-y-auto bg-page px-4 pb-8"
        onClickCapture={(event) => {
          // 메뉴 링크를 누르면 화면을 옮기면서 서랍을 닫는다
          if ((event.target as HTMLElement).closest("a")) onClose();
        }}
      >
        <div className="flex h-14 items-center justify-end">
          <button
            ref={closeRef}
            type="button"
            aria-label={m.site_menu_close()}
            className="inline-flex size-11 items-center justify-center"
            onClick={onClose}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <p className="pt-2 pb-1 font-bold text-caption text-muted">{m.nav_categories()}</p>
        <Link to="/products" className={ROW}>
          {m.nav_all()}
        </Link>
        {categories.map((category) => (
          <Link
            key={category.categoryId}
            to="/products"
            search={{ category: category.categoryId }}
            className={ROW}
          >
            {category.name}
          </Link>
        ))}
        <Link to="/collections" className={ROW}>
          {m.nav_grades()}
        </Link>
        <p className="pt-6 pb-1 font-bold text-caption text-muted">{m.nav_my()}</p>
        {signedIn ? (
          <>
            <Link to="/orders" className={ROW}>
              {m.account_orders()}
            </Link>
            <Link to="/account/wishlist" className={ROW}>
              {m.account_wishlist()}
            </Link>
            <Link to="/account" className={ROW}>
              {m.site_account()}
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className={ROW}>
              {m.nav_login()}
            </Link>
            <Link to="/guest-order" className={ROW}>
              {m.footer_guest_order()}
            </Link>
          </>
        )}
        <Link to="/help" className={ROW}>
          {m.nav_help()}
        </Link>
      </div>
    </div>
  );
}
