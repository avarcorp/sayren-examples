import type { ProductDetail } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { m } from "../i18n";
import { formatPrice } from "../lib/format";
import type { SellerInfo } from "../site/seller";
import { Fulfillment } from "./product-blocks";
import { buttonClass } from "./ui/button";

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border-line border-b">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 font-bold text-body-lg [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.6}
          className="size-5 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="min-w-0 pb-5 text-meta md:text-body">{children}</div>
    </details>
  );
}

/**
 * 반품·교환 배송비 — 상품 상세 응답(`fulfillment.shipping.returnDeliveryFee`·`exchangeDeliveryFee`, 상품·상점 환불 정책을
 * 합친 유효 값)을 쓴다. 배송 없는 상품은 배송비가 없다는 한 줄이다.
 */
export function returnFeeRows(
  fulfillment: ProductDetail["fulfillment"],
): { label: string; value: string }[] {
  if (fulfillment.type !== "SHIPPING") {
    return [{ label: m.seller_return_fee(), value: m.seller_no_shipping_fee() }];
  }
  const fee = (amount: number, text: (args: { fee: string }) => string) =>
    amount > 0 ? text({ fee: formatPrice(amount) }) : m.seller_return_fee_free();
  return [
    {
      label: m.seller_return_fee(),
      value: fee(fulfillment.shipping.returnDeliveryFee, m.seller_return_fee_value),
    },
    {
      label: m.seller_exchange_fee(),
      value: fee(fulfillment.shipping.exchangeDeliveryFee, m.seller_exchange_fee_value),
    },
  ];
}

function Rows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-2 md:grid-cols-[7.5rem_minmax(0,1fr)]">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-muted">{row.label}</dt>
          <dd className="min-w-0 break-words leading-relaxed">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * 판매자정보 탭 — 판매자 카드(로고·상점명·스토어홈·문의), 아코디언(판매자정보·반품/교환 안내·주의사항·쇼핑 안전거래 TIP),
 * 판매자 표(상호명·대표자·상세·개인정보 처리방침 링크), 맨 아래 사업자 정보 접기.
 * 셀러 자체 쇼핑몰이라 중개 플랫폼 고지문은 넣지 않는다. 상품정보 신고는 기능이 없어 넣지 않는다(GAPS G15).
 */
export function SellerSection({
  product,
  seller,
  storeName,
  onContact,
}: {
  product: ProductDetail;
  seller: SellerInfo;
  storeName: string;
  onContact: () => void;
}) {
  const businessRows = [
    { label: m.seller_company(), value: seller.companyName },
    { label: m.seller_ceo(), value: seller.ceo },
    { label: m.seller_business_number(), value: seller.businessNumber },
    { label: m.seller_mail_order(), value: seller.mailOrderNumber },
    { label: m.seller_address(), value: seller.address },
    { label: m.seller_phone(), value: `${seller.phone} (${seller.businessHours})` },
    { label: m.seller_email(), value: seller.email },
  ];
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4 border border-line p-4 md:p-5">
        {seller.logoUrl ? (
          <img
            src={seller.logoUrl}
            alt={storeName}
            className="size-14 shrink-0 border border-line object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center bg-ink font-bold text-lg text-white"
          >
            {storeName.slice(0, 1)}
          </span>
        )}
        <p className="min-w-0 flex-1 break-words font-bold text-body-lg">{storeName}</p>
        <div className="flex w-full gap-2 sm:w-auto">
          <Link
            to="/"
            className={buttonClass({
              variant: "subtle",
              size: "sm",
              className: "flex-1 sm:flex-none",
            })}
          >
            {m.seller_store_home()}
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.6} />
          </Link>
          <button
            type="button"
            onClick={onContact}
            className={buttonClass({
              variant: "primary",
              size: "sm",
              className: "flex-1 sm:flex-none",
            })}
          >
            {m.seller_contact()}
          </button>
        </div>
      </div>

      <div className="border-ink border-t">
        <Accordion title={m.seller_info()}>
          <Rows rows={businessRows} />
        </Accordion>
        <Accordion title={m.seller_returns()} defaultOpen>
          <div className="space-y-5">
            <Rows
              rows={[
                ...returnFeeRows(product.fulfillment),
                { label: m.seller_return_address(), value: seller.returnAddress },
                {
                  label: m.seller_return_period(),
                  value: m.seller_return_period_value({ days: product.returnPeriodDays }),
                },
                { label: m.seller_return_reject(), value: m.seller_return_reject_value() },
                { label: m.seller_withdrawal(), value: m.seller_withdrawal_value() },
              ]}
            />
            <Fulfillment product={product} />
          </div>
        </Accordion>
        <Accordion title={m.seller_caution()}>
          <ul className="list-disc space-y-1 pl-5">
            <li>{m.seller_caution_value_1()}</li>
            <li>{m.seller_caution_value_2()}</li>
            <li>{m.seller_caution_value_3()}</li>
          </ul>
        </Accordion>
        <Accordion title={m.seller_safety_tip()}>
          <ul className="list-disc space-y-1 pl-5">
            <li>{m.seller_safety_value_1()}</li>
            <li>{m.seller_safety_value_2()}</li>
            <li>{m.seller_safety_value_3()}</li>
          </ul>
        </Accordion>
      </div>

      <div className="text-meta md:text-body">
        <Rows
          rows={[
            { label: m.seller_company(), value: seller.companyName },
            {
              label: m.seller_ceo(),
              value: (
                <span className="flex flex-col gap-1.5">
                  <span className="block">{seller.ceo}</span>
                  <span className="flex flex-wrap gap-1.5">
                    <Link to="/help" className={buttonClass({ variant: "subtle", size: "xs" })}>
                      {m.seller_detail_link()}
                      <ChevronRight aria-hidden="true" className="size-3.5" strokeWidth={1.6} />
                    </Link>
                    <Link to="/privacy" className={buttonClass({ variant: "subtle", size: "xs" })}>
                      {m.seller_privacy_link()}
                      <ChevronRight aria-hidden="true" className="size-3.5" strokeWidth={1.6} />
                    </Link>
                  </span>
                </span>
              ),
            },
          ]}
        />
      </div>

      <details className="border-line border-t pt-3 text-caption text-muted">
        <summary className="cursor-pointer">
          {m.seller_business_toggle({ name: seller.companyName })}
        </summary>
        <div className="pt-3">
          <Rows rows={businessRows} />
        </div>
      </details>
    </div>
  );
}
