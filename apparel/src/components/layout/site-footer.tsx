import { Link } from "@tanstack/react-router";
import { useStore } from "../../hooks/use-catalog";
import { m } from "../../i18n";
import { SellerInfoRows } from "./seller-info";

const LINK = "flex min-h-11 items-center text-meta text-sub hover:text-ink";

/** 공통 바닥 — 링크와 사업자 정보(상점 설정에 값이 있는 항목만) */
export function SiteFooter() {
  const store = useStore();
  return (
    <footer className="mt-20 border-line border-t">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-10 md:grid-cols-[1fr_2fr] md:px-6">
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-body uppercase tracking-[0.08em]">
            {m.brand_wordmark()}
          </p>
          {store.businessHours ? (
            <p className="text-meta text-sub">{m.footer_hours({ hours: store.businessHours })}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-6">
          <nav aria-label={m.footer_links()}>
            <ul className="flex flex-wrap gap-x-5">
              <li>
                <Link to="/terms" className={LINK}>
                  {m.footer_terms()}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className={`${LINK} font-semibold text-ink`}>
                  {m.footer_privacy()}
                </Link>
              </li>
              <li>
                <Link to="/help" className={LINK}>
                  {m.nav_help()}
                </Link>
              </li>
              <li>
                <Link to="/account/support" className={LINK}>
                  {m.footer_support()}
                </Link>
              </li>
              <li>
                <Link to="/account/inquiries" className={LINK}>
                  {m.footer_inquiries()}
                </Link>
              </li>
            </ul>
          </nav>
          <SellerInfoRows
            store={store}
            className="grid gap-x-4 gap-y-1 text-caption text-muted sm:grid-cols-2"
          />
        </div>
      </div>
    </footer>
  );
}
