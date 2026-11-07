import { type SellerInfoField, type StorefrontStore, sellerInfoOf } from "@sayren/storefront-sdk";
import { lazyMessages, m } from "../../i18n";

const LABELS = lazyMessages<SellerInfoField>({
  businessName: () => m.seller_business_name(),
  representativeName: () => m.seller_representative(),
  businessNumber: () => m.seller_business_number(),
  mailOrderSalesNumber: () => m.seller_mail_order(),
  businessAddress: () => m.seller_address(),
  customerCenterPhone: () => m.seller_phone(),
  customerCenterEmail: () => m.seller_email(),
  privacyOfficerName: () => m.seller_privacy_officer(),
  privacyOfficerEmail: () => m.seller_privacy_email(),
});

/** 판매자 정보 줄 — 상점 설정에 값이 있는 항목만(`sellerInfoOf`). 값이 하나도 없으면 아무것도 그리지 않는다 */
export function SellerInfoRows({
  store,
  className = "",
}: {
  store: StorefrontStore;
  className?: string;
}) {
  const rows = sellerInfoOf(store);
  if (rows.length === 0) return null;
  return (
    <dl className={className}>
      {rows.map((row) => (
        <div key={row.field} className="flex min-w-0 gap-2">
          <dt className="shrink-0">{LABELS[row.field]}</dt>
          <dd className="min-w-0 break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
