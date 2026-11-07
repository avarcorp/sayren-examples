import type { CategoryNode } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { m } from "../../i18n";
import { Sheet } from "../ui/sheet";

const ROW = "flex min-h-12 items-center border-line border-b text-body";

/** 모바일 메뉴 서랍 — 카테고리와 내 메뉴 */
export function MobileDrawer({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryNode[];
}) {
  return (
    <Sheet open={open} onClose={onClose} title={m.nav_menu()} side="left">
      <nav aria-label={m.nav_categories()}>
        <p className="pb-1 text-caption text-muted">{m.nav_shop()}</p>
        <ul>
          <li>
            <Link to="/products" className={ROW} onClick={onClose}>
              {m.nav_all()}
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.categoryId}>
              <Link
                to="/products"
                search={{ category: category.categoryId }}
                className={ROW}
                onClick={onClose}
              >
                {category.name}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/collections" className={ROW} onClick={onClose}>
              {m.nav_collections()}
            </Link>
          </li>
        </ul>
      </nav>
      <nav aria-label={m.nav_my()}>
        <p className="pb-1 text-caption text-muted">{m.nav_my()}</p>
        <ul>
          <li>
            <Link to="/orders" className={ROW} onClick={onClose}>
              {m.account_orders()}
            </Link>
          </li>
          <li>
            <Link to="/account" className={ROW} onClick={onClose}>
              {m.nav_account()}
            </Link>
          </li>
          <li>
            <Link to="/guest-order" className={ROW} onClick={onClose}>
              {m.nav_guest_order()}
            </Link>
          </li>
          <li>
            <Link to="/help" className={ROW} onClick={onClose}>
              {m.nav_help()}
            </Link>
          </li>
        </ul>
      </nav>
    </Sheet>
  );
}
