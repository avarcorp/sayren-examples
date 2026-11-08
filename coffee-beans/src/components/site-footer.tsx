import { sellerInfoOf } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { useStore } from "../hooks/use-catalog";
import { m } from "../i18n";

/** 공통 푸터 — 링크, 판매자 정보(값이 있는 항목만, sellerInfoOf), 운영 시간 */
export function SiteFooter() {
  const store = useStore();
  const rows = sellerInfoOf(store);
  const link = "min-h-11 inline-flex items-center text-meta text-sub hover:text-point";
  return (
    <footer className="mt-16 border-line border-t">
      <div className="mx-auto flex max-w-page flex-col gap-6 px-4 py-10 md:px-6">
        <nav className="flex flex-wrap gap-x-5">
          <Link to="/help" className={link}>
            {m.footer_help()}
          </Link>
          <Link to="/terms" className={link}>
            {m.footer_terms()}
          </Link>
          <Link to="/privacy" className={`${link} font-semibold text-ink`}>
            {m.footer_privacy()}
          </Link>
          <Link to="/account/support" className={link}>
            {m.footer_support()}
          </Link>
          <Link to="/guest-order" className={link}>
            {m.nav_guest_order()}
          </Link>
        </nav>
        <div className="flex flex-col gap-1">
          <p className="font-bold text-body">{store.name}</p>
          {store.businessHours ? (
            <p className="text-caption text-muted">
              {m.footer_hours({ hours: store.businessHours })}
            </p>
          ) : null}
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-caption text-muted">
            {rows.map((row) => (
              <div key={row.field} className="contents">
                <dt>{m[`seller_${row.field}` as const]()}</dt>
                <dd className="min-w-0 break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </footer>
  );
}
