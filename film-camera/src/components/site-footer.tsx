import { type SellerInfoField, sellerInfoOf } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { useStore } from "../hooks/use-catalog";
import { lazyMessages, m } from "../i18n";

const SELLER_LABELS = lazyMessages<SellerInfoField>({
  businessName: () => m.seller_businessName(),
  representativeName: () => m.seller_representativeName(),
  businessNumber: () => m.seller_businessNumber(),
  mailOrderSalesNumber: () => m.seller_mailOrderSalesNumber(),
  businessAddress: () => m.seller_businessAddress(),
  customerCenterPhone: () => m.seller_customerCenterPhone(),
  customerCenterEmail: () => m.seller_customerCenterEmail(),
  privacyOfficerName: () => m.seller_privacyOfficerName(),
  privacyOfficerEmail: () => m.seller_privacyOfficerEmail(),
});

const LINK = "inline-flex min-h-11 items-center hover:text-point-strong lg:min-h-0 lg:py-1";

/** 공통 푸터 — 고객센터, 정책 링크, 사업자 정보(정한 항목만, `sellerInfoOf`) */
export function SiteFooter() {
  const store = useStore();
  const sellerInfo = sellerInfoOf(store);
  return (
    <footer className="mt-24 border-ink border-t">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-10 text-body lg:grid-cols-[1fr_1fr_2fr]">
        <section aria-labelledby="footer-cs" className="flex flex-col gap-2">
          <h2 id="footer-cs" className="font-bold text-body-lg">
            {m.footer_customer_center()}
          </h2>
          {store.customerCenterPhone ? (
            <p className="tabular font-bold text-xl">{store.customerCenterPhone}</p>
          ) : null}
          {store.customerCenterEmail ? (
            <a href={`mailto:${store.customerCenterEmail}`} className="break-all underline">
              {store.customerCenterEmail}
            </a>
          ) : null}
          {store.businessHours ? (
            <p className="text-sub">{m.footer_hours({ hours: store.businessHours })}</p>
          ) : null}
        </section>
        <nav aria-label={m.footer_customer_center()}>
          <ul className="flex flex-col text-sub">
            <li>
              <Link to="/terms" className={LINK}>
                {m.footer_terms()}
              </Link>
            </li>
            <li>
              <Link to="/privacy" className={`${LINK} font-bold text-ink`}>
                {m.footer_privacy()}
              </Link>
            </li>
            <li>
              <Link to="/help" className={LINK}>
                {m.footer_help()}
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
            <li>
              <Link to="/guest-order" className={LINK}>
                {m.footer_guest_order()}
              </Link>
            </li>
          </ul>
        </nav>
        <section aria-labelledby="footer-seller" className="flex flex-col gap-2 text-meta text-sub">
          <h2 id="footer-seller" className="font-bold text-body text-ink">
            {store.name}
          </h2>
          {sellerInfo.length > 0 ? (
            <dl className="flex flex-col gap-1">
              {sellerInfo.map((row) => (
                <div key={row.field} className="flex flex-wrap gap-x-2">
                  <dt>{SELLER_LABELS[row.field]}</dt>
                  <dd className="min-w-0 break-words text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {store.checkoutMode === "TEST" ? <p className="pt-2">{m.footer_test_mode()}</p> : null}
        </section>
      </div>
    </footer>
  );
}
