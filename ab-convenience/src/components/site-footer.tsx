import { Link } from "@tanstack/react-router";
import { lazyMessages, m } from "../i18n";
import type { FooterLayout } from "../site/layout-schema";
import { type SellerInfo, sellerInfoOf } from "../site/seller";
import { fill, SiteLink } from "../site/site-link";
import type { StoreBrand } from "./site-header";

/** 푸터에 쓰는 고객센터 정보 — `GET /store` */
export interface StoreContact {
  phone: string | null;
  businessHours: string | null;
}

const SOCIAL_LABELS = lazyMessages<FooterLayout["social"][number]["kind"]>({
  instagram: () => m.site_footer_social_instagram(),
  youtube: () => m.site_footer_social_youtube(),
  facebook: () => m.site_footer_social_facebook(),
  x: () => m.site_footer_social_x(),
  blog: () => m.site_footer_social_blog(),
  kakao: () => m.site_footer_social_kakao(),
});

/**
 * 푸터 — 모양(simple·columns·minimal)·문구·링크·SNS는 `src/site/layout.json`의 `footer`다(null이면 그리지 않는다).
 * 주문 내역·비회원 주문 조회·내 정보는 설정과 무관하게 늘 보인다.
 */
export function SiteFooter({
  layout,
  store,
  contact,
  seller: sellerFromRoot = null,
  showCart = true,
}: {
  layout: FooterLayout;
  store: StoreBrand | null;
  contact: StoreContact | null;
  /** 사업자 정보 — 루트 loader가 `sellerInfoOf`로 만든다 */
  seller?: SellerInfo | null;
  showCart?: boolean;
}) {
  const name = store?.name ?? m.site_store_fallback();
  const linkClass = "text-muted hover:text-ink";
  const shopping = (
    <>
      {showCart ? (
        <Link to="/cart" className={linkClass}>
          {m.site_footer_cart()}
        </Link>
      ) : null}
      <Link to="/orders" className={linkClass}>
        {m.site_footer_orders()}
      </Link>
      <Link to="/guest-order" className={linkClass}>
        {m.site_footer_guest_order()}
      </Link>
      <Link to="/account" className={linkClass}>
        {m.site_footer_account()}
      </Link>
    </>
  );
  const custom = layout.links.map((link) => (
    <SiteLink key={`${link.label}-${link.to}`} to={link.to} className={linkClass}>
      {link.label}
    </SiteLink>
  ));
  const social = layout.social.map((item) => (
    <a
      key={item.url}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {SOCIAL_LABELS[item.kind]}
    </a>
  ));
  const info = (
    <div className="space-y-1 text-muted text-sm">
      <p className="font-semibold text-ink">{name}</p>
      {layout.text ? <p className="whitespace-pre-line">{fill(layout.text, name)}</p> : null}
      {contact?.phone ? <p>{m.site_footer_phone({ phone: contact.phone })}</p> : null}
      {contact?.businessHours ? (
        <p>{m.site_footer_business_hours({ hours: contact.businessHours })}</p>
      ) : null}
    </div>
  );

  if (layout.variant === "columns") {
    const seller = sellerFromRoot ?? sellerInfoOf(null);
    // 개인정보처리방침은 국내 관행대로 굵게 보인다
    const infoLinks = layout.links.map((link) => (
      <SiteLink
        key={`${link.label}-${link.to}`}
        to={link.to}
        className={
          link.to === "/privacy" ? "font-bold text-ink hover:underline" : "text-sub hover:text-ink"
        }
      >
        {link.label}
      </SiteLink>
    ));
    const business = [
      m.site_footer_company({ name: seller.companyName, ceo: seller.ceo }),
      m.site_footer_business_number({ number: seller.businessNumber }),
      m.site_footer_mail_order({ number: seller.mailOrderNumber }),
      m.site_footer_address({ address: seller.address }),
      m.site_footer_email({ email: seller.email }),
      m.site_footer_privacy_officer({ name: seller.privacyOfficer }),
    ];
    const tel = seller.phone.replace(/[^0-9+]/g, "");
    return (
      <footer className="border-line border-t bg-page">
        <div className="border-line border-b">
          <nav
            aria-label={m.site_footer_info_menu()}
            className="mx-auto flex w-full max-w-page flex-wrap gap-x-5 gap-y-2 px-4 py-4 text-meta md:px-10"
          >
            {infoLinks}
          </nav>
        </div>
        <div className="mx-auto grid w-full max-w-page gap-8 px-4 py-8 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_auto] md:gap-12 md:px-10 md:py-10">
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="font-bold text-body">{m.site_footer_customer_center()}</p>
            {tel ? (
              <a
                href={`tel:${tel}`}
                className="font-extrabold text-2xl text-ink tracking-tight tabular-nums"
              >
                {seller.phone}
              </a>
            ) : null}
            <p className="text-caption text-sub">{seller.businessHours}</p>
            {layout.text ? (
              <p className="whitespace-pre-line pt-3 text-caption text-muted">
                {fill(layout.text, name)}
              </p>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5 text-caption text-muted leading-relaxed">
            <p className="font-bold text-body text-ink">{name}</p>
            <p className="flex flex-wrap gap-x-3 gap-y-0.5">
              {business.map((line) => (
                <span key={line} className="break-words">
                  {line}
                </span>
              ))}
            </p>
          </div>
          <nav
            aria-label={m.site_footer_shopping_menu()}
            className="flex flex-wrap gap-x-5 gap-y-2 text-meta md:flex-col md:items-end"
          >
            {shopping}
            {social}
          </nav>
        </div>
        <p className="mx-auto w-full max-w-page px-4 pb-8 text-caption text-muted md:px-10">
          {m.site_footer_copyright({ name })}
        </p>
      </footer>
    );
  }

  if (layout.variant === "minimal") {
    return (
      <footer className="border-line border-t">
        <nav
          aria-label={m.site_footer_menu()}
          className="mx-auto flex w-full max-w-page flex-wrap items-center gap-4 px-4 py-6 text-sm md:px-10"
        >
          <span className="font-semibold">{name}</span>
          {shopping}
          {custom}
          {social}
        </nav>
      </footer>
    );
  }

  return (
    <footer className="border-line border-t">
      <div className="mx-auto w-full max-w-page space-y-4 px-4 py-8 text-sm md:px-10">
        <nav aria-label={m.site_footer_menu()} className="flex flex-wrap gap-4">
          {shopping}
          {custom}
          {social}
        </nav>
        {info}
      </div>
    </footer>
  );
}
